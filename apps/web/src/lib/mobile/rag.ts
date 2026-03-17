import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { supabaseRpc } from "./supabase-rest";

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
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey || !input.query.trim()) {
    return [] as RagDocumentRow[];
  }

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey,
    modelName: "embedding-001",
  });

  try {
    const queryEmbedding = await embeddings.embedQuery(input.query);
    return supabaseRpc<RagDocumentRow[]>("match_pregnancy_documents", {
      query_embedding: queryEmbedding,
      current_week: input.currentWeek,
      match_count: input.matchCount ?? 4,
    });
  } catch (error) {
    console.warn("pregnancy context retrieval skipped", error);
    return [] as RagDocumentRow[];
  }
}

export async function embedPregnancyDocument(content: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey || !content.trim()) {
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
