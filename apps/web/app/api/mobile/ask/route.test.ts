const generateGoogleTextMock = jest.fn();
const schiftSearchMock = jest.fn();

jest.mock("@gynecology-chatbot/mobile-api/text-generation", () => ({
  generateGoogleText: (...args: unknown[]) => generateGoogleTextMock(...args),
}));

jest.mock("@/lib/mobile/schift-client", () => ({
  getSchiftClient: () => ({
    search: (...args: unknown[]) => schiftSearchMock(...args),
  }),
}));

const requireMobileSessionMock = jest.fn();
jest.mock("@/lib/mobile/session-auth", () => ({
  requireMobileSession: (...args: unknown[]) =>
    requireMobileSessionMock(...args),
  mobileNoStoreJson: (payload: unknown, init?: ResponseInit) =>
    Response.json(payload, {
      ...init,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        ...(init?.headers as Record<string, string> | undefined),
      },
    }),
  isMobileSessionError: (error: unknown) =>
    error instanceof Error &&
    error.message === "mobile session token is required",
}));

jest.mock("@/lib/mobile/rate-limit", () => ({
  checkRateLimit: jest.fn(() => ({
    allowed: true,
    remaining: 19,
    resetAt: Date.now() + 60_000,
  })),
}));

import type { NextRequest } from "next/server";
import { POST } from "./route";
import { checkRateLimit } from "@/lib/mobile/rate-limit";

function buildRequest(body: unknown, init?: { authorization?: string }) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (init?.authorization) headers.set("Authorization", init.authorization);
  return new Request("http://localhost/api/mobile/ask", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.GEMINI_API_KEY = "test-key";

  requireMobileSessionMock.mockResolvedValue({ userId: "user-123" });
  (checkRateLimit as jest.Mock).mockReturnValue({
    allowed: true,
    remaining: 19,
    resetAt: Date.now() + 60_000,
  });
  schiftSearchMock.mockResolvedValue({
    results: [
      {
        id: "doc-1",
        score: 0.91,
        metadata: {
          title: "임신 20주차 안내",
          content:
            "20주차에는 태동을 느낄 수 있어요. 정기 초음파 검사를 잊지 마세요.",
          pregnancy_week: 20,
          surface: "rag",
        },
      },
      {
        id: "doc-2",
        score: 0.83,
        metadata: {
          title: "태동 기록 팁",
          text: "하루 동안 아기의 움직임을 짧게 기록해두면 변화를 알아차리기 좋아요.",
          pregnancy_week: 21,
        },
      },
    ],
  });
  generateGoogleTextMock.mockResolvedValue(
    "## 답변\n20주차에는 태동이 점점 또렷해져요.\n- 하루 한 번 태동을 기록해보세요.",
  );
});

describe("POST /api/mobile/ask", () => {
  test("happy path: returns markdown answer and sources", async () => {
    const response = await POST(
      buildRequest(
        { query: "20주차 태동은 어떻게 느껴져요?", currentWeek: 20 },
        { authorization: "Bearer test-token" },
      ),
    );
    expect(response.status).toBe(200);

    const payload = (await response.json()) as {
      answer: string;
      sources: Array<{ title: string; snippet: string }>;
    };

    expect(payload.answer).toContain("20주차");
    expect(payload.sources.length).toBeGreaterThan(0);
    expect(payload.sources[0]).toEqual(
      expect.objectContaining({ title: expect.any(String) }),
    );
    expect(schiftSearchMock).toHaveBeenCalledTimes(1);
    expect(generateGoogleTextMock).toHaveBeenCalledTimes(1);
  });

  test("empty query returns 400", async () => {
    const response = await POST(
      buildRequest({ query: "   " }, { authorization: "Bearer test-token" }),
    );
    expect(response.status).toBe(400);
    const payload = (await response.json()) as { error: string };
    expect(payload.error).toContain("질문");
    expect(requireMobileSessionMock).not.toHaveBeenCalled();
  });

  test("auth failure returns 401", async () => {
    requireMobileSessionMock.mockRejectedValueOnce(
      new Error("mobile session token is required"),
    );
    const response = await POST(buildRequest({ query: "안녕하세요" }));
    expect(response.status).toBe(401);
    expect(schiftSearchMock).not.toHaveBeenCalled();
    expect(generateGoogleTextMock).not.toHaveBeenCalled();
  });

  test("rate limit returns 429 with Retry-After", async () => {
    (checkRateLimit as jest.Mock).mockReturnValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 30_000,
    });
    const response = await POST(
      buildRequest(
        { query: "질문 있어요" },
        { authorization: "Bearer test-token" },
      ),
    );
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).not.toBeNull();
    expect(generateGoogleTextMock).not.toHaveBeenCalled();
  });

  test("still answers when Schift returns nothing", async () => {
    schiftSearchMock.mockResolvedValueOnce({ results: [] });
    generateGoogleTextMock.mockResolvedValueOnce(
      "자료가 부족해요. 가까운 병원이나 전문가와 상담해 보시는 걸 권해요.",
    );

    const response = await POST(
      buildRequest(
        { query: "희귀한 증상이에요" },
        { authorization: "Bearer test-token" },
      ),
    );
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      answer: string;
      sources: unknown[];
    };
    expect(payload.answer).toContain("병원");
    expect(payload.sources).toEqual([]);
  });
});
