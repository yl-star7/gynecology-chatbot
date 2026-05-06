import { NextRequest, NextResponse } from "next/server";
import {
  generateGoogleText,
  type GoogleTextGenerationInput,
} from "@gynecology-chatbot/mobile-api/text-generation";

import { getSchiftClient } from "@/lib/mobile/schift-client";
import {
  isMobileSessionError,
  mobileNoStoreJson,
  requireMobileSession,
} from "@/lib/mobile/session-auth";
import { checkRateLimit } from "@/lib/mobile/rate-limit";

export const maxDuration = 60;

const SCHIFT_COLLECTION = "pregnancy-knowledge";
const SCHIFT_TOP_K = 10;
const CONTEXT_LIMIT = 5;
const SCHIFT_TIMEOUT_MS = 5_000;
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const MAX_QUERY_LENGTH = 1_000;

export type AskSource = {
  title: string;
  snippet: string;
};

export type AskResponseBody = {
  answer: string;
  sources: AskSource[];
};

type SchiftSearchResult = {
  id: string;
  score?: number;
  metadata?: Record<string, unknown> | null;
};

function getGoogleApiKey() {
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  return key;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
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

function normalizeSchiftResults(response: unknown): SchiftSearchResult[] {
  if (Array.isArray(response)) return response as SchiftSearchResult[];
  if (
    response &&
    typeof response === "object" &&
    Array.isArray((response as { results?: unknown }).results)
  ) {
    return (response as { results: SchiftSearchResult[] }).results;
  }
  return [];
}

function pickTextFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): { title: string; text: string } {
  const titleCandidate =
    (metadata?.title as string | undefined) ??
    (metadata?.filename as string | undefined) ??
    (metadata?.source as string | undefined) ??
    "참고 자료";
  const textCandidate =
    (metadata?.content as string | undefined) ??
    (metadata?.text as string | undefined) ??
    (metadata?.snippet as string | undefined) ??
    "";
  return {
    title: String(titleCandidate).trim() || "참고 자료",
    text: String(textCandidate).trim(),
  };
}

function snippetFromText(text: string, limit = 220) {
  if (!text) return "";
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit).trim()}…`;
}

export type SearchKnowledgeDeps = {
  getClient?: () => ReturnType<typeof getSchiftClient>;
  timeoutMs?: number;
};

export async function searchKnowledge(
  query: string,
  currentWeek: number | null,
  deps: SearchKnowledgeDeps = {},
): Promise<SchiftSearchResult[]> {
  const getClient = deps.getClient ?? getSchiftClient;
  const timeoutMs = deps.timeoutMs ?? SCHIFT_TIMEOUT_MS;

  const client = getClient();
  if (!client) return [];

  try {
    // filter 인자는 Schift SDK 버전에 따라 지원되지 않을 수 있어 client-side 필터로 안전하게 처리.
    const response = await withTimeout(
      client.search({
        query,
        collection: SCHIFT_COLLECTION,
        topK: SCHIFT_TOP_K,
        filter: { surface: "rag" },
      } as Parameters<typeof client.search>[0]),
      timeoutMs,
      "Schift ask search",
    );

    const results = normalizeSchiftResults(response).filter((result) => {
      const surface = result.metadata?.surface;
      if (surface && typeof surface === "string" && surface === "archive") {
        return false;
      }
      return true;
    });

    if (typeof currentWeek === "number" && Number.isFinite(currentWeek)) {
      const weekMatched = results.filter((result) => {
        const raw =
          result.metadata?.pregnancy_week ??
          result.metadata?.pregnancyWeek ??
          result.metadata?.week;
        if (typeof raw === "number") return Math.abs(raw - currentWeek) <= 2;
        if (typeof raw === "string") {
          const parsed = Number.parseInt(raw, 10);
          return Number.isFinite(parsed)
            ? Math.abs(parsed - currentWeek) <= 2
            : true;
        }
        return true;
      });
      if (weekMatched.length > 0) return weekMatched.slice(0, CONTEXT_LIMIT);
    }

    return results.slice(0, CONTEXT_LIMIT);
  } catch (error) {
    console.warn("ask route: Schift search failed", error);
    return [];
  }
}

function buildPrompt(input: {
  query: string;
  currentWeek: number | null;
  contextBlocks: Array<{ title: string; text: string }>;
}) {
  const contextText = input.contextBlocks.length
    ? input.contextBlocks
        .map((block, index) =>
          `[자료 ${index + 1}] ${block.title}\n${block.text}`.trim(),
        )
        .join("\n\n")
    : "(참고 자료가 없어요. 일반적인 산전 정보 범위에서만 답해주세요.)";

  const weekHint =
    typeof input.currentWeek === "number" && Number.isFinite(input.currentWeek)
      ? `\n산모 주차: ${input.currentWeek}주차`
      : "";

  return [
    "당신은 임산부를 따뜻하게 돕는 모성간호 안내 챗봇이에요.",
    "아래 '참고 자료'만 근거로 질문에 답해주세요. 자료에 없으면 추측하지 말고, 병원이나 전문가 상담을 권해주세요.",
    "답변은 한국어, -어요/-해요 체로 상냥하게, 필요하면 마크다운(제목, 불릿)으로 정리해주세요.",
    "의학적 단정(진단·처방)은 하지 말고, 일반적인 정보와 자가돌봄 관점에서 안내해주세요.",
    weekHint,
    "",
    "참고 자료:",
    contextText,
    "",
    `질문: ${input.query}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export type GenerateAnswerDeps = {
  generate?: (input: GoogleTextGenerationInput) => Promise<string>;
  getApiKey?: () => string;
};

