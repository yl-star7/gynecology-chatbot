import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { supabaseRpc, supabaseSelect } from "./supabase-rest";
import { getSchiftClient } from "./schift-client";

type RagDocumentRow = {
  id: string;
  title: string;
  content: string;
  pregnancy_week: number | null;
  category: string;
  metadata: Record<string, unknown> | null;
  similarity: number;
};

type RagProvider = "schift" | "supabase" | "auto";

type ConfigRow = { key: string; value: { ragProvider?: RagProvider } };
const PGVECTOR_DIMENSION = 1536;

function normalizeEmbeddingLength(values: number[]) {
  return values.slice(0, PGVECTOR_DIMENSION);
}

async function getRagProvider(): Promise<RagProvider> {
  try {
    const rows = await supabaseSelect<ConfigRow[]>(
      `system_config?select=key,value&key=eq.rag_provider&limit=1`,
    );
    const provider = rows[0]?.value?.ragProvider;
    if (provider === "schift" || provider === "supabase") return provider;
  } catch {}
  return "auto";
}

async function searchViaSchift(query: string, matchCount: number): Promise<RagDocumentRow[]> {
  const schift = getSchiftClient();
  if (!schift) throw new Error("Schift client not configured");

  const results = await schift.search({
    query,
    collection: "pregnancy-knowledge",
    topK: matchCount,
  });

  return results.map((result) => ({
    id: result.id,
    title: typeof result.metadata?.title === "string" ? result.metadata.title : result.id,
    content: typeof result.metadata?.content === "string" ? result.metadata.content : "",
    pregnancy_week:
      typeof result.metadata?.pregnancy_week === "number"
        ? result.metadata.pregnancy_week
        : null,
    category: typeof result.metadata?.category === "string" ? result.metadata.category : "schift",
    metadata: result.metadata ?? null,
    similarity: result.score,
  }));
}

function getEmbeddingApiKey() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Embedding configuration is missing");
  }

  return apiKey;
}

async function searchViaSupabase(query: string, currentWeek: number | null, matchCount: number): Promise<RagDocumentRow[]> {
  const apiKey = getEmbeddingApiKey();

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey,
    modelName: "gemini-embedding-001",
  });
  const queryEmbedding = normalizeEmbeddingLength(
    await embeddings.embedQuery(query),
  );
  return await supabaseRpc<RagDocumentRow[]>("match_pregnancy_documents", {
    query_embedding: queryEmbedding,
    current_week: currentWeek,
    match_count: matchCount,
  });
}

export async function retrievePregnancyContext(input: {
  query: string;
  currentWeek: number | null;
  matchCount?: number;
}) {
  if (!input.query.trim()) return [] as RagDocumentRow[];

  const provider = await getRagProvider();
  const count = input.matchCount ?? 5;

  if (provider === "schift") {
    return await searchViaSchift(input.query, count);
  }

  if (provider === "supabase") {
    return await searchViaSupabase(input.query, input.currentWeek, count);
  }

  // auto: try Schift first, then explicit failure if unavailable/fails
  const schift = getSchiftClient();
  if (!schift) {
    throw new Error("RAG provider auto mode requires Schift client configuration");
  }

  return await searchViaSchift(input.query, count);
}

export async function embedPregnancyDocument(content: string): Promise<number[]> {
  if (!content.trim()) throw new Error("Content is empty");

  const provider = await getRagProvider();

  if (provider === "schift" || provider === "auto") {
    const schift = getSchiftClient();
    if (schift) {
      try {
        const result = await schift.embed({ text: content });
        return normalizeEmbeddingLength(result.embedding);
      } catch (error) {
        if (provider === "schift") {
          throw error;
        }

        console.warn("Schift embed failed in auto mode, falling back to Gemini:", error);
      }
    }
    if (provider === "schift") throw new Error("Schift client not configured");
  }

  const apiKey = getEmbeddingApiKey();

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey,
    modelName: "gemini-embedding-001",
  });
  return normalizeEmbeddingLength(await embeddings.embedQuery(content));
}

export function formatRagContext(documents: RagDocumentRow[]) {
  if (documents.length === 0) return "검색된 임신 주차 문서 없음";

  return documents
    .map(
      (document, index) =>
        [
          `문서 ${index + 1}`,
          `제목: ${document.title}`,
          `주차: ${document.pregnancy_week ?? "공통"}`,
          `카테고리: ${document.category}`,
          `유사도: ${document.similarity.toFixed(3)}`,
          `본문: ${document.content.slice(0, 700)}`,
        ].join("\n"),
    )
    .join("\n\n");
}
