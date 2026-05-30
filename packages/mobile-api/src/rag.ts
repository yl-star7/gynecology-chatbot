import { dbSelect } from "./db/admin-client";
import { getSchiftClient } from "./schift-client";

type DisabledFileRow = { id: string };

/**
 * 텍스트북 챕터 PDF의 active 버전. v1(ODL spaceless), v2(pdftotext column 깨짐)
 * 는 모두 동일 chapter 의 노이즈 사본이라 검색에서 제외하고 v3(Gemini OCR)만 사용한다.
 */
const ACTIVE_TEXTBOOK_SOURCE = "catholic_si_textbook_v3";

/**
 * Query rewriting 활성화 여부. RAG_QUERY_REWRITE=1 로 켜면 사용자 query 를 임상/학술
 * 용어로 확장한 뒤 retrieval. 비용은 호출당 약 $0.0001 (gemini-3.1-flash-lite).
 * GEMINI_API_KEY 가 없거나 호출 실패시 원본 query 그대로 사용 (graceful fallback).
 */
const QUERY_REWRITE_ENABLED = process.env.RAG_QUERY_REWRITE === "1";
const QUERY_REWRITE_TIMEOUT_MS = 1500;
const QUERY_REWRITE_MODEL = "gemini-3.1-flash-lite";
const SCHIFT_EMBEDDINGS_URL =
  process.env.SCHIFT_EMBEDDINGS_URL ?? "https://embed.schift.io/embeddings";

/**
 * v3 OCR(Gemini Flash Lite) 단계에서 발생한 의학용어 오인식의 클라이언트사이드 보정.
 * 검색 결과 chunk text 가 LLM 컨텍스트로 들어가기 전에 적용 — embedding 자체는 오인식을
 * 그대로 보유하지만, 매칭이 의미적으로 정상 작동하므로 출력 텍스트만 후처리한다.
 *
 * 패턴 추가 절차:
 * 1) 의학용어 사전 또는 corpus 검수로 확인
 * 2) 한 단어가 오타로 100% 명확할 때만 추가 (false-positive 위험 큰 단어는 제외)
 */
const OCR_TYPO_FIXES: Array<{ pattern: RegExp; replacement: string }> = [
  // 06_Ⅳ_01 chapter — Apgar 신생아 평가에서 "즉각적인" → "촉각적인" 오인식 (3 occurrences)
  { pattern: /촉각적인 평가/g, replacement: "즉각적인 평가" },
  { pattern: /촉각적인 간호/g, replacement: "즉각적인 간호" },
];

function applyOcrTypoFixes(text: string): string {
  let out = text;
  for (const { pattern, replacement } of OCR_TYPO_FIXES) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

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

export class RagSearchError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "RagSearchError";
    this.cause = options?.cause;
  }
}

const PGVECTOR_DIMENSION = 1024;
const FILE_RAG_TIMEOUT_MS = 5000;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function normalizeEmbeddingLength(values: number[]) {
  return values.slice(0, PGVECTOR_DIMENSION);
}

type SchiftEmbeddingResponse = {
  data?: Array<{
    embedding?: number[];
  }>;
};

async function embedViaSchiftEndpoint(content: string): Promise<number[]> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (process.env.SCHIFT_API_KEY) {
    headers.Authorization = `Bearer ${process.env.SCHIFT_API_KEY}`;
  }

  const response = await fetch(SCHIFT_EMBEDDINGS_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ input: [content], dimensions: PGVECTOR_DIMENSION }),
  });

  if (!response.ok) {
    throw new Error(`Schift embeddings failed: HTTP ${response.status}`);
  }

  const payload = (await response.json()) as SchiftEmbeddingResponse;
  const embedding = payload.data?.[0]?.embedding;
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error("Schift embeddings response did not include an embedding");
  }

  return normalizeEmbeddingLength(embedding);
}

