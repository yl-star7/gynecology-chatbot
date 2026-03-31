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
  computePhoneNumberBlindIndex: jest.fn(
    (phoneNumber: string) => `idx:${phoneNumber}`,
  ),
  createPhoneNumberStorage: jest.fn((phoneNumber: string) => ({
    phoneNumberEncrypted: `enc:${phoneNumber}`,
    phoneNumberBlindIndex: `idx:${phoneNumber}`,
    phoneNumberLast4: phoneNumber.slice(-4),
  })),
  decryptPhoneNumber: jest.fn((value: string) => value.replace(/^enc:/, "")),
}));

import { completePhoneSignIn } from "@/lib/mobile/auth";
import {
  supabaseSelect,
  supabaseInsert,
  supabaseUpdate,
} from "@/lib/mobile/supabase-rest";
import { checkSmsVerification } from "@/lib/mobile/twilio-verify";

const mockedSupabaseSelect = jest.mocked(supabaseSelect);
const mockedSupabaseInsert = jest.mocked(supabaseInsert);
const mockedSupabaseUpdate = jest.mocked(supabaseUpdate);
const mockedCheckSmsVerification = jest.mocked(checkSmsVerification);

describe("completePhoneSignIn test mode bypass", () => {
  const originalMode = process.env.MOBILE_AUTH_TEST_MODE;
  const originalBypassPhone = process.env.LOCAL_DEV_USER_PHONE_NUMBER;

  beforeEach(() => {
    process.env.MOBILE_AUTH_TEST_MODE = "true";
    process.env.LOCAL_DEV_USER_PHONE_NUMBER = "01012345678";
    mockedSupabaseSelect.mockReset();
    mockedSupabaseInsert.mockReset();
    mockedSupabaseUpdate.mockReset();
    mockedCheckSmsVerification.mockReset();

    mockedSupabaseUpdate.mockResolvedValue([]);
    mockedSupabaseSelect
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
    mockedSupabaseInsert.mockResolvedValue([]);
  });

  afterAll(() => {
    if (originalMode === undefined) {
      delete process.env.MOBILE_AUTH_TEST_MODE;
    } else {
      process.env.MOBILE_AUTH_TEST_MODE = originalMode;
    }

    if (originalBypassPhone === undefined) {
      delete process.env.LOCAL_DEV_USER_PHONE_NUMBER;
      return;
    }
    process.env.LOCAL_DEV_USER_PHONE_NUMBER = originalBypassPhone;
  });

  test("accepts any verification code for LOCAL_DEV_USER_PHONE_NUMBER without Twilio check in test mode", async () => {
    process.env.LOCAL_DEV_USER_PHONE_NUMBER = "01026784241";

    const result = await completePhoneSignIn("01026784241", "123456");

    expect(result.user.id).toBe("user-1");
    expect(mockedCheckSmsVerification).not.toHaveBeenCalled();
  });

  test("accepts verification code 000000 without Twilio check in test mode", async () => {
    const result = await completePhoneSignIn("01012345678", "000000");

    expect(result.user.id).toBe("user-1");
    expect(mockedCheckSmsVerification).not.toHaveBeenCalled();
  });

  test("forces onboarding flow after test-mode 000000 login", async () => {
    mockedSupabaseSelect.mockReset();
    mockedSupabaseInsert.mockReset();
    mockedSupabaseUpdate.mockReset();
    mockedCheckSmsVerification.mockReset();

    mockedSupabaseUpdate.mockResolvedValue([]);
    mockedSupabaseSelect
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
      .mockResolvedValueOnce([
        {
          user_id: "user-1",
          due_date: "2026-10-01",
          onboarding_payload: {
            tonePreference: "차분하게",
            pregnancyWeekOrDueDate: "2026-10-01",
          },
        },
      ] as never);
    mockedSupabaseInsert.mockResolvedValue([]);

    const result = await completePhoneSignIn("01012345678", "000000");

    expect(result.user.hasCompletedOnboarding).toBe(false);
  });
});
