jest.mock("@/lib/mobile/session-auth", () => ({
  requireMobileSession: jest.fn(),
  mobileNoStoreJson: jest.fn((payload: unknown, init?: ResponseInit) =>
    Response.json(payload, {
      ...init,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        ...(init?.headers as Record<string, string> | undefined),
      },
    }),
  ),
  isMobileSessionError: jest.fn((error: unknown) => {
    return (
      error instanceof Error &&
      error.message === "mobile session token is required"
    );
  }),
  mobileRouteErrorResponse: jest.fn((error: unknown, fallbackMessage: string) =>
    Response.json(
      { error: error instanceof Error ? error.message : fallbackMessage },
      {
        status:
          error instanceof Error &&
          error.message === "mobile session token is required"
            ? 401
            : 500,
      },
    ),
  ),
}));

jest.mock("@/lib/db/admin-client", () => ({
  dbSelect: jest.fn(),
  dbInsert: jest.fn(),
  dbUpdate: jest.fn(),
}));

var adminSupabaseSelectMock: jest.Mock;
var adminSupabaseInsertMock: jest.Mock;
var adminSupabaseUpdateMock: jest.Mock;

jest.mock("@/lib/db/admin-client", () => {
  adminSupabaseSelectMock = jest.fn();
  adminSupabaseInsertMock = jest.fn();
  adminSupabaseUpdateMock = jest.fn();
  class QueryBuilder {
    private readonly schema?: string;
    private readonly table: string;
    private readonly mode: "select" | "insert" | "update";
    private readonly columns?: string;
    private readonly payload?: unknown;
    private readonly filters: string[] = [];
    private readonly orders: string[] = [];
    private limitValue?: number;

    constructor(input: {
      schema?: string;
      table: string;
      mode: "select" | "insert" | "update";
      columns?: string;
      payload?: unknown;
    }) {
      this.schema = input.schema;
      this.table = input.table;
      this.mode = input.mode;
      this.columns = input.columns;
      this.payload = input.payload;
    }

    eq(column: string, value: string | number | boolean) {
      this.filters.push(`${column}=eq.${value}`);
      return this;
    }

    is(column: string, value: boolean | null) {
      this.filters.push(`${column}=is.${value === null ? "null" : value}`);
      return this;
    }

    in(column: string, values: Array<string | number>) {
      this.filters.push(`${column}=in.(${values.join(",")})`);
      return this;
    }

    order(
      column: string,
      options: { ascending?: boolean; nullsFirst?: boolean } = {},
    ) {
      const direction = options.ascending === false ? "desc" : "asc";
      const nulls = options.nullsFirst === false ? ".nullslast" : "";
      this.orders.push(`${column}.${direction}${nulls}`);
      return this;
    }

    limit(value: number) {
      this.limitValue = value;
      return this;
    }

    select(columns?: string) {
      if (this.mode === "insert" || this.mode === "update") {
        return new QueryBuilder({
          schema: this.schema,
          table: this.table,
          mode: this.mode,
          columns,
          payload: this.payload,
        });
      }

      return new QueryBuilder({
        schema: this.schema,
        table: this.table,
        mode: "select",
        columns,
      });
    }

    insert(payload: unknown) {
      return new QueryBuilder({
        schema: this.schema,
        table: this.table,
        mode: "insert",
        payload,
      });
    }

    update(payload: unknown) {
      return new QueryBuilder({
        schema: this.schema,
        table: this.table,
        mode: "update",
        payload,
      });
    }

    then(resolve: (value: { data: unknown; error: null }) => unknown) {
      const relation = this.schema
        ? `${this.schema}.${this.table}`
        : this.table;
      const params: string[] = [];
      if (this.mode === "select") {
        params.push(`select=${this.columns ?? "*"}`);
      }
      params.push(...this.filters);
      if (this.orders.length > 0) {
        params.push(`order=${this.orders.join(",")}`);
      }
      if (typeof this.limitValue === "number") {
        params.push(`limit=${this.limitValue}`);
      }
      const path =
        params.length > 0 ? `${relation}?${params.join("&")}` : relation;
      const source =
        this.mode === "select"
          ? adminSupabaseSelectMock(path)
          : this.mode === "insert"
            ? adminSupabaseInsertMock(relation, this.payload)
            : adminSupabaseUpdateMock(path, this.payload);
      return Promise.resolve(source).then((data) =>
        resolve({ data, error: null }),
      );
    }
  }

  return {
    dbSelect: adminSupabaseSelectMock,
    dbInsert: adminSupabaseInsertMock,
    dbUpdate: adminSupabaseUpdateMock,
    getSupabaseAdminClient: () => ({
      from: (table: string) =>
        new QueryBuilder({ table, mode: "select", schema: undefined }),
      schema: (schema: string) => ({
        from: (table: string) =>
          new QueryBuilder({ table, mode: "select", schema }),
      }),
    }),
  };
});

