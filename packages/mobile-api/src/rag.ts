import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";
import { getSchiftClient } from "./schift-client";

type DisabledFileRow = { id: string };

type RagDocumentRow = {
  id: string;
  title: string;
  content: string;
  pregnancy_week: number | null;
  category: string;
  metadata: Record<string, unknown> | null;
  similarity: number;
};

type SchiftSearchResult = {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
};

type RagProvider = "schift";

type ConfigRow = { key: string; value: { ragProvider?: RagProvider } };
const PGVECTOR_DIMENSION = 1536;
const FILE_RAG_TIMEOUT_MS = 5000;

function normalizeEmbeddingLength(values: number[]) {
  return values.slice(0, PGVECTOR_DIMENSION);
}

function asObject<T>(value: Prisma.JsonValue | null | undefined): T | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as T)
    : null;
}

async function getRagProvider(): Promise<RagProvider> {
  try {
    const row = await prisma.system_config.findUnique({
      where: { key: "rag_provider" },
      select: { key: true, value: true },
    });
    const config = row
      ? ({
          key: row.key,
          value: asObject<ConfigRow["value"]>(row.value) ?? {},
        } satisfies ConfigRow)
      : null;
    if (config?.value?.ragProvider === "schift") {
      return "schift";
    }
  } catch {}
  return "schift";
}

async function getDisabledFileIds(): Promise<Set<string>> {
  try {
    const rows = await prisma.content_rag_files.findMany({
      where: { enabled: false },
      select: { id: true },
    });
    return new Set(rows.map((r) => r.id));
  } catch {
    return new Set();
  }
}

function isResultFromDisabledFile(
  result: SchiftSearchResult,
  disabledIds: Set<string>,
): boolean {
  if (disabledIds.size === 0) return false;
  for (const fileId of disabledIds) {
    if (result.id.includes(fileId)) return true;
    const source = result.metadata?.source ?? result.metadata?.filename ?? "";
    if (typeof source === "string" && source.includes(fileId)) return true;
  }
  return false;
}

function normalizeSchiftSearchResults(response: unknown): SchiftSearchResult[] {
  if (Array.isArray(response)) {
    return response as SchiftSearchResult[];
  }

  if (
    response &&
    typeof response === "object" &&
    Array.isArray((response as { results?: unknown }).results)
  ) {
    return (response as { results: SchiftSearchResult[] }).results;
  }

  return [];
}

function readPregnancyWeekFromMetadata(
  metadata: Record<string, unknown> | undefined,
) {
  const rawWeek = metadata?.pregnancy_week ?? metadata?.pregnancyWeek;
  return typeof rawWeek === "number" ? rawWeek : null;
}

function isWeekInRange(week: number | null, currentWeek: number | null) {
  if (!currentWeek || week === null) {
    return true;
  }

  return Math.abs(week - currentWeek) <= 1;
}

async function searchViaSchift(
  query: string,
  currentWeek: number | null,
  matchCount: number,
): Promise<RagDocumentRow[]> {
  const schift = getSchiftClient();
  if (!schift) throw new Error("Schift client not configured");

  const [response, disabledIds] = await Promise.all([
    withTimeout(
      schift.search({
        query,
        collection: "pregnancy-knowledge",
        topK: matchCount + 10,
      }),
      FILE_RAG_TIMEOUT_MS,
      "Schift RAG search",
    ),
    getDisabledFileIds(),
  ]);

  const results = normalizeSchiftSearchResults(response);
  const enabledResults = results.filter(
    (result) => !isResultFromDisabledFile(result, disabledIds),
  );
  const weekFilteredResults = enabledResults.filter((result) =>
    isWeekInRange(readPregnancyWeekFromMetadata(result.metadata), currentWeek),
  );
  const selectedResults =
    weekFilteredResults.length > 0 ? weekFilteredResults : enabledResults;

  return selectedResults.slice(0, matchCount).map((result) => ({
    id: result.id,
    title:
      typeof result.metadata?.title === "string"
        ? result.metadata.title
        : result.id,
    content:
      typeof result.metadata?.content === "string"
        ? result.metadata.content
        : typeof result.metadata?.text === "string"
          ? result.metadata.text
          : "",
    pregnancy_week:
      typeof result.metadata?.pregnancy_week === "number"
        ? result.metadata.pregnancy_week
        : null,
    category:
      typeof result.metadata?.category === "string"
        ? result.metadata.category
        : "schift",
    metadata: result.metadata ?? null,
    similarity: result.score,
  }));
}

