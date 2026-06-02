const generateGoogleTextMock = jest.fn();
const schiftSearchMock = jest.fn();
const searchDbFileRagMock = jest.fn();
const dbSelectMock = jest.fn();

jest.mock("@gynecology-chatbot/mobile-api/text-generation", () => ({
  generateGoogleText: (...args: unknown[]) => generateGoogleTextMock(...args),
}));

jest.mock("@gynecology-chatbot/mobile-api/rag", () => ({
  searchDbFileRag: (...args: unknown[]) => searchDbFileRagMock(...args),
}));

jest.mock("@gynecology-chatbot/mobile-api/db/admin-client", () => ({
  dbSelect: (...args: unknown[]) => dbSelectMock(...args),
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

  dbSelectMock.mockResolvedValue([]);
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
  searchDbFileRagMock.mockResolvedValue({
    context: "",
    sources: [],
  });
  generateGoogleTextMock.mockResolvedValue(
    "## 답변\n20주차에는 태동이 점점 또렷해져요.\n- 하루 한 번 태동을 기록해보세요.",
  );
});

describe("POST /api/mobile/ask", () => {
  test("returns markdown answer without exposing source materials", async () => {
    const response = await POST(
      buildRequest(
        { query: "20주차 태동은 어떻게 느껴져요?", currentWeek: 20 },
        { authorization: "Bearer test-token" },
      ),
    );
    expect(response.status).toBe(200);

    const payload = (await response.json()) as { answer: string };

    expect(payload.answer).toContain("20주차");
    expect(payload).not.toHaveProperty("sources");
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

  test("uses database RAG context when Schift returns nothing", async () => {
    schiftSearchMock.mockResolvedValueOnce({ results: [] });
    searchDbFileRagMock.mockResolvedValueOnce({
      context:
        "[참고 1] 태동 기록 안내\n출처: db\n유사도: 0.980\n태동이 평소보다 줄거나 달라졌다면 병원에 문의해요.\n\n빈 줄이 있어도 같은 자료예요.",
      sources: [
        {
          fileId: "db-doc-1",
          filename: "db",
          chunkTitle: "태동 기록 안내",
          similarity: 0.98,
        },
      ],
    });
    generateGoogleTextMock.mockResolvedValueOnce(
      "태동이 평소보다 줄거나 달라졌다면 병원에 문의해요.",
    );

    const response = await POST(
      buildRequest(
        { query: "희귀한 증상이에요" },
        { authorization: "Bearer test-token" },
      ),
    );
    expect(response.status).toBe(200);
    const payload = (await response.json()) as { answer: string };
    expect(payload.answer).toContain("태동");
    expect(payload).not.toHaveProperty("sources");
    expect(searchDbFileRagMock).toHaveBeenCalledWith({
      currentWeek: null,
      matchCount: 5,
    });
  });

  test("uses administrator controlled answer tone prompt", async () => {
    dbSelectMock.mockResolvedValueOnce([
      {
        value: {
          tonePrompt: "처음 문장은 산모가 불안하지 않게 짧게 시작해요.",
          forbiddenTerms: ["참고", "자료"],
        },
      },
    ]);

    const response = await POST(
      buildRequest(
        { query: "20주차 태동은 어떻게 느껴져요?", currentWeek: 20 },
        { authorization: "Bearer test-token" },
      ),
    );

    expect(response.status).toBe(200);
    const generatedInput = generateGoogleTextMock.mock.calls[0]?.[0] as {
      prompt?: string;
    };
    expect(generatedInput.prompt).toContain(
      "처음 문장은 산모가 불안하지 않게 짧게 시작해요.",
    );
    expect(generatedInput.prompt).toContain(
      "사용자에게 참고, 자료 같은 말을 하지 마세요.",
    );
  });
});
