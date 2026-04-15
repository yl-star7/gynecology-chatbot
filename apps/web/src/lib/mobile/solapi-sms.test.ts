import {
  checkSmsVerification,
  normalizePhoneNumberToE164,
  sendSmsMessage,
  sendSmsVerification,
} from "./solapi-sms";

describe("solapi-sms", () => {
  const originalEnv = process.env;

  function setNodeEnv(value: string) {
    Object.defineProperty(process.env, "NODE_ENV", {
      value,
      configurable: true,
      writable: true,
      enumerable: true,
    });
  }

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.SOLAPI_API_KEY;
    delete process.env.SOLAPI_API_SECRET;
    delete process.env.SOLAPI_SENDER_NUMBER;
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("normalizes Korean mobile numbers to E.164", () => {
    expect(normalizePhoneNumberToE164("01012345678")).toBe("+821012345678");
    expect(normalizePhoneNumberToE164("+821012345678")).toBe("+821012345678");
  });

  test("uses local fallback when Solapi is not configured outside production", async () => {
    setNodeEnv("test");

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

  test("fails fast in production when Solapi config is missing", async () => {
    setNodeEnv("production");

    await expect(sendSmsVerification("01012345678")).rejects.toThrow(
      "문자 발송 설정이 비어 있어요. 운영 환경 설정을 확인해 주세요.",
    );

    await expect(checkSmsVerification("01012345678", "1234")).rejects.toThrow(
      "문자 발송 설정이 비어 있어요. 운영 환경 설정을 확인해 주세요.",
    );

    await expect(sendSmsMessage("01012345678", "안내 문자")).rejects.toThrow(
      "문자 발송 설정이 비어 있어요. 운영 환경 설정을 확인해 주세요.",
    );
  });

  test("calls Solapi API when configured", async () => {
    process.env.SOLAPI_API_KEY = "TESTKEY123";
    process.env.SOLAPI_API_SECRET = "TESTSECRET456";
    process.env.SOLAPI_SENDER_NUMBER = "01012340000";
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        groupId: "G123",
        messageId: "M123",
        statusCode: "2000",
      }),
    });

    const result = await sendSmsVerification("01012345678");

    expect(result.status).toBe("pending");
    expect(result.to).toBe("+821012345678");
    expect(result.sid).toHaveLength(64); // SHA-256 hex hash
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.solapi.com/messages/v4/send",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: expect.stringMatching(
            /^HMAC-SHA256 apiKey=TESTKEY123/,
          ),
        }),
      }),
    );
  });

  test("sends general notification SMS through Solapi", async () => {
    process.env.SOLAPI_API_KEY = "TESTKEY123";
    process.env.SOLAPI_API_SECRET = "TESTSECRET456";
    process.env.SOLAPI_SENDER_NUMBER = "01012340000";
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        groupId: "G456",
        messageId: "M456",
        statusCode: "2000",
      }),
    });

    const result = await sendSmsMessage(
      "01012345678",
      "임신 18주차 오늘의 정보가 준비됐어요.",
    );

    expect(result).toEqual({
      sid: "G456",
      status: "2000",
      to: "+821012345678",
      body: "임신 18주차 오늘의 정보가 준비됐어요.",
    });

    const callBody = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body,
    );
    expect(callBody.message.to).toBe("01012345678");
    expect(callBody.message.from).toBe("01012340000");
  });
});
