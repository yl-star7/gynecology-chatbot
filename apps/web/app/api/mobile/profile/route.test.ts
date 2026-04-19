jest.mock("@/lib/mobile/auth", () => ({
  updateMobileProfile: jest.fn(),
  hasCompletedProfileOnboarding: jest.fn(
    (
      profile: {
        onboarding_payload?: {
          tonePreference?: string;
          pregnancyWeekOrDueDate?: string;
        } | null;
      } | null,
    ) =>
      Boolean(
        profile?.onboarding_payload?.tonePreference?.trim() &&
        profile?.onboarding_payload?.pregnancyWeekOrDueDate?.trim(),
      ),
  ),
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

jest.mock("@/lib/supabase/admin-client", () => ({
  supabaseSelect: jest.fn(),
}));

jest.mock("@/lib/privacy/phone-crypto", () => ({
  decryptPhoneNumber: jest.fn((value: string) => value.replace(/^enc:/, "")),
}));

import { updateMobileProfile } from "@/lib/mobile/auth";
import { requireMobileSession } from "@/lib/mobile/session-auth";
import { supabaseSelect } from "@/lib/supabase/admin-client";
import { GET, PATCH } from "./route";

const mockedUpdateMobileProfile = updateMobileProfile as jest.MockedFunction<
  typeof updateMobileProfile
>;
const mockedRequireMobileSession = requireMobileSession as jest.MockedFunction<
  typeof requireMobileSession
>;
const mockedSupabaseSelect = supabaseSelect as jest.MockedFunction<
  typeof supabaseSelect
>;

describe("GET /api/mobile/profile", () => {
  beforeEach(() => {
    mockedUpdateMobileProfile.mockReset();
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

    const response = await GET({
      nextUrl: new URL(
        "http://localhost:3000/api/mobile/profile?userId=user-1",
      ),
    } as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      profile: {
        userId: "user-1",
        hasCompletedOnboarding: false,
      },
    });
  });

  it("includes unanswered profile surveys for the current pregnancy day", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      sessionId: "session-1",
      userId: "user-1",
    });

    mockedSupabaseSelect.mockImplementation((path: string) => {
      if (path.startsWith("users?")) {
        return Promise.resolve([
          {
            id: "user-1",
            phone_number_encrypted: "enc:01012345678",
            account_status: "active",
          },
        ] as never);
      }

      if (path.startsWith("pregnancy_profiles?")) {
        return Promise.resolve([
          {
            display_name: "김수연",
            pregnancy_day_count: 128,
            pregnancy_week: 19,
            pregnancy_day_in_week: 1,
            due_date: "2026-08-01",
            onboarding_payload: {
              tonePreference: "calm",
              pregnancyWeekOrDueDate: "19주 1일",
            },
            baby_nickname: "튼튼이",
            notification_time: "08:30",
            theme_key: "rose-sand",
          },
        ] as never);
      }

      if (path.startsWith("content_pregnancy_week_data?")) {
        return Promise.resolve([{ id: "week-19" }] as never);
      }

      if (
        path.includes("content_week_questions?") &&
        path.includes("day_number=eq.2")
      ) {
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

      if (
        path.includes("content_week_questions?") &&
        path.includes("day_number=is.null")
      ) {
        return Promise.resolve([] as never);
      }

      if (path.startsWith("user_question_events?")) {
        return Promise.resolve([] as never);
      }

      return Promise.resolve([] as never);
    });

    const response = await GET({
      nextUrl: new URL(
        "http://localhost:3000/api/mobile/profile?userId=user-1",
      ),
    } as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      profile: {
        userId: "user-1",
        pendingSurveys: [
          {
            id: "question-1",
            code: "daily-checkin",
            questionText: "오늘 가장 불편한 점이 있었나요?",
            questionType: "yes_no",
            choices: [
              { id: "yes", label: "네" },
              { id: "no", label: "아니요" },
            ],
            answered: false,
          },
        ],
      },
    });
  });

  it("still returns profile data when pending survey lookup fails", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      sessionId: "session-1",
      userId: "user-1",
    });

    mockedSupabaseSelect.mockImplementation((path: string) => {
      if (path.startsWith("users?")) {
        return Promise.resolve([
          {
            id: "user-1",
            phone_number_encrypted: "enc:01012345678",
            account_status: "active",
          },
        ] as never);
      }

      if (path.startsWith("pregnancy_profiles?")) {
        return Promise.resolve([
          {
            display_name: "김수연",
            pregnancy_day_count: 128,
            pregnancy_week: 19,
            pregnancy_day_in_week: 1,
            due_date: "2026-08-01",
            onboarding_payload: {
              tonePreference: "차분하게",
              pregnancyWeekOrDueDate: "2026-08-01",
              babyNickname: "튼튼이",
              hospitalName: "다정산부인과",
              notificationTime: "08:30",
              themeKey: "rose-sand",
            },
            baby_nickname: "튼튼이",
            notification_time: "08:30",
            theme_key: "rose-sand",
          },
        ] as never);
      }

      if (path.startsWith("content_pregnancy_week_data?")) {
        throw new Error(
          "Supabase select failed: relation content.week_questions does not exist",
        );
      }

      return Promise.resolve([] as never);
    });

    const response = await GET({
      nextUrl: new URL(
        "http://localhost:3000/api/mobile/profile?userId=user-1",
      ),
    } as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      profile: {
        userId: "user-1",
        babyNickname: "튼튼이",
        dueDate: "2026-08-01",
        tonePreference: "차분하게",
        hospitalName: "다정산부인과",
        notificationTime: "08:30",
        pendingSurveys: [],
      },
    });
  });
});

