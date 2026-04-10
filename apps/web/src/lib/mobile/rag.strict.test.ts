const searchMock = jest.fn();
const supabaseSelectMock = jest.fn(async () => [
  { key: "rag_provider", value: { ragProvider: "supabase" } },
]);

jest.mock("./schift-client", () => ({
  getSchiftClient: () => ({ search: searchMock }),
}));

jest.mock("@/lib/supabase/admin-client", () => ({
  supabaseSelect: (...args: unknown[]) => supabaseSelectMock(...args),
  supabaseRpc: jest.fn(),
}));

import { retrievePregnancyContext, searchFileRag } from "./rag";

describe("retrievePregnancyContext strict configuration", () => {
  const originalGemini = process.env.GEMINI_API_KEY;
  const originalGoogle = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  afterEach(() => {
    jest.clearAllMocks();
    supabaseSelectMock.mockReset();
    supabaseSelectMock.mockResolvedValue([
      { key: "rag_provider", value: { ragProvider: "supabase" } },
    ]);

    if (originalGemini === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalGemini;
    }

    if (originalGoogle === undefined) {
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    } else {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalGoogle;
    }
  });

  it("throws when embedding API key is missing", async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    await expect(
      retrievePregnancyContext({
        query: "입덧이 심해요",
        currentWeek: 10,
      }),
    ).rejects.toThrow("Embedding configuration is missing");
  });

  it("supports Schift object search responses", async () => {
    supabaseSelectMock.mockResolvedValue([
      { key: "rag_provider", value: { ragProvider: "schift" } },
    ]);
    searchMock.mockResolvedValue({
      collection: "pregnancy-knowledge",
      results: [
        {
          id: "doc-1",
          score: 0.91,
          metadata: {
            title: "입덧 관리",
            text: "오심과 구토가 심하면 탈수 여부를 확인해야 해요.",
            category: "symptom",
          },
        },
      ],
    });

    await expect(
      retrievePregnancyContext({
        query: "입덧이 심해요",
        currentWeek: 10,
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        id: "doc-1",
        title: "입덧 관리",
        content: "오심과 구토가 심하면 탈수 여부를 확인해야 해요.",
        similarity: 0.91,
      }),
    ]);
  });

  it("supports file rag from Schift object responses", async () => {
    searchMock.mockResolvedValue({
      collection: "pregnancy-knowledge",
      results: [
        {
          id: "doc-2",
          score: 0.88,
          metadata: {
            title: "오심과 구토",
            file_name: "04_Ⅰ_04장(91~130).pdf",
            text: "일어나기 전 마른 탄수화물 식이를 권해요.",
          },
        },
      ],
    });
    supabaseSelectMock.mockResolvedValue([]);

    await expect(searchFileRag({ query: "오심과 구토" })).resolves.toEqual({
      context: expect.stringContaining(
        "일어나기 전 마른 탄수화물 식이를 권해요.",
      ),
      sources: [
        expect.objectContaining({
          fileId: "doc-2",
          filename: "04_Ⅰ_04장(91~130).pdf",
          chunkTitle: "오심과 구토",
          similarity: 0.88,
        }),
      ],
    });
  });
});