async function getDisabledFileIds(): Promise<Set<string>> {
  try {
    const rows = await dbSelect<DisabledFileRow[]>(
      "content_rag_files?select=id&enabled=eq.false",
    );
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

function parseWeekFromFilename(name: string | undefined): number | null {
  if (!name) return null;
  // 우리 ingest 패턴들:
  //   week-18-overview.txt / week-18-day-3.txt    → group 1
  //   18주차.docx / 18주차_anything.docx           → group 2
  //   임신_18주_...                                → group 3
  const m = name.match(
    /(?:^|[\/_-])week[-_](\d{1,2})\b|^(\d{1,2})주차\b|임신[_\s]?(\d{1,2})주\b/i,
  );
  if (!m) return null;
  const raw = m[1] ?? m[2] ?? m[3];
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n >= 1 && n <= 42 ? n : null;
}

function parseSurfaceFromFilename(name: string | undefined): string | null {
  if (!name) return null;
  if (/^week-\d+-overview\.txt$/i.test(name)) return "week_overview";
  if (/^week-\d+-day-\d+\.txt$/i.test(name)) return "week_day";
  if (/임신_주수별_발달정보\.docx$/i.test(name)) return "archive";
  if (/\.docx$/i.test(name)) return "rag";
  return null;
}

function readPregnancyWeekFromMetadata(
  metadata: Record<string, unknown> | undefined,
) {
  const rawWeek =
    metadata?.pregnancy_week ?? metadata?.pregnancyWeek ?? metadata?.week;
  if (typeof rawWeek === "number") return rawWeek;
  if (typeof rawWeek === "string") {
    const parsed = Number.parseInt(rawWeek, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  // metadata 가 비어있는 기존 문서: file_name 으로 fallback 추론.
  const fileName = metadata?.file_name ?? metadata?.filename;
  return parseWeekFromFilename(
    typeof fileName === "string" ? fileName : undefined,
  );
}

function readSurfaceFromMetadata(
  metadata: Record<string, unknown> | undefined,
): string | null {
  const surface = metadata?.surface;
  if (typeof surface === "string" && surface.trim()) return surface;
  const fileName = metadata?.file_name ?? metadata?.filename;
  return parseSurfaceFromFilename(
    typeof fileName === "string" ? fileName : undefined,
  );
}

function isWeekInRange(week: number | null, currentWeek: number | null) {
  if (!currentWeek || week === null) {
    return true;
  }

  return Math.abs(week - currentWeek) <= 1;
}

/**
 * 사용자 query 를 임상/학술 용어로 확장한다.
 *
 * 예시:
 *   "32주차에 조기진통 같은 느낌이 있어요"
 *     → "임신 32주 preterm labor 조기진통 자궁수축 임상 관리 증상 처치"
 *
 * Gemini API 가 비활성화/실패하면 원본 query 그대로 반환 (graceful degrade).
 */
async function rewriteQueryForRetrieval(
  query: string,
  currentWeek: number | null,
): Promise<string> {
  if (!QUERY_REWRITE_ENABLED) return query;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return query;

  const weekHint =
    currentWeek != null ? `\n현재 임신 주차: ${currentWeek}주차.` : "";
  const prompt = `다음 한국어 임산부 발화를 한국어 임상/학술 용어로 확장한 검색 쿼리로 변환하세요. 원래 의도를 보존하며 전문 의학 용어와 영문 약어(있다면)를 함께 포함합니다. 설명 없이 확장된 검색 쿼리 한 줄만 반환하세요.${weekHint}

발화: ${query}
검색 쿼리:`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${QUERY_REWRITE_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 120,
          },
        }),
        signal: AbortSignal.timeout(QUERY_REWRITE_TIMEOUT_MS),
      },
    );
    if (!response.ok) return query;
    const json = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) return query;
    // 원본 query 의 단어를 함께 보존해서 기존 매칭도 유지.
    return `${query} ${text}`;
  } catch {
    return query;
  }
}

