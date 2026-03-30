jest.mock("@/lib/mobile/auth", () => ({
  completePhoneSignIn: jest.fn(),
}));

const mockCheckRateLimit = jest.fn();

jest.mock("@/lib/mobile/rate-limit", () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}));

import { completePhoneSignIn } from "@/lib/mobile/auth";
import { POST } from "./route";

const mockedCompletePhoneSignIn = jest.mocked(completePhoneSignIn);

describe("POST /api/mobile/auth/login", () => {
  beforeEach(() => {
    mockedCompletePhoneSignIn.mockReset();
    mockCheckRateLimit.mockReset();
    mockCheckRateLimit.mockReturnValue({
      allowed: true,
      remaining: 9,
      resetAt: Date.now() + 60_000,
    });
  });

  test("returns a generic error message for failed login attempts", async () => {
    mockedCompletePhoneSignIn.mockRejectedValue(
      new Error("허용된 전화번호가 아닙니다. 관리자에게 문의해 주세요."),
    );

    const response = await POST(
      new Request("http://localhost:3000/api/mobile/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "1.2.3.4",
        },
        body: JSON.stringify({
          phoneNumber: "01012345678",
          verificationCode: "1234",
        }),
      }) as never,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "로그인을 진행하지 못했어요. 입력한 정보를 다시 확인해주세요.",
    });
  });

  test("rate limits repeated login attempts", async () => {
    mockCheckRateLimit.mockReturnValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 15_000,
    });

    const response = await POST(
      new Request("http://localhost:3000/api/mobile/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "1.2.3.4",
        },
        body: JSON.stringify({
          phoneNumber: "01012345678",
          verificationCode: "1234",
        }),
      }) as never,
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(mockedCompletePhoneSignIn).not.toHaveBeenCalled();
  });
});
