jest.mock("@/lib/mobile/auth", () => ({
  updateMobileProfile: jest.fn(),
  hasCompletedProfileOnboarding: jest.fn((profile: {
    onboarding_payload?: {
      tonePreference?: string;
      pregnancyWeekOrDueDate?: string;
    } | null;
  } | null) =>
    Boolean(
      profile?.onboarding_payload?.tonePreference?.trim() &&
        profile?.onboarding_payload?.pregnancyWeekOrDueDate?.trim(),
    ),
  ),
}));

jest.mock("@/lib/mobile/session-auth", () => ({
  requireMobileSession: jest.fn(),
  mobileRouteErrorResponse: jest.fn((error: unknown, fallbackMessage: string) =>
    Response.json(
      { error: error instanceof Error ? error.message : fallbackMessage },
      { status: 500 },
    ),
  ),
}));

jest.mock("@/lib/mobile/supabase-rest", () => ({
  supabaseSelect: jest.fn(),
}));

jest.mock("@/lib/privacy/phone-crypto", () => ({
  decryptPhoneNumber: jest.fn((value: string) => value.replace(/^enc:/, "")),
}));

import { requireMobileSession } from "@/lib/mobile/session-auth";
import { supabaseSelect } from "@/lib/mobile/supabase-rest";
import { GET } from "./route";

const mockedRequireMobileSession = requireMobileSession as jest.MockedFunction<
  typeof requireMobileSession
>;
const mockedSupabaseSelect = supabaseSelect as jest.MockedFunction<
  typeof supabaseSelect
>;

describe("GET /api/mobile/profile", () => {
  beforeEach(() => {
    mockedRequireMobileSession.mockReset();
    mockedSupabaseSelect.mockReset();
  });

  it("does not treat an incomplete pregnancy profile row as completed onboarding", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      sessionId: "session-1",
      userId: "user-1",
    });
    mockedSupabaseSelect
      .mockResolvedValueOnce([
        {
          id: "user-1",
          phone_number_encrypted: "enc:01012345678",
          account_status: "active",
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          display_name: "김수연",
          pregnancy_day_count: 0,
          pregnancy_week: null,
          pregnancy_day_in_week: null,
          due_date: null,
          onboarding_payload: {
            tonePreference: "calm",
          },
          baby_nickname: null,
          notification_time: null,
          theme_key: null,
        },
      ] as never);

    const response = await GET(
      {
        nextUrl: new URL("http://localhost:3000/api/mobile/profile?userId=user-1"),
      } as never,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      profile: {
        userId: "user-1",
        hasCompletedOnboarding: false,
      },
    });
  });
});