describe("PATCH /api/mobile/profile", () => {
  beforeEach(() => {
    mockedUpdateMobileProfile.mockReset();
    mockedRequireMobileSession.mockReset();
  });

  it("normalizes notification time before saving", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      sessionId: "session-1",
      userId: "user-1",
    });
    mockedUpdateMobileProfile.mockResolvedValue({
      id: "user-1",
      displayName: "김수연",
      phoneNumber: "01012345678",
      hasCompletedOnboarding: true,
    });

    const response = await PATCH(
      new Request("http://localhost:3000/api/mobile/profile", {
        method: "PATCH",
        body: JSON.stringify({
          userId: "user-1",
          displayName: "김수연",
          tonePreference: "차분하게",
          notificationTime: "830",
        }),
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(mockedUpdateMobileProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationTime: "08:30",
      }),
    );
  });

  it("returns a warm validation message for invalid notification time", async () => {
    const response = await PATCH(
      new Request("http://localhost:3000/api/mobile/profile", {
        method: "PATCH",
        body: JSON.stringify({
          userId: "user-1",
          displayName: "김수연",
          tonePreference: "차분하게",
          notificationTime: "25:99",
        }),
      }) as never,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "알림 시간은 08:00, 08:15, 08:30, 08:45처럼 입력해주세요.",
    });
    expect(mockedRequireMobileSession).not.toHaveBeenCalled();
    expect(mockedUpdateMobileProfile).not.toHaveBeenCalled();
  });

  it("rejects notification times outside the quarter-hour options", async () => {
    const response = await PATCH(
      new Request("http://localhost:3000/api/mobile/profile", {
        method: "PATCH",
        body: JSON.stringify({
          userId: "user-1",
          displayName: "김수연",
          tonePreference: "차분하게",
          notificationTime: "08:07",
        }),
      }) as never,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "알림 시간은 08:00, 08:15, 08:30, 08:45처럼 입력해주세요.",
    });
    expect(mockedRequireMobileSession).not.toHaveBeenCalled();
    expect(mockedUpdateMobileProfile).not.toHaveBeenCalled();
  });
});
