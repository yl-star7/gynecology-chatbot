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

jest.mock("@/lib/supabase/admin-client", () => ({
  supabaseSelect: jest.fn(),
}));

jest.mock("@/lib/mobile/serializers", () => ({
  toHomeViewData: jest.fn(),
}));

import { requireMobileSession } from "@/lib/mobile/session-auth";
import { GET } from "./route";

const mockedRequireMobileSession = requireMobileSession as jest.MockedFunction<
  typeof requireMobileSession
>;

describe("GET /api/mobile/home", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockedRequireMobileSession.mockReset();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("returns 401 when the mobile session is missing", async () => {
    mockedRequireMobileSession.mockRejectedValue(
      new Error("mobile session token is required"),
    );

    const response = await GET({
      nextUrl: new URL("http://localhost:3000/api/mobile/home?userId=user-1"),
    } as never);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "mobile session token is required",
    });
  });

  it("uses the actual last day of the requested month for calendar range queries", async () => {
    const { supabaseSelect } = jest.requireMock("@/lib/supabase/admin-client") as {
      supabaseSelect: jest.Mock;
    };
    const { toHomeViewData } = jest.requireMock("@/lib/mobile/serializers") as {
      toHomeViewData: jest.Mock;
    };
    mockedRequireMobileSession.mockResolvedValue({ userId: "user-1" } as never);
    supabaseSelect
      .mockResolvedValueOnce([
        {
          display_name: "사용자",
          pregnancy_day_count: 192,
          pregnancy_week: 27,
          pregnancy_day_in_week: 3,
          due_date: "2026-07-01",
        },
      ])
      .mockResolvedValueOnce([]);
    toHomeViewData.mockReturnValue({ ok: true });

    const response = await GET({
      nextUrl: new URL("http://localhost:3000/api/mobile/home?userId=user-1&month=2026-04"),
    } as never);

    expect(response.status).toBe(200);
    expect(supabaseSelect).toHaveBeenNthCalledWith(
      2,
      "calendar_logs?select=date,summary,entry_type&user_id=eq.user-1&date=gte.2026-04-01&date=lte.2026-04-30",
    );
  });
});
