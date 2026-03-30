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

  beforeEach(() => {
    process.env.MOBILE_AUTH_TEST_MODE = "true";
    mockedSupabaseSelect.mockReset();
    mockedSupabaseInsert.mockReset();
    mockedSupabaseUpdate.mockReset();
    mockedCheckSmsVerification.mockReset();

    mockedSupabaseUpdate.mockResolvedValue([]);
    mockedSupabaseSelect
      .mockResolvedValueOnce([
        {
          id: "allow-1",
          phone_number_encrypted: "enc:+821012345678",
          phone_number_last4: "5678",
          phone_number_blind_index: "idx:+821012345678",
          display_name: "테스트 사용자",
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
    mockedSupabaseInsert.mockResolvedValue([]);
  });

  afterAll(() => {
    if (originalMode === undefined) {
      delete process.env.MOBILE_AUTH_TEST_MODE;
      return;
    }
    process.env.MOBILE_AUTH_TEST_MODE = originalMode;
  });

  test("accepts verification code 000000 without Twilio check in test mode", async () => {
    const result = await completePhoneSignIn("01012345678", "000000");

    expect(result.user.id).toBe("user-1");
    expect(mockedCheckSmsVerification).not.toHaveBeenCalled();
  });
});