async function searchViaSchift(
  query: string,
  currentWeek: number | null,
  matchCount: number,
): Promise<RagDocumentRow[]> {
  const schift = getSchiftClient();
  if (!schift) throw new Error("Schift client not configured");

  // Step 1: query rewriting (optional, env-gated).
  const expandedQuery = await rewriteQueryForRetrieval(query, currentWeek);

  // Step 2: dual-channel retrieval — week-specific + common reference.
  // Server-side filter 로 v1/v2 노이즈 + archive 사전 차단.
  const halfCount = Math.max(3, Math.ceil(matchCount / 2) + 2);
  const channels: Promise<unknown>[] = [];

  if (currentWeek != null) {
    channels.push(
      withTimeout(
        schift.search({
          query: expandedQuery,
          bucket: "pregnancy-knowledge",
          topK: halfCount,
          filter: { week: String(currentWeek) },
        }),
        FILE_RAG_TIMEOUT_MS,
        "Schift weekly search",
      ),
    );
  }

  channels.push(
    withTimeout(
      schift.search({
        query: expandedQuery,
        bucket: "pregnancy-knowledge",
        topK: halfCount,
        filter: { surface: "common", source: ACTIVE_TEXTBOOK_SOURCE },
      }),
      FILE_RAG_TIMEOUT_MS,
      "Schift common search",
    ),
  );

  const [responses, disabledIds] = await Promise.all([
    Promise.all(channels),
    getDisabledFileIds(),
  ]);

  // Step 3: merge channels, dedupe, score-sort.
  const merged: SchiftSearchResult[] = [];
  const seen = new Set<string>();
  for (const response of responses) {
    for (const item of normalizeSchiftSearchResults(response)) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      merged.push(item);
    }
  }
  merged.sort((a, b) => b.score - a.score);

  const enabledResults = merged.filter(
    (result) => !isResultFromDisabledFile(result, disabledIds),
  );

  return enabledResults.slice(0, matchCount).map((result) => {
    const rawContent =
      typeof result.metadata?.content === "string"
        ? result.metadata.content
        : typeof result.metadata?.text === "string"
          ? result.metadata.text
          : "";
    return {
      id: result.id,
      title:
        typeof result.metadata?.title === "string"
          ? result.metadata.title
          : result.id,
      content: applyOcrTypoFixes(rawContent),
      pregnancy_week:
        typeof result.metadata?.pregnancy_week === "number"
          ? result.metadata.pregnancy_week
          : readPregnancyWeekFromMetadata(result.metadata),
      category:
        typeof result.metadata?.category === "string"
          ? result.metadata.category
          : readSurfaceFromMetadata(result.metadata) === "common"
            ? "textbook"
            : "schift",
      metadata: result.metadata ?? null,
      similarity: result.score,
    };
  });
}

export async function retrievePregnancyContext(input: {
  query: string;
  currentWeek: number | null;
  matchCount?: number;
}) {
  if (!input.query.trim()) return [] as RagDocumentRow[];

  const count = input.matchCount ?? 7;

  try {
    return await searchViaSchift(input.query, input.currentWeek, count);
  } catch (error) {
    console.warn("Schift RAG search failed:", error);
    throw new RagSearchError(
      `Schift RAG search failed: ${getErrorMessage(error)}`,
      { cause: error },
    );
  }
}

export async function embedPregnancyDocument(
  content: string,
): Promise<number[]> {
  if (!content.trim()) throw new Error("Content is empty");

  try {
    return await embedViaSchiftEndpoint(content);
  } catch (endpointError) {
    const schift = getSchiftClient();
    if (!schift) throw endpointError;

    const result = await schift.embed({ text: content });
    return normalizeEmbeddingLength(result.embedding);
  }
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
  if (!schift) throw new Error("Schift client not configured");

  const count = input.matchCount ?? 7;
  const currentWeek = input.currentWeek ?? null;

  try {
    // Step 1: query rewriting (env-gated).
    const expandedQuery = await rewriteQueryForRetrieval(
      input.query,
      currentWeek,
    );

    // Step 2: dual-channel retrieval — week + common(v3 only).
    const halfCount = Math.max(3, Math.ceil(count / 2) + 2);
    const channels: Promise<unknown>[] = [];

    if (currentWeek != null) {
      channels.push(
        withTimeout(
          schift.search({
            query: expandedQuery,
            bucket: "pregnancy-knowledge",
            topK: halfCount,
            filter: { week: String(currentWeek) },
          }),
          FILE_RAG_TIMEOUT_MS,
          "File RAG weekly search",
        ),
      );
    }

    channels.push(
      withTimeout(
        schift.search({
          query: expandedQuery,
          bucket: "pregnancy-knowledge",
          topK: halfCount,
          filter: { surface: "common", source: ACTIVE_TEXTBOOK_SOURCE },
        }),
        FILE_RAG_TIMEOUT_MS,
        "File RAG common search",
      ),
    );

    const [responses, disabledIds] = await Promise.all([
      Promise.all(channels),
      getDisabledFileIds(),
    ]);

    // Step 3: merge channels, dedupe, score-sort.
    const merged: SchiftSearchResult[] = [];
    const seen = new Set<string>();
    for (const response of responses) {
      for (const item of normalizeSchiftSearchResults(response)) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        merged.push(item);
      }
    }
    merged.sort((a, b) => b.score - a.score);

    const filtered = merged
      .filter((r) => !isResultFromDisabledFile(r, disabledIds))
      .slice(0, count);

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
        const rawContent =
          typeof r.metadata?.content === "string"
            ? r.metadata.content
            : typeof r.metadata?.text === "string"
              ? r.metadata.text
              : "";
        const content = applyOcrTypoFixes(rawContent);
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
    throw new RagSearchError(
      `File RAG search failed: ${getErrorMessage(error)}`,
      { cause: error },
    );
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
