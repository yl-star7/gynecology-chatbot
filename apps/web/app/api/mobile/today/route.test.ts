jest.mock("@/lib/mobile/session-auth", () => ({
  requireMobileSession: jest.fn(),
  isMobileSessionError: jest.fn((error: unknown) => {
    return error instanceof Error && error.message === "mobile session token is required";
  }),
  mobileRouteErrorResponse: jest.fn((error: unknown, fallbackMessage: string) =>
    Response.json(
      { error: error instanceof Error ? error.message : fallbackMessage },
      {
        status:
          error instanceof Error && error.message === "mobile session token is required"
            ? 401
            : 500,
      },
    ),
  ),
}));

jest.mock("@/lib/mobile/supabase-rest", () => ({
  supabaseSelect: jest.fn(),
}));

import { requireMobileSession } from "@/lib/mobile/session-auth";
import { supabaseSelect } from "@/lib/mobile/supabase-rest";
import { GET } from "./route";

const mockedRequireMobileSession = requireMobileSession as jest.MockedFunction<
  typeof requireMobileSession
>;
const mockedSupabaseSelect = supabaseSelect as jest.MockedFunction<typeof supabaseSelect>;

describe("GET /api/mobile/today", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockedRequireMobileSession.mockReset();
    mockedSupabaseSelect.mockReset();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("returns today info cards and checklist completion from DB-backed rows", async () => {
    mockedRequireMobileSession.mockResolvedValue({ userId: "user-1" } as never);
    mockedSupabaseSelect
      .mockResolvedValueOnce([{ pregnancy_week: 1, pregnancy_day_in_week: 0 }] as never)
      .mockResolvedValueOnce([{ id: "week-1", baby_summary: "주차 요약", mother_summary: "엄마 요약" }] as never)
      .mockResolvedValueOnce([
        {
          baby_development_payload: { items: ["아기 발달 문장"] },
          baby_message: "아기 메시지",
          mother_changes_payload: { items: ["엄마 변화 문장"] },
        },
      ] as never)
      .mockResolvedValueOnce([{ id: "check-1", title: "엽산 보충제 섭취하기", description: null, display_order: 1 }] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([{ checklist_id: "check-1", status: "completed" }] as never);

    const response = await GET(
      {
        nextUrl: new URL("http://localhost:3000/api/mobile/today?userId=user-1"),
      } as never,
    );

    await expect(response.json()).resolves.toEqual({
      today: {
        babyBody: "아기 메시지",
        momBody: "엄마 변화 문장",
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
});
