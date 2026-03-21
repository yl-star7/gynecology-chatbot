import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { supabaseRpc } from "./supabase-rest";
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

export async function retrievePregnancyContext(input: {
  query: string;
  currentWeek: number | null;
  matchCount?: number;
}) {
  if (!input.query.trim()) {
    return [] as RagDocumentRow[];
  }

  // 1. Schift search (primary if available)
  const schift = getSchiftClient();
  if (schift) {
    try {
      const schiftResults = await schift.search({
        query: input.query,
        collection: "pregnancy-knowledge",
        topK: input.matchCount ?? 5,
      });
      return schiftResults.map((result) => ({
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
    } catch (e) {
      console.warn("Schift search failed, falling back to Supabase:", e);
    }
  }

  // 2. Supabase pgvector fallback
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return [] as RagDocumentRow[];
  }

  try {
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey,
      modelName: "embedding-001",
    });
    const queryEmbedding = await embeddings.embedQuery(input.query);
    return await supabaseRpc<RagDocumentRow[]>("match_pregnancy_documents", {
      query_embedding: queryEmbedding,
      current_week: input.currentWeek,
      match_count: input.matchCount ?? 4,
    });
  } catch (error) {
    console.warn("pregnancy context retrieval skipped", error);
    return [] as RagDocumentRow[];
  }
}

export async function embedPregnancyDocument(content: string): Promise<number[]> {
  if (!content.trim()) {
    throw new Error("Content is empty");
  }

  // Schift embed (primary)
  const schift = getSchiftClient();
  if (schift) {
    const result = await schift.embed({ text: content });
    return result.embedding;
  }

  // LangChain fallback
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Embedding configuration is missing");
  }

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey,
    modelName: "embedding-001",
  });

  return embeddings.embedQuery(content);
}

export function formatRagContext(documents: RagDocumentRow[]) {
  if (documents.length === 0) {
    return "검색된 임신 주차 문서 없음";
  }

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
