/**
 * mood_variants — (scenario, mood) 조합별 프롬프트 suffix 조회.
 *
 * 모바일 API가 LLM 호출 직전에 현재 scenario + mood 로 본 헬퍼를 호출하고,
 * 반환된 prompt_suffix 를 system prompt / tone context 에 덧붙인다.
 * DB(`public.content_mood_variants`) 를 source-of-truth 로 사용하며,
 * 운영자가 Admin UI 에서 수정하면 다음 대화부터 즉시 반영된다.
 */

import { prisma } from "@gynecology-chatbot/db/prisma";
import {
  generateGoogleText,
  type GoogleTextGenerationInput,
} from "./text-generation";

const ALLOWED_MOODS = new Set(["calm", "joyful", "anxious", "tired", "sad"]);
const MOOD_TEXT_LIMIT = 120;
const MEDICAL_CONTEXT_PATTERN =
  /아파|아프|통증|복통|두통|출혈|피가|피비|양수|수축|태동|열이|발열|어지러|어지럽|병원|응급|진통|하혈|배가|배는|배도|배랑/;

export type MoodVariantTone = "calm" | "joyful" | "anxious" | "tired" | "sad";
export type MoodClassificationTone = MoodVariantTone | "unknown";

export interface ResolveMoodVariantInput {
  scenario: string | null | undefined;
  mood: string | null | undefined;
  rngSeed?: number;
}

function pickRandom<T>(items: T[], seed?: number): T {
  if (items.length === 0) throw new Error("empty pool");
  const idx =
    seed !== undefined
      ? Math.abs(seed) % items.length
      : Math.floor(Math.random() * items.length);
  return items[idx];
}

export function createMoodVariantSeed(parts: Array<string | null | undefined>) {
  const source = parts
    .map((part) => part?.trim() ?? "")
    .filter(Boolean)
    .join("|");
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function inferMoodToneFromFreeText(
  value: string | null | undefined,
): MoodVariantTone | null {
  const text = value?.trim() ?? "";
  if (!text || text.length > MOOD_TEXT_LIMIT) return null;
  if (MEDICAL_CONTEXT_PATTERN.test(text)) return null;

  if (
    /속상|우울|울적|슬프|슬퍼|외롭|외로|눈물|서운|서러|상처|가라앉|힘들|허무|막막|처져/.test(
      text,
    )
  ) {
    return "sad";
  }
  if (/피곤|지쳤|지쳐|졸려|졸리|무기력|기운이 없|몸이 무겁|무거워/.test(text)) {
    return "tired";
  }
  if (
    /불안|걱정|답답|짜증|화나|화가|억울|예민|긴장|무서|두려|초조/.test(
      text,
    )
  ) {
    return "anxious";
  }
  if (/^좋아요$|기쁘|행복|좋은 기분|기분이 좋|신나|설레|감사|괜찮아졌/.test(text)) {
    return "joyful";
  }
  if (/괜찮|편안|차분|평온|그냥 그래/.test(text)) {
    return "calm";
  }
  return null;
}

export function parseMoodClassification(value: string): MoodClassificationTone {
  const normalized = value.trim().toLowerCase();
  return normalized === "calm" ||
    normalized === "joyful" ||
    normalized === "anxious" ||
    normalized === "tired" ||
    normalized === "sad" ||
    normalized === "unknown"
    ? normalized
    : "unknown";
}

function getGoogleApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
}

export async function classifyMoodToneWithLlm(input: {
  text: string;
  generate?: (input: GoogleTextGenerationInput) => Promise<string>;
}): Promise<MoodClassificationTone> {
  const text = input.text.trim();
  if (!text || text.length > MOOD_TEXT_LIMIT) return "unknown";
  if (MEDICAL_CONTEXT_PATTERN.test(text)) return "unknown";

  const apiKey = getGoogleApiKey();
  if (!apiKey) return inferMoodToneFromFreeText(text) ?? "unknown";

  try {
    const result = await (input.generate ?? generateGoogleText)({
      apiKey,
      model: "gemini-3.1-flash-lite",
      prompt: [
        "임산부 앱의 감정 확인 단계입니다.",
        "사용자 문장을 아래 라벨 중 하나로만 분류하세요.",
        "라벨: joyful, sad, anxious, tired, calm, unknown",
        "의학 증상/응급/진료 판단 문장이면 unknown.",
        "출력은 라벨 하나만 쓰세요. 설명 금지.",
        "",
        `문장: ${text}`,
      ].join("\n"),
    });
    return parseMoodClassification(result);
  } catch {
    return inferMoodToneFromFreeText(text) ?? "unknown";
  }
}

export function parseMoodVariantTextPool(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  } catch {
    // Fall back to newline-delimited pool text.
  }

  return trimmed
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter(Boolean);
}

/**
 * (scenario, mood) 매칭 active 변주 1개를 반환. 없거나 입력이 비어있으면 null.
 * scenario·mood 는 영문 enum 문자열을 기대한다 (예: "baby_info_offer" / "anxious").
 */
export async function resolveMoodVariantSuffix(
  input: ResolveMoodVariantInput,
): Promise<string | null> {
  const scenario = (input.scenario ?? "").trim();
  const mood = (input.mood ?? "").trim();
  if (!scenario || !mood) return null;
  if (!ALLOWED_MOODS.has(mood)) return null;

  try {
    const row = await prisma.content_mood_variants.findFirst({
      where: {
        scenario,
        mood,
        active: true,
      },
      select: { prompt_suffix: true },
    });
    const suffix = row?.prompt_suffix?.trim();
    return suffix ? suffix : null;
  } catch {
    // DB 장애 시 조용히 fallback — 핵심 응답 경로가 끊기지 않게.
    return null;
  }
}

export async function resolveMoodVariantTextPool(
  input: ResolveMoodVariantInput,
): Promise<string[]> {
  const suffix = await resolveMoodVariantSuffix(input);
  const pool = parseMoodVariantTextPool(suffix);
  if (pool.length === 0) return [];
  return input.rngSeed === undefined ? pool : [pickRandom(pool, input.rngSeed)];
}
