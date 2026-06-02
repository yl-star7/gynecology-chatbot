import { Hono } from "hono";

import { getSchiftClient } from "@gynecology-chatbot/mobile-api/schift-client";
import { checkRateLimit } from "@gynecology-chatbot/mobile-api/rate-limit";
import { searchDbFileRag } from "@gynecology-chatbot/mobile-api/rag";
import { generateGoogleText } from "@gynecology-chatbot/mobile-api/text-generation";
import {
  buildMobileAskPrompt,
  loadMobileAskPromptConfig,
} from "@gynecology-chatbot/mobile-api/ask-prompt";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "../../lib/session-auth.js";
import { noStoreJson } from "../../lib/responses.js";

const app = new Hono();

const SCHIFT_COLLECTION = "pregnancy-knowledge";
const SCHIFT_TOP_K = 10;
const CONTEXT_LIMIT = 5;
const SCHIFT_TIMEOUT_MS = 5_000;
const GEMINI_MODEL = "gemini-3.1-flash-lite";
const MAX_QUERY_LENGTH = 1_000;

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

function buildContextBlocksFromDbRag(context: string) {
  return context
    .split(/(?=^\[참고\s+\d+\]\s*)/m)
    .map((block, index) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const title =
        lines[0]?.replace(/^\[참고\s+\d+\]\s*/, "").trim() ||
        `참고 자료 ${index + 1}`;
      return {
        title,
        text: lines.join("\n"),
      };
    })
    .filter((block) => block.text.length > 0);
}

async function searchKnowledge(
  query: string,
  currentWeek: number | null,
): Promise<SchiftSearchResult[]> {
  const client = getSchiftClient();
  if (!client) return [];

  try {
    const response = await withTimeout(
      client.search({
        query,
        collection: SCHIFT_COLLECTION,
        topK: SCHIFT_TOP_K,
        filter: { surface: "rag" },
      } as Parameters<typeof client.search>[0]),
      SCHIFT_TIMEOUT_MS,
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

async function generateAnswer(prompt: string): Promise<string> {
  const text = await generateGoogleText({
    apiKey: getGoogleApiKey(),
    model: GEMINI_MODEL,
    prompt,
  });

  return text.trim();
}

app.post("/", async (c) => {
  try {
    const body = (await c.req.json().catch(() => ({}))) as {
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
      return c.json({ error: "질문을 입력해 주세요." }, 400);
    }

    if (query.length > MAX_QUERY_LENGTH) {
      return c.json(
        { error: "질문이 너무 길어요. 1,000자 이내로 줄여주세요." },
        400,
      );
    }

    const { userId } = await requireMobileSession(c, hintedUserId);

    const rateCheck = checkRateLimit(`ask:${userId}`, 20, 60_000);
    if (!rateCheck.allowed) {
      c.header(
        "Retry-After",
        String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)),
      );
      c.header("X-RateLimit-Remaining", "0");
      return c.json(
        { error: "너무 많은 요청이에요. 잠시 후 다시 시도해주세요." },
        429,
      );
    }

    const searchStartMs = Date.now();
    const results = await searchKnowledge(query, currentWeek);
    const searchDurationMs = Date.now() - searchStartMs;
    let contextBlocks = results
      .map((result) => pickTextFromMetadata(result.metadata))
      .filter((block) => block.text.length > 0);

    if (contextBlocks.length === 0) {
      try {
        const dbRag = await searchDbFileRag({
          currentWeek,
          matchCount: CONTEXT_LIMIT,
        });
        contextBlocks = buildContextBlocksFromDbRag(dbRag.context);
        if (contextBlocks.length > 0) {
          console.info(
            JSON.stringify({
              event: "mobile_ask_db_rag_recovery",
              userId,
              currentWeek,
              sourceCount: dbRag.sources.length,
            }),
          );
        }
      } catch (error) {
        console.warn("ask route: DB RAG recovery failed", error);
      }
    }

    console.info(
      JSON.stringify({
        event: "mobile_ask_search",
        userId,
        currentWeek,
        queryLen: query.length,
        rawCount: results.length,
        contextCount: contextBlocks.length,
        searchMs: searchDurationMs,
        topTitles: contextBlocks.slice(0, 3).map((b) => b.title),
        rawSurfaces: results
          .slice(0, 5)
          .map((r) => r.metadata?.surface ?? null),
      }),
    );

    const promptConfig = await loadMobileAskPromptConfig();
    const prompt = buildMobileAskPrompt({
      query,
      currentWeek,
      contextBlocks,
      config: promptConfig,
    });

    const answerText = await generateAnswer(prompt);

    return noStoreJson(c, {
      answer:
        answerText ||
        "죄송해요, 지금은 답을 만들지 못했어요. 잠시 후 다시 시도해 주세요.",
    });
  } catch (error) {
    console.error("mobile ask route error", error);
    return mobileRouteErrorResponse(c, error, "답변 생성에 실패했어요.");
  }
});

export default app;
