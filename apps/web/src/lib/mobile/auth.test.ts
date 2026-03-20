jest.mock("@/lib/mobile/supabase-rest", () => ({
  supabaseInsert: jest.fn(),
  supabaseSelect: jest.fn(),
  supabaseUpdate: jest.fn(),
}));

jest.mock("@/lib/mobile/twilio-verify", () => {
  const actual = jest.requireActual("@/lib/mobile/twilio-verify");

  return {
    ...actual,
    checkSmsVerification: jest.fn(),
    sendSmsVerification: jest.fn(),
  };
});

jest.mock("@/lib/privacy/phone-crypto", () => ({
  computePhoneNumberBlindIndex: jest.fn((phoneNumber: string) => `idx:${phoneNumber}`),
  createPhoneNumberStorage: jest.fn((phoneNumber: string) => ({
    phoneNumberEncrypted: `enc:${phoneNumber}`,
    phoneNumberBlindIndex: `idx:${phoneNumber}`,
    phoneNumberLast4: phoneNumber.slice(-4),
  })),
  decryptPhoneNumber: jest.fn((value: string) => value.replace(/^enc:/, "")),
}));

import {
  buildPregnancyProfilePayload,
  completePhoneSignIn,
} from "@/lib/mobile/auth";
import {
  supabaseInsert,
  supabaseSelect,
  supabaseUpdate,
} from "@/lib/mobile/supabase-rest";
import { checkSmsVerification } from "@/lib/mobile/twilio-verify";

const mockedSupabaseInsert = jest.mocked(supabaseInsert);
const mockedSupabaseSelect = jest.mocked(supabaseSelect);
const mockedSupabaseUpdate = jest.mocked(supabaseUpdate);
const mockedCheckSmsVerification = jest.mocked(checkSmsVerification);

describe("completePhoneSignIn", () => {
  beforeEach(() => {
    mockedSupabaseInsert.mockReset();
    mockedSupabaseSelect.mockReset();
    mockedSupabaseUpdate.mockReset();
    mockedCheckSmsVerification.mockReset();
    mockedSupabaseUpdate.mockResolvedValue([]);
  });

  test("retries user creation with the allowed phone display name when a legacy users schema still requires it", async () => {
    mockedCheckSmsVerification.mockResolvedValue({
      sid: "check-1",
      status: "approved",
      to: "+821012345678",
    });
    mockedSupabaseSelect
      .mockResolvedValueOnce([
        {
          id: "allow-1",
          phone_number_encrypted: "enc:+821012345678",
          phone_number_last4: "5678",
          phone_number_blind_index: "idx:+821012345678",
          display_name: "김수연",
          note: null,
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "user-1",
          phone_number_encrypted: "enc:+821012345678",
          phone_number_last4: "5678",
          account_status: "active",
          phone_verified_at: "2026-03-19T00:00:00.000Z",
          last_login_at: "2026-03-19T00:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([]);
    mockedSupabaseInsert
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(
        new Error(
          'null value in column "display_name" of relation "users" violates not-null constraint',
        ),
      )
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await completePhoneSignIn("01012345678", "1234");

    expect(mockedSupabaseInsert).toHaveBeenNthCalledWith(
      3,
      "users",
      expect.objectContaining({
        display_name: "김수연",
        phone_number_encrypted: "enc:+821012345678",
        phone_number_blind_index: "idx:+821012345678",
        phone_number_last4: "5678",
        role: "user",
      }),
    );
    expect(result.user.displayName).toBe("김수연");
  });

  test('falls back to "사용자" when the legacy schema requires display_name but no allowed-phone display name exists', async () => {
    mockedCheckSmsVerification.mockResolvedValue({
      sid: "check-2",
      status: "approved",
      to: "+821055566677",
    });
    mockedSupabaseSelect
      .mockResolvedValueOnce([
        {
          id: "allow-2",
          phone_number_encrypted: "enc:+821055566677",
          phone_number_last4: "6677",
          phone_number_blind_index: "idx:+821055566677",
          display_name: null,
          note: null,
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "user-2",
          phone_number_encrypted: "enc:+821055566677",
          phone_number_last4: "6677",
          account_status: "active",
          phone_verified_at: "2026-03-19T00:00:00.000Z",
          last_login_at: "2026-03-19T00:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([]);
    mockedSupabaseInsert
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(
        new Error(
          'null value in column "display_name" of relation "users" violates not-null constraint',
        ),
      )
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await completePhoneSignIn("01055566677", "1234");

    expect(mockedSupabaseInsert).toHaveBeenNthCalledWith(
      3,
      "users",
      expect.objectContaining({
        display_name: "사용자",
        phone_number_encrypted: "enc:+821055566677",
        phone_number_blind_index: "idx:+821055566677",
        phone_number_last4: "6677",
        role: "user",
      }),
    );
    expect(result.user.displayName).toBe("사용자");
  });

  test("queries allowed numbers and users by blind index instead of plaintext phone number", async () => {
    mockedCheckSmsVerification.mockResolvedValue({
      sid: "check-3",
      status: "approved",
      to: "+821099998888",
    });
    mockedSupabaseSelect
      .mockResolvedValueOnce([
        {
          id: "allow-3",
          phone_number_encrypted: "enc:+821099998888",
          phone_number_last4: "8888",
          phone_number_blind_index: "idx:+821099998888",
          display_name: "운영자",
          note: null,
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "user-3",
          phone_number_encrypted: "enc:+821099998888",
          phone_number_last4: "8888",
          account_status: "active",
          phone_verified_at: "2026-03-19T00:00:00.000Z",
          last_login_at: "2026-03-19T00:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([]);
    mockedSupabaseInsert.mockResolvedValue([]);

    await completePhoneSignIn("01099998888", "1234");

    expect(mockedSupabaseSelect).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("phone_number_blind_index=eq.idx%3A%2B821099998888"),
    );
    expect(mockedSupabaseSelect).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("phone_number_blind_index=eq.idx%3A%2B821099998888"),
    );
  });
});

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
