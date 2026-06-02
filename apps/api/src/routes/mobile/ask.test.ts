import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockGenerateGoogleText =
  jest.fn<(...args: unknown[]) => Promise<string>>();
const mockSchiftSearch = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockRequireMobileSession =
  jest.fn<(...args: unknown[]) => Promise<{ userId: string }>>();
const mockDbSelect = jest.fn<(...args: unknown[]) => Promise<unknown[]>>();

jest.mock("@gynecology-chatbot/mobile-api/text-generation", () => ({
  generateGoogleText: (...args: unknown[]) => mockGenerateGoogleText(...args),
}));

jest.mock("@gynecology-chatbot/mobile-api/rag", () => ({
  searchDbFileRag: jest.fn(async () => ({
    context: "",
    sources: [],
  })),
}));

jest.mock("@gynecology-chatbot/mobile-api/db/admin-client", () => ({
  dbSelect: (...args: unknown[]) => mockDbSelect(...args),
}));

jest.mock("@gynecology-chatbot/mobile-api/schift-client", () => ({
  getSchiftClient: () => ({
    search: (...args: unknown[]) => mockSchiftSearch(...args),
  }),
}));

jest.mock(
  "../../lib/session-auth.js",
  () => ({
    requireMobileSession: (...args: unknown[]) =>
      mockRequireMobileSession(...args),
    mobileRouteErrorResponse: (_c: unknown, error: unknown) =>
      Response.json(
        { error: error instanceof Error ? error.message : "error" },
        { status: 500 },
      ),
  }),
  { virtual: true },
);

jest.mock(
  "../../lib/responses.js",
  () => ({
    noStoreJson: (
      c: { json: (payload: unknown) => Response },
      payload: unknown,
    ) => c.json(payload),
  }),
  { virtual: true },
);

import app from "./ask";

beforeEach(() => {
  jest.clearAllMocks();
  process.env.GEMINI_API_KEY = "test-key";
  mockRequireMobileSession.mockResolvedValue({ userId: "user-123" });
  mockDbSelect.mockResolvedValue([]);
  mockSchiftSearch.mockResolvedValue({
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
    ],
  });
  mockGenerateGoogleText.mockResolvedValue("20주차에는 태동이 또렷해져요.");
});

describe("POST /api/mobile/ask", () => {
  it("returns the generated answer without exposing source materials", async () => {
    const response = await app.request("/", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "20주차 태동은 어떻게 느껴져요?",
        currentWeek: 20,
      }),
    });

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { answer: string };

    expect(payload).toEqual({ answer: "20주차에는 태동이 또렷해져요." });
  });

  it("uses the operator controlled prompt text for answer tone", async () => {
    mockDbSelect.mockResolvedValueOnce([
      {
        value: {
          tonePrompt: "처음에는 산모가 안심할 수 있는 말로 시작해요.",
          forbiddenTerms: ["참고", "자료"],
        },
      },
    ]);

    const response = await app.request("/", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "20주차 태동은 어떻게 느껴져요?",
        currentWeek: 20,
      }),
    });

    expect(response.status).toBe(200);
    const generatedInput = mockGenerateGoogleText.mock.calls[0]?.[0] as {
      prompt?: string;
    };
    expect(generatedInput.prompt).toContain(
      "처음에는 산모가 안심할 수 있는 말로 시작해요.",
    );
    expect(generatedInput.prompt).toContain(
      "사용자에게 참고, 자료 같은 말을 하지 마세요.",
    );
  });
});
