/**
 * Chat route — input contract + auth + rate limit only.
 *
 * 의도: 기존 테스트는 LLM mock 응답 본문 매칭(예: "응급 신호 가능성")으로 깊게 결합되어
 * 실제 responder 로직 변경마다 깨졌습니다. 본 스위트는 "라우트가 진짜 수문장 역할을 하는가"만
 * 검증합니다 — 입력 검증, 인증, rate limit, 그 이상은 별도 단위 테스트(responder, helpers)
 * 로 커버합니다.
 */

import type { NextRequest } from "next/server";

jest.mock("@/lib/mobile/session-auth", () => ({
  requireMobileSession: jest.fn(),
}));

jest.mock("@/lib/mobile/rate-limit", () => ({
  checkRateLimit: jest.fn(),
}));

import { POST } from "./route";
import { requireMobileSession } from "@/lib/mobile/session-auth";
import { checkRateLimit } from "@/lib/mobile/rate-limit";

const mockedRequireMobileSession = requireMobileSession as jest.Mock;
const mockedCheckRateLimit = checkRateLimit as jest.Mock;

function buildRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/mobile/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe("POST /api/mobile/chat — input gates", () => {
  beforeEach(() => {
    mockedRequireMobileSession.mockReset();
    mockedCheckRateLimit.mockReset();
  });

  it("rejects missing sessionId with 400", async () => {
    const response = await POST(
      buildRequest({ userId: "user-1", text: "안녕" }),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/sessionId/);
    expect(mockedRequireMobileSession).not.toHaveBeenCalled();
  });

  it("rejects empty text + no images with 400", async () => {
    const response = await POST(
      buildRequest({
        userId: "user-1",
        sessionId: "11111111-1111-1111-1111-111111111111",
        text: "",
      }),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/text or imageDataUris/);
  });

  it("rejects messages longer than 3000 chars with 400 + Korean message", async () => {
    const longText = "가".repeat(3001);
    const response = await POST(
      buildRequest({
        userId: "user-1",
        sessionId: "11111111-1111-1111-1111-111111111111",
        text: longText,
      }),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("3,000자");
  });

  it("returns 429 with Retry-After when rate limit exceeded", async () => {
    mockedRequireMobileSession.mockResolvedValue({ userId: "user-1" });
    const resetAt = Date.now() + 30_000;
    mockedCheckRateLimit.mockReturnValue({
      allowed: false,
      resetAt,
      remaining: 0,
    });

    const response = await POST(
      buildRequest({
        userId: "user-1",
        sessionId: "11111111-1111-1111-1111-111111111111",
        text: "안녕",
      }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).not.toBeNull();
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
    const body = await response.json();
    expect(body.error).toMatch(/잠시 후/);
  });

  it("forwards hintedUserId to requireMobileSession", async () => {
    mockedRequireMobileSession.mockRejectedValue(
      Object.assign(new Error("unauthorized"), { status: 401 }),
    );
    mockedCheckRateLimit.mockReturnValue({
      allowed: true,
      resetAt: Date.now() + 60_000,
      remaining: 19,
    });

    await POST(
      buildRequest({
        userId: "user-9",
        sessionId: "11111111-1111-1111-1111-111111111111",
        text: "안녕",
      }),
    ).catch(() => undefined);

    expect(mockedRequireMobileSession).toHaveBeenCalledWith(
      expect.anything(),
      "user-9",
    );
  });

  it("calls checkRateLimit with chat:userId scope and 20/min budget", async () => {
    mockedRequireMobileSession.mockResolvedValue({ userId: "user-2" });
    mockedCheckRateLimit.mockReturnValue({
      allowed: false,
      resetAt: Date.now() + 1000,
      remaining: 0,
    });

    await POST(
      buildRequest({
        userId: "user-2",
        sessionId: "11111111-1111-1111-1111-111111111111",
        text: "다음",
      }),
    );

    expect(mockedCheckRateLimit).toHaveBeenCalledWith(
      "chat:user-2",
      20,
      60_000,
    );
  });
});
