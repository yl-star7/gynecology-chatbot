jest.mock("@/lib/mobile/auth", () => ({
  updateMobileProfile: jest.fn(),
}));

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

import { updateMobileProfile } from "@/lib/mobile/auth";
import { requireMobileSession } from "@/lib/mobile/session-auth";
import { PATCH } from "./route";

const mockedRequireMobileSession = requireMobileSession as jest.MockedFunction<
  typeof requireMobileSession
>;
const mockedUpdateMobileProfile = updateMobileProfile as jest.MockedFunction<
  typeof updateMobileProfile
>;

describe("PATCH /api/mobile/profile", () => {
  beforeEach(() => {
    mockedRequireMobileSession.mockReset();
    mockedUpdateMobileProfile.mockReset();
  });

  test("allows empty displayName when tonePreference is provided", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      sessionId: "session-1",
      userId: "user-1",
    });
    mockedUpdateMobileProfile.mockResolvedValue({
      id: "user-1",
      displayName: "사용자",
      phoneNumber: "01012345678",
      hasCompletedOnboarding: true,
    });

    const response = await PATCH(
      new Request("http://localhost:3000/api/mobile/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          displayName: "",
          tonePreference: "차분하게",
        }),
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(mockedUpdateMobileProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        displayName: "",
        tonePreference: "차분하게",
      }),
    );
  });

  test("returns 400 when tonePreference is missing", async () => {
    const response = await PATCH(
      new Request("http://localhost:3000/api/mobile/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          displayName: "홍길동",
          tonePreference: "",
        }),
      }) as never,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "상담 분위기를 선택해주세요.",
    });
    expect(mockedUpdateMobileProfile).not.toHaveBeenCalled();
  });
});
