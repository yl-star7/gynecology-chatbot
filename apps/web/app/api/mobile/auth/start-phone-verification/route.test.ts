jest.mock("@/lib/mobile/auth", () => ({
  startPhoneVerification: jest.fn(),
}));

const mockCheckRateLimit = jest.fn();

jest.mock("@/lib/mobile/rate-limit", () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}));

import { startPhoneVerification } from "@/lib/mobile/auth";
import { POST } from "./route";

const mockedStartPhoneVerification = jest.mocked(startPhoneVerification);

describe("POST /api/mobile/auth/start-phone-verification", () => {
  beforeEach(() => {
    mockedStartPhoneVerification.mockReset();
    mockCheckRateLimit.mockReset();
    mockCheckRateLimit.mockReturnValue({
      allowed: true,
      remaining: 4,
      resetAt: Date.now() + 60_000,
    });
  });

  test("returns a generic error message for disallowed phone numbers", async () => {
    mockedStartPhoneVerification.mockRejectedValue(
      new Error("허용된 전화번호가 아닙니다. 관리자에게 문의해 주세요."),
    );

    const response = await POST(
      new Request(
        "http://localhost:3000/api/mobile/auth/start-phone-verification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "1.2.3.4",
          },
          body: JSON.stringify({ phoneNumber: "01012345678" }),
        },
      ) as never,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "인증 요청을 진행하지 못했어요. 입력한 정보를 다시 확인해주세요.",
    });
  });

  test("returns service unavailable when SMS config is missing in production", async () => {
    mockedStartPhoneVerification.mockRejectedValue(
      new Error(
        "문자 발송 설정이 비어 있어요. 운영 환경 설정을 확인해 주세요.",
      ),
    );

    const response = await POST(
      new Request(
        "http://localhost:3000/api/mobile/auth/start-phone-verification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "1.2.3.4",
          },
          body: JSON.stringify({ phoneNumber: "01012345678" }),
        },
      ) as never,
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "지금은 인증번호를 보낼 수 없어요. 잠시 후 다시 시도해 주세요.",
    });
  });

  test("rate limits repeated verification starts", async () => {
    mockCheckRateLimit.mockReturnValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 15_000,
    });

    const response = await POST(
      new Request(
        "http://localhost:3000/api/mobile/auth/start-phone-verification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "1.2.3.4",
          },
          body: JSON.stringify({ phoneNumber: "01012345678" }),
        },
      ) as never,
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(mockedStartPhoneVerification).not.toHaveBeenCalled();
  });
});
