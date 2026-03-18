jest.mock("@/lib/mobile/supabase-rest", () => ({
  supabaseInsert: jest.fn(),
  supabaseSelect: jest.fn(),
  supabaseUpdate: jest.fn(),
}));

import { buildPregnancyProfilePayload } from "@/lib/mobile/auth";

describe("buildPregnancyProfilePayload", () => {
  const baseMetrics = {
    pregnancyDayCount: 120,
    pregnancyWeek: 17,
    pregnancyDayInWeek: 1,
    dueDate: "2025-09-01",
  };

  test("prefers first-class columns over onboarding payload values", () => {
    const payload = buildPregnancyProfilePayload({
      pregnancyMetrics: baseMetrics,
      dueDate: baseMetrics.dueDate,
      pregnancyWeekOrDueDate: "2025-09-01",
      tonePreference: "calm",
      inputBabyNickname: undefined,
      inputNotificationTime: undefined,
      existingFirstClass: {
        babyNickname: "꾸미",
        notificationTime: "09:15",
        themeKey: "mint-neutral",
      },
      existingOnboardingPayload: {
        pregnancyWeekOrDueDate: "legacy",
        tonePreference: "bold",
        babyNickname: "other",
        hospitalName: "Old Hospital",
        notificationTime: "07:00",
        themeKey: "soft-peach",
      },
    });

    expect(payload.baby_nickname).toBe("꾸미");
    expect(payload.notification_time).toBe("09:15");
    expect(payload.theme_key).toBe("mint-neutral");
    expect(payload.onboarding_payload?.babyNickname).toBe("꾸미");
    expect(payload.onboarding_payload?.notificationTime).toBe("09:15");
    expect(payload.onboarding_payload?.themeKey).toBe("mint-neutral");
  });

  test("falls back to onboarding payload when first-class columns are empty", () => {
    const payload = buildPregnancyProfilePayload({
      pregnancyMetrics: baseMetrics,
      dueDate: null,
      pregnancyWeekOrDueDate: "legacy-week",
      tonePreference: "calm",
      inputBabyNickname: undefined,
      inputNotificationTime: undefined,
      existingFirstClass: {
        babyNickname: null,
        notificationTime: null,
      },
      existingOnboardingPayload: {
        pregnancyWeekOrDueDate: "legacy-week",
        tonePreference: "calm",
        babyNickname: "legacy-nickname",
        hospitalName: "Legacy Hospital",
        notificationTime: "07:20",
        themeKey: "soft-peach",
      },
    });

    expect(payload.baby_nickname).toBe("legacy-nickname");
    expect(payload.notification_time).toBe("07:20");
    expect(payload.theme_key).toBe("soft-peach");
    expect(payload.onboarding_payload?.hospitalName).toBe("Legacy Hospital");
  });

  test("defaults notificationTime to 08:30 when nothing is provided", () => {
    const payload = buildPregnancyProfilePayload({
      pregnancyMetrics: baseMetrics,
      dueDate: null,
      pregnancyWeekOrDueDate: null,
      tonePreference: "calm",
      existingOnboardingPayload: {},
    });

    expect(payload.notification_time).toBe("08:30");
    expect(payload.onboarding_payload?.notificationTime).toBe("08:30");
    expect(payload.theme_key).toBe("rose-sand");
  });
});
