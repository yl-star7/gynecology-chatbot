import {
  checkSmsVerification,
  normalizePhoneNumberToE164,
  sendSmsMessage,
  sendSmsVerification,
} from "./twilio-verify";

describe("twilio-verify", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_VERIFY_SERVICE_SID;
    delete process.env.TWILIO_MESSAGING_SERVICE_SID;
    delete process.env.TWILIO_SMS_FROM;
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("normalizes Korean mobile numbers to E.164", () => {
    expect(normalizePhoneNumberToE164("01012345678")).toBe("+821012345678");
    expect(normalizePhoneNumberToE164("+821012345678")).toBe("+821012345678");
  });

  test("uses local fallback when Twilio is not configured", async () => {
    await expect(sendSmsVerification("01012345678")).resolves.toEqual({
      sid: "mock-verification",
      status: "pending",
      to: "+821012345678",
    });

    await expect(checkSmsVerification("01012345678", "1234")).resolves.toEqual({
      sid: "mock-check",
      status: "approved",
      to: "+821012345678",
    });
  });

  test("calls Twilio Verify API when configured", async () => {
    process.env.TWILIO_ACCOUNT_SID = "AC123";
    process.env.TWILIO_AUTH_TOKEN = "secret";
    process.env.TWILIO_VERIFY_SERVICE_SID = "VA123";
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        sid: "VE123",
        status: "pending",
        to: "+821012345678",
      }),
    });

    const result = await sendSmsVerification("01012345678");

    expect(result).toEqual({
      sid: "VE123",
      status: "pending",
      to: "+821012345678",
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "https://verify.twilio.com/v2/Services/VA123/Verifications",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Basic /),
          "Content-Type": "application/x-www-form-urlencoded",
        }),
        body: "To=%2B821012345678&Channel=sms&Locale=ko",
      }),
    );
  });

  test("sends general notification SMS through the Twilio Messages API", async () => {
    process.env.TWILIO_ACCOUNT_SID = "AC123";
    process.env.TWILIO_AUTH_TOKEN = "secret";
    process.env.TWILIO_MESSAGING_SERVICE_SID = "MG123";
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        sid: "SM123",
        status: "queued",
        to: "+821012345678",
      }),
    });

    const result = await sendSmsMessage(
      "01012345678",
      "임신 18주차 오늘의 정보가 준비됐어요.",
    );

    expect(result).toEqual({
      sid: "SM123",
      status: "queued",
      to: "+821012345678",
      body: "임신 18주차 오늘의 정보가 준비됐어요.",
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining(
          "MessagingServiceSid=MG123",
        ),
      }),
    );
  });
});
