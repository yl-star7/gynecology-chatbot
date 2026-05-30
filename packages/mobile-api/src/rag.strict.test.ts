const mockSearch = jest.fn();
const mockDbSelect = jest.fn(
  async (_path?: string, _options?: unknown) => [
    { key: "rag_provider", value: { ragProvider: "schift" } },
  ],
);
const mockDbRpc = jest.fn(async () => []);

jest.mock("./schift-client", () => ({
  getSchiftClient: () => ({ search: mockSearch }),
}));

jest.mock("@/lib/db/admin-client", () => ({
  dbSelect: (path: string, options?: unknown) =>
    mockDbSelect(path, options),
  dbRpc: (fn: string, payload: unknown) => mockDbRpc(fn, payload),
}));
import { retrievePregnancyContext, searchFileRag } from "./rag";

describe("retrievePregnancyContext strict configuration", () => {
  const originalGemini = process.env.GEMINI_API_KEY;
  const originalGoogle = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  afterEach(() => {
    jest.clearAllMocks();
    mockDbSelect.mockReset();
    mockDbSelect.mockResolvedValue([
      { key: "rag_provider", value: { ragProvider: "schift" } },
    ]);
    mockDbRpc.mockReset();
    mockDbRpc.mockResolvedValue([]);

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

  it("does not require Gemini embedding config for Schift retrieval", async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    mockSearch.mockResolvedValue({ results: [] });

    await expect(
      retrievePregnancyContext({
        query: "입덧이 심해요",
        currentWeek: 10,
      }),
    ).resolves.toEqual([]);
    expect(mockSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        bucket: "pregnancy-knowledge",
      }),
    );
  });

  it("supports Schift object search responses", async () => {
    mockDbSelect.mockResolvedValue([
      { key: "rag_provider", value: { ragProvider: "schift" } },
    ]);
    mockSearch.mockResolvedValue({
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
    mockSearch.mockResolvedValue({
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
    mockDbSelect.mockResolvedValue([]);

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

  it("uses database pregnancy documents when Schift retrieval fails", async () => {
    mockSearch.mockRejectedValue(new Error("Bucket search failed"));
    mockDbRpc.mockResolvedValue([
      {
        id: "db-doc-1",
        title: "조산 위험 신호",
        content: "태동 감소와 양수 유출 의심은 의료기관 상담이 필요해요.",
        pregnancy_week: null,
        category: "warning-signs",
        metadata: { source: "db" },
        similarity: 0.78,
      },
    ]);

    await expect(
      retrievePregnancyContext({
        query: "입덧이 심해요",
        currentWeek: 10,
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        id: "db-doc-1",
        content: "태동 감소와 양수 유출 의심은 의료기관 상담이 필요해요.",
      }),
    ]);
  });

  it("uses database file RAG context when Schift search returns no results", async () => {
    mockSearch.mockResolvedValue({
      collection: "pregnancy-knowledge",
      results: [],
    });
    mockDbSelect.mockResolvedValue([]);
    mockDbRpc.mockResolvedValue([
      {
        id: "db-doc-2",
        title: "37주차 태동",
        content: "37주차에도 태동의 양상과 빈도를 살피는 것이 좋아요.",
        pregnancy_week: 37,
        category: "week-guide",
        metadata: { source: "db" },
        similarity: 0.98,
      },
    ]);

    await expect(
      searchFileRag({ query: "태동이 강해요", currentWeek: 37 }),
    ).resolves.toEqual({
      context: expect.stringContaining("37주차에도 태동"),
      sources: [
        expect.objectContaining({
          fileId: "db-doc-2",
          filename: "db",
          chunkTitle: "37주차 태동",
          similarity: 0.98,
        }),
      ],
    });
  });

  it("uses database file RAG context when Schift search fails", async () => {
    mockSearch.mockRejectedValue(new Error("Bucket search failed"));
    mockDbRpc.mockResolvedValue([
      {
        id: "db-doc-3",
        title: "오심과 구토",
        content: "오심과 구토가 심하면 탈수 여부를 확인해야 해요.",
        pregnancy_week: 10,
        category: "symptom-guide",
        metadata: { source: "db" },
        similarity: 0.98,
      },
    ]);

    await expect(searchFileRag({ query: "오심과 구토" })).resolves.toEqual({
      context: expect.stringContaining(
        "오심과 구토가 심하면 탈수 여부를 확인해야 해요.",
      ),
      sources: [
        expect.objectContaining({
          fileId: "db-doc-3",
          filename: "db",
        }),
      ],
    });
  });
});
