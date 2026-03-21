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

async function searchViaSupabase(query: string, currentWeek: number | null, matchCount: number): Promise<RagDocumentRow[]> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return [];

  const embeddings = new GoogleGenerativeAIEmbeddings({ apiKey, modelName: "embedding-001" });
  const queryEmbedding = await embeddings.embedQuery(query);
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
    try {
      return await searchViaSchift(input.query, count);
    } catch (e) {
      console.error("Schift search failed:", e);
      return [] as RagDocumentRow[];
    }
  }

  if (provider === "supabase") {
    try {
      return await searchViaSupabase(input.query, input.currentWeek, count);
    } catch (e) {
      console.warn("Supabase search failed:", e);
      return [] as RagDocumentRow[];
    }
  }

  // auto: try Schift first, fall back to Supabase
  const schift = getSchiftClient();
  if (schift) {
    try {
      return await searchViaSchift(input.query, count);
    } catch (e) {
      console.warn("Schift failed in auto mode, trying Supabase:", e);
    }
  }

  try {
    return await searchViaSupabase(input.query, input.currentWeek, count);
  } catch (e) {
    console.warn("Supabase search also failed:", e);
    return [] as RagDocumentRow[];
  }
}

export async function embedPregnancyDocument(content: string): Promise<number[]> {
  if (!content.trim()) throw new Error("Content is empty");

  const provider = await getRagProvider();

  if (provider === "schift" || provider === "auto") {
    const schift = getSchiftClient();
    if (schift) {
      const result = await schift.embed({ text: content });
      return result.embedding;
    }
    if (provider === "schift") throw new Error("Schift client not configured");
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error("Embedding configuration is missing");

  const embeddings = new GoogleGenerativeAIEmbeddings({ apiKey, modelName: "embedding-001" });
  return embeddings.embedQuery(content);
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
