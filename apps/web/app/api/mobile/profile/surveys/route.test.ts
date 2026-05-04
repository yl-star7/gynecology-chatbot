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
  mobileRouteErrorResponse: jest.fn((error: unknown, fallbackMessage: string) =>
    Response.json(
      { error: error instanceof Error ? error.message : fallbackMessage },
      { status: 500 },
    ),
  ),
}));

jest.mock("@/lib/db/admin-client", () => ({
  dbInsert: jest.fn(),
  dbSelect: jest.fn(),
  dbUpdate: jest.fn(),
}));

var adminDbSelectMock: jest.Mock;
var adminDbInsertMock: jest.Mock;
var adminDbUpdateMock: jest.Mock;

jest.mock("@/lib/db/admin-client", () => {
  adminDbSelectMock = jest.fn();
  adminDbInsertMock = jest.fn();
  adminDbUpdateMock = jest.fn();
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

    order(column: string, options: { ascending?: boolean } = {}) {
      this.orders.push(
        `${column}.${options.ascending === false ? "desc" : "asc"}`,
      );
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
      if (this.mode === "select") params.push(`select=${this.columns ?? "*"}`);
      params.push(...this.filters);
      if (this.orders.length > 0) params.push(`order=${this.orders.join(",")}`);
      if (typeof this.limitValue === "number")
        params.push(`limit=${this.limitValue}`);
      const path =
        params.length > 0 ? `${relation}?${params.join("&")}` : relation;
      const source =
        this.mode === "select"
          ? adminDbSelectMock(path)
          : this.mode === "insert"
            ? adminDbInsertMock(relation, this.payload)
            : adminDbUpdateMock(path, this.payload);
      return Promise.resolve(source).then((data) =>
        resolve({ data, error: null }),
      );
    }
  }

  return {
    dbSelect: adminDbSelectMock,
    dbInsert: adminDbInsertMock,
    dbUpdate: adminDbUpdateMock,
    getDbAdminClient: () => ({
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
import { POST } from "./route";

const mockedRequireMobileSession = requireMobileSession as jest.MockedFunction<
  typeof requireMobileSession
>;
const mockedDbSelect = dbSelect as jest.MockedFunction<
  typeof dbSelect
>;
const mockedDbInsert = dbInsert as jest.MockedFunction<
  typeof dbInsert
>;
const mockedDbUpdate = dbUpdate as jest.MockedFunction<
  typeof dbUpdate
>;

describe("POST /api/mobile/profile/surveys", () => {
  beforeEach(() => {
    mockedRequireMobileSession.mockReset();
    mockedDbSelect.mockReset();
    mockedDbInsert.mockReset();
    mockedDbUpdate.mockReset();
    adminDbSelectMock.mockImplementation((path: string) =>
      mockedDbSelect(path),
    );
    adminDbInsertMock.mockImplementation(
      (table: string, payload: unknown) =>
        mockedDbInsert(table, payload as never),
    );
    adminDbUpdateMock.mockImplementation(
      (path: string, payload: unknown) =>
        mockedDbUpdate(path, payload as never),
    );
  });

  it("stores a profile survey answer and marks the question event as answered", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      sessionId: "session-1",
      userId: "user-1",
    } as never);

    mockedDbSelect.mockImplementation((path: string) => {
      if (path.startsWith("content_week_questions?")) {
        return Promise.resolve([
          {
            id: "question-1",
            code: "daily-checkin",
            question_text: "오늘 가장 불편한 점이 있었나요?",
            question_type: "yes_no",
            help_text: "프로필에서 바로 답할 수 있어요.",
            question_payload: {
              yesLabel: "네",
              noLabel: "아니요",
            },
            display_order: 1,
            is_required: true,
          },
        ] as never);
      }

      if (path.startsWith("user_question_events?")) {
        return Promise.resolve([
          {
            id: "event-1",
            question_id: "question-1",
            status: "sent",
          },
        ] as never);
      }

      return Promise.resolve([] as never);
    });

    mockedDbInsert.mockResolvedValue([] as never);
    mockedDbUpdate.mockResolvedValue([] as never);

    const response = await POST(
      new Request(
        "http://localhost:3000/api/mobile/profile/surveys?userId=user-1",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "user-1",
            questionId: "question-1",
            answer: "네",
          }),
        },
      ) as never,
    );

    expect(response.status).toBe(200);
    expect(mockedDbInsert).toHaveBeenCalledWith(
      "calendar_logs",
      expect.objectContaining({
        user_id: "user-1",
        entry_type: "survey_response",
        title: "오늘 가장 불편한 점이 있었나요?",
        summary: "네",
      }),
    );
    expect(mockedDbUpdate).toHaveBeenCalledWith(
      "user_question_events?id=eq.event-1",
      expect.objectContaining({
        status: "answered",
        answer_message_id: null,
      }),
    );
  });
});
