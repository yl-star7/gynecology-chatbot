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

    const response = await GET(
      {
        nextUrl: new URL("http://localhost:3000/api/mobile/home?userId=user-1"),
      } as never,
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "mobile session token is required",
    });
  });
});