export async function generateAnswer(
  prompt: string,
  deps: GenerateAnswerDeps = {},
): Promise<string> {
  const generate = deps.generate ?? generateGoogleText;
  const getApiKey = deps.getApiKey ?? getGoogleApiKey;

  const text = await generate({
    apiKey: getApiKey(),
    model: GEMINI_MODEL,
    prompt,
  });

  return text.trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      query?: unknown;
      currentWeek?: unknown;
      userId?: unknown;
    };

    const query = typeof body.query === "string" ? body.query.trim() : "";
    const currentWeek =
      typeof body.currentWeek === "number" && Number.isFinite(body.currentWeek)
        ? Math.round(body.currentWeek)
        : null;
    const hintedUserId = typeof body.userId === "string" ? body.userId : "";

    if (!query) {
      return NextResponse.json(
        { error: "질문을 입력해 주세요." },
        { status: 400 },
      );
    }

    if (query.length > MAX_QUERY_LENGTH) {
      return NextResponse.json(
        { error: "질문이 너무 길어요. 1,000자 이내로 줄여주세요." },
        { status: 400 },
      );
    }

    const { userId } = await requireMobileSession(request, hintedUserId);

    const rateCheck = checkRateLimit(`ask:${userId}`, 20, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "너무 많은 요청이에요. 잠시 후 다시 시도해주세요." },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateCheck.resetAt - Date.now()) / 1000),
            ),
            "X-RateLimit-Remaining": "0",
          },
        },
      );
    }

    const results = await searchKnowledge(query, currentWeek);
    const contextBlocks = results
      .map((result) => pickTextFromMetadata(result.metadata))
      .filter((block) => block.text.length > 0);

    const prompt = buildPrompt({
      query,
      currentWeek,
      contextBlocks,
    });

    const answerText = await generateAnswer(prompt);

    const sources: AskSource[] = contextBlocks.map((block) => ({
      title: block.title,
      snippet: snippetFromText(block.text),
    }));

    const payload: AskResponseBody = {
      answer:
        answerText ||
        "죄송해요, 지금은 답을 만들지 못했어요. 잠시 후 다시 시도해 주세요.",
      sources,
    };

    return mobileNoStoreJson(payload);
  } catch (error) {
    if (isMobileSessionError(error)) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 401 },
      );
    }
    console.error("mobile ask route error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "답변 생성에 실패했어요.",
      },
      { status: 500 },
    );
  }
}