function getEmbeddingApiKey() {
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Embedding configuration is missing");
  }

  return apiKey;
}

export async function retrievePregnancyContext(input: {
  query: string;
  currentWeek: number | null;
  matchCount?: number;
}) {
  if (!input.query.trim()) return [] as RagDocumentRow[];

  const provider = await getRagProvider();
  const count = input.matchCount ?? 7;

  if (provider === "schift") {
    try {
      return await searchViaSchift(input.query, input.currentWeek, count);
    } catch (error) {
      console.warn("Schift RAG search failed:", error);
      return [];
    }
  }

  return [];
}

export async function embedPregnancyDocument(
  content: string,
): Promise<number[]> {
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

        console.warn(
          "Schift embed failed in auto mode, falling back to Gemini:",
          error,
        );
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

export type RagSource = {
  fileId: string;
  filename: string;
  chunkTitle: string;
  similarity: number;
};

export type RagSearchResult = {
  context: string;
  sources: RagSource[];
};

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/** 파일 RAG 검색 — Schift collection에서 top-K 검색 + 출처 반환 */
export async function searchFileRag(input: {
  query: string;
  currentWeek?: number | null;
  matchCount?: number;
}): Promise<RagSearchResult> {
  if (!input.query.trim()) return { context: "", sources: [] };

  const schift = getSchiftClient();
  if (!schift) return { context: "", sources: [] };

  const count = input.matchCount ?? 7;

  try {
    const [response, disabledIds] = await Promise.all([
      withTimeout(
        schift.search({
          query: input.query,
          collection: "pregnancy-knowledge",
          topK: count + 10,
        }),
        FILE_RAG_TIMEOUT_MS,
        "File RAG search",
      ),
      getDisabledFileIds(),
    ]);

    const results = normalizeSchiftSearchResults(response);

    const enabledResults = results.filter(
      (r) => !isResultFromDisabledFile(r, disabledIds),
    );
    const weekFilteredResults = enabledResults.filter((r) =>
      isWeekInRange(
        readPregnancyWeekFromMetadata(r.metadata),
        input.currentWeek ?? null,
      ),
    );
    const filtered = (
      weekFilteredResults.length > 0 ? weekFilteredResults : enabledResults
    ).slice(0, count);

    if (filtered.length === 0) return { context: "", sources: [] };

    const sources: RagSource[] = filtered.map((r) => ({
      fileId: typeof r.metadata?.fileId === "string" ? r.metadata.fileId : r.id,
      filename:
        typeof r.metadata?.filename === "string"
          ? r.metadata.filename
          : typeof r.metadata?.file_name === "string"
            ? r.metadata.file_name
            : typeof r.metadata?.title === "string"
              ? r.metadata.title
              : r.id,
      chunkTitle:
        typeof r.metadata?.title === "string" ? r.metadata.title : r.id,
      similarity: r.score,
    }));

    const context = filtered
      .map((r, i) => {
        const title =
          typeof r.metadata?.title === "string" ? r.metadata.title : r.id;
        const content =
          typeof r.metadata?.content === "string"
            ? r.metadata.content
            : typeof r.metadata?.text === "string"
              ? r.metadata.text
              : "";
        const filename =
          typeof r.metadata?.filename === "string"
            ? r.metadata.filename
            : typeof r.metadata?.file_name === "string"
              ? r.metadata.file_name
              : "알 수 없음";
        return [
          `[참고 ${i + 1}] ${title}`,
          `출처: ${filename}`,
          `유사도: ${r.score.toFixed(3)}`,
          content.slice(0, 700),
        ].join("\n");
      })
      .join("\n\n");

    return { context, sources };
  } catch (error) {
    console.warn("File RAG search failed:", error);
    return { context: "", sources: [] };
  }
}

export function formatRagContext(documents: RagDocumentRow[]) {
  if (documents.length === 0) return "검색된 임신 주차 문서 없음";

  return documents
    .map((document, index) =>
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