import { requireMobileSession } from "@/lib/mobile/session-auth";
import {
  dbInsert,
  dbSelect,
  dbUpdate,
} from "@/lib/db/admin-client";
import { GET, PATCH } from "./route";

const mockedRequireMobileSession = requireMobileSession as jest.MockedFunction<
  typeof requireMobileSession
>;
const mockedSupabaseSelect = dbSelect as jest.MockedFunction<
  typeof dbSelect
>;
const mockedSupabaseInsert = dbInsert as jest.MockedFunction<
  typeof dbInsert
>;
const mockedSupabaseUpdate = dbUpdate as jest.MockedFunction<
  typeof dbUpdate
>;

describe("GET /api/mobile/today", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockedRequireMobileSession.mockReset();
    mockedSupabaseSelect.mockReset();
    mockedSupabaseInsert.mockReset();
    mockedSupabaseUpdate.mockReset();
    adminSupabaseSelectMock.mockImplementation((path: string) =>
      mockedSupabaseSelect(path),
    );
    adminSupabaseInsertMock.mockImplementation(
      (table: string, payload: unknown) =>
        mockedSupabaseInsert(table, payload as never),
    );
    adminSupabaseUpdateMock.mockImplementation(
      (path: string, payload: unknown) =>
        mockedSupabaseUpdate(path, payload as never),
    );
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("returns today info cards and checklist completion from DB-backed rows", async () => {
    mockedRequireMobileSession.mockResolvedValue({ userId: "user-1" } as never);
    mockedSupabaseSelect
      .mockResolvedValueOnce([
        { pregnancy_week: 1, pregnancy_day_in_week: 0, due_date: null },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: "week-1",
          baby_summary: "주차 요약",
          mother_summary: "엄마 요약",
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          baby_development_payload: { items: ["아기 발달 문장"] },
          baby_message: "아기 메시지",
          mother_changes_payload: { items: ["엄마 변화 문장"] },
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: "check-1",
          title: "엽산 보충제 섭취하기",
          description: null,
          display_order: 1,
        },
      ] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([{ id: "info-view-1" }] as never)
      .mockResolvedValueOnce([
        { checklist_id: "check-1", status: "completed" },
      ] as never);

    const response = await GET({
      nextUrl: new URL("http://localhost:3000/api/mobile/today?userId=user-1"),
    } as never);

    await expect(response.json()).resolves.toEqual({
      today: {
        babyBody: "아기 메시지",
        momBody: "엄마 변화 문장",
        infoViewed: true,
        postDue: false,
        checklistItems: [
          {
            id: "check-1",
            label: "엽산 보충제 섭취하기",
            completed: true,
          },
        ],
      },
    });
  });

  it("체크리스트 라벨에서 괄호 참고표기를 제거한다", async () => {
    mockedRequireMobileSession.mockResolvedValue({ userId: "user-1" } as never);
    mockedSupabaseSelect
      .mockResolvedValueOnce([
        { pregnancy_week: 1, pregnancy_day_in_week: 0, due_date: null },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: "week-1",
          baby_summary: "주차 요약",
          mother_summary: "엄마 요약",
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          baby_development_payload: { items: ["아기 발달 문장"] },
          baby_message: "아기 메시지",
          mother_changes_payload: { items: ["엄마 변화 문장"] },
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: "check-1",
          title: "가렵지 않게 자주 발라 주세요 (1)(3)(5)(8)",
          description: null,
          display_order: 1,
        },
      ] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never);

    const response = await GET({
      nextUrl: new URL("http://localhost:3000/api/mobile/today?userId=user-1"),
    } as never);

    await expect(response.json()).resolves.toEqual({
      today: {
        babyBody: "아기 메시지",
        momBody: "엄마 변화 문장",
        infoViewed: false,
        postDue: false,
        checklistItems: [
          {
            id: "check-1",
            label: "가렵지 않게 자주 발라 주세요",
            completed: false,
          },
        ],
      },
    });
  });

  it("due_date 기준으로 재계산한 주차와 day_number로 오늘 컨텐츠를 조회한다", async () => {
    // Compute expected week/day dynamically using the same logic as the route
    const dueDate = new Date("2026-07-01T00:00:00");
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const diffDays = Math.round(
      (dueDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
    );
    const pregnancyDayCount = Math.max(0, Math.min(294, 294 - diffDays));
    const expectedWeek = Math.max(
      1,
      Math.min(42, Math.floor(pregnancyDayCount / 7)),
    );
    const expectedDayNumber = (pregnancyDayCount % 7) + 1;

    mockedRequireMobileSession.mockResolvedValue({ userId: "user-1" } as never);
    mockedSupabaseSelect
      .mockResolvedValueOnce([
        {
          pregnancy_week: 14,
          pregnancy_day_in_week: 1,
          due_date: "2026-07-01",
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: `week-${expectedWeek}`,
          baby_summary: `${expectedWeek}주 아기 요약`,
          mother_summary: `${expectedWeek}주 엄마 요약`,
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          baby_development_payload: {
            items: [`${expectedWeek}주 ${expectedDayNumber}일 아기 발달`],
          },
          baby_message: null,
          mother_changes_payload: {
            items: [`${expectedWeek}주 ${expectedDayNumber}일 엄마 변화`],
          },
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: `check-${expectedWeek}-${expectedDayNumber}`,
          title: `${expectedWeek}주 ${expectedDayNumber}일 체크리스트`,
          description: null,
          display_order: 1,
        },
      ] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never);

    const response = await GET({
      nextUrl: new URL("http://localhost:3000/api/mobile/today?userId=user-1"),
    } as never);

    expect(response.status).toBe(200);
    expect(mockedSupabaseSelect).toHaveBeenCalledWith(
      expect.stringContaining(
        `content_pregnancy_week_data?select=id,baby_summary,mother_summary&week_number=eq.${expectedWeek}&status=eq.published&limit=1`,
      ),
    );
    expect(mockedSupabaseSelect).toHaveBeenCalledWith(
      expect.stringContaining(
        `content_pregnancy_day_contents?select=baby_development_payload,baby_message,mother_changes_payload&week_data_id=eq.week-${expectedWeek}&day_number=eq.${expectedDayNumber}&limit=1`,
      ),
    );
  });

  it("due_date가 과거(출산 후)인 프로필에서 postDue=true 반환", async () => {
    mockedRequireMobileSession.mockResolvedValue({ userId: "user-1" } as never);
    mockedSupabaseSelect
      .mockResolvedValueOnce([
        {
          pregnancy_week: null,
          pregnancy_day_in_week: null,
          due_date: "2020-01-01",
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: "week-40",
          baby_summary: "40주 아기 요약",
          mother_summary: "40주 엄마 요약",
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          baby_development_payload: { items: ["아기 발달 문장"] },
          baby_message: "아기 메시지",
          mother_changes_payload: { items: ["엄마 변화 문장"] },
        },
      ] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never);

    const response = await GET({
      nextUrl: new URL("http://localhost:3000/api/mobile/today?userId=user-1"),
    } as never);

    const body = await response.json();
    expect(body.today.postDue).toBe(true);
  });

  it("due_date 없이 DB 주차값 1 미만이면 1로 clamp됨", async () => {
    mockedRequireMobileSession.mockResolvedValue({ userId: "user-1" } as never);
    mockedSupabaseSelect
      .mockResolvedValueOnce([
        { pregnancy_week: -5, pregnancy_day_in_week: 0, due_date: null },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: "week-1",
          baby_summary: "1주 아기 요약",
          mother_summary: "1주 엄마 요약",
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          baby_development_payload: { items: ["아기 발달"] },
          baby_message: "아기 메시지",
          mother_changes_payload: { items: ["엄마 변화"] },
        },
      ] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never);

    const response = await GET({
      nextUrl: new URL("http://localhost:3000/api/mobile/today?userId=user-1"),
    } as never);

    expect(response.status).toBe(200);
    const weekQueryCall = mockedSupabaseSelect.mock.calls.find(
      ([path]: [string, unknown?]) =>
        path.includes("content_pregnancy_week_data") &&
        path.includes("week_number=eq.1") &&
        path.includes("status=eq.published"),
    );
    expect(weekQueryCall).toBeDefined();
  });

  it("due_date 없이 DB 주차값 42 초과이면 42로 clamp됨", async () => {
    mockedRequireMobileSession.mockResolvedValue({ userId: "user-1" } as never);
    mockedSupabaseSelect
      .mockResolvedValueOnce([
        { pregnancy_week: 99, pregnancy_day_in_week: 0, due_date: null },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: "week-42",
          baby_summary: "42주 요약",
          mother_summary: "42주 엄마",
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          baby_development_payload: { items: ["아기 발달"] },
          baby_message: "아기 메시지",
          mother_changes_payload: { items: ["엄마 변화"] },
        },
      ] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never);

    const response = await GET({
      nextUrl: new URL("http://localhost:3000/api/mobile/today?userId=user-1"),
    } as never);

    expect(response.status).toBe(200);
    const weekQueryCall = mockedSupabaseSelect.mock.calls.find(
      ([path]: [string, unknown?]) =>
        path.includes("content_pregnancy_week_data") &&
        path.includes("week_number=eq.42") &&
        path.includes("status=eq.published"),
    );
    expect(weekQueryCall).toBeDefined();
  });

  it("stores an info view event when the today info section is opened", async () => {
    mockedRequireMobileSession.mockResolvedValue({ userId: "user-1" } as never);
    mockedSupabaseSelect.mockResolvedValueOnce([] as never);
    mockedSupabaseInsert.mockResolvedValue({} as never);

    const response = await PATCH({
      nextUrl: new URL("http://localhost:3000/api/mobile/today?userId=user-1"),
      json: async () => ({ action: "view_info" }),
    } as never);

    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mockedSupabaseInsert).toHaveBeenCalledWith(
      "calendar_logs",
      expect.objectContaining({
        user_id: "user-1",
        entry_type: "today_info_view",
      }),
    );
  });
});
