jest.mock("@/lib/mobile/session-auth", () => ({
  requireMobileSession: jest.fn(),
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

jest.mock("@/lib/mobile/supabase-rest", () => ({
  supabaseSelect: jest.fn(),
  supabaseInsert: jest.fn(),
  supabaseUpdate: jest.fn(),
}));

import { requireMobileSession } from "@/lib/mobile/session-auth";
import { supabaseInsert, supabaseSelect } from "@/lib/mobile/supabase-rest";
import { GET, PATCH } from "./route";

const mockedRequireMobileSession = requireMobileSession as jest.MockedFunction<
  typeof requireMobileSession
>;
const mockedSupabaseSelect = supabaseSelect as jest.MockedFunction<
  typeof supabaseSelect
>;
const mockedSupabaseInsert = supabaseInsert as jest.MockedFunction<
  typeof supabaseInsert
>;

describe("GET /api/mobile/today", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockedRequireMobileSession.mockReset();
    mockedSupabaseSelect.mockReset();
    mockedSupabaseInsert.mockReset();
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
        path.includes("published_weeks") && path.includes("week_number=eq.1"),
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
        path.includes("published_weeks") && path.includes("week_number=eq.42"),
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
