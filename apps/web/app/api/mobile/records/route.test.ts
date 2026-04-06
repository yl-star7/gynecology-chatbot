jest.mock("@/lib/mobile/session-auth", () => ({
  requireMobileSession: jest.fn(),
  mobileRouteErrorResponse: jest.fn((error: unknown, fallbackMessage: string) =>
    Response.json(
      { error: error instanceof Error ? error.message : fallbackMessage },
      { status: 500 },
    ),
  ),
}));

var adminSupabaseUpdateMock: jest.Mock;
var insertMock: jest.Mock;

jest.mock("@/lib/supabase/admin-client", () => {
  adminSupabaseUpdateMock = jest.fn();
  insertMock = jest.fn(() => ({ error: null }));

  return {
    getSupabaseAdminClient: jest.fn(() => ({
      from: jest.fn(() => ({
        insert: insertMock,
        select: jest.fn(),
      })),
    })),
    supabaseUpdate: adminSupabaseUpdateMock,
  };
});

import { requireMobileSession } from "@/lib/mobile/session-auth";
import { supabaseUpdate } from "@/lib/supabase/admin-client";
import { POST } from "./route";

const mockedRequireMobileSession = requireMobileSession as jest.MockedFunction<
  typeof requireMobileSession
>;
const mockedSupabaseUpdate = supabaseUpdate as jest.MockedFunction<
  typeof supabaseUpdate
>;

describe("POST /api/mobile/records", () => {
  beforeEach(() => {
    mockedRequireMobileSession.mockReset();
    mockedSupabaseUpdate.mockReset();
    insertMock.mockClear();
  });

  it("updates profileMemory.lastEmotionTone when emotion check-in is saved", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockedSupabaseUpdate.mockResolvedValue([] as never);

    const request = new Request("http://localhost:3000/api/mobile/records?userId=user-1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "user-1",
        sessionId: "session-1",
        emotionTone: "anxious",
      }),
    }) as Request & { nextUrl: URL };
    request.nextUrl = new URL(request.url);

    const response = await POST(request as never);

    expect(response.status).toBe(200);
    expect(mockedSupabaseUpdate).toHaveBeenCalledWith(
      "pregnancy_profiles?user_id=eq.user-1",
      expect.objectContaining({
        onboarding_payload: expect.objectContaining({
          profileMemory: expect.objectContaining({
            lastEmotionTone: "anxious",
          }),
        }),
      }),
    );
  });
});
