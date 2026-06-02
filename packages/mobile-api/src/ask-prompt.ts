import { dbSelect } from "./db/admin-client";

export const MOBILE_ASK_PROMPT_KEY = "mobile_ask_prompt";

export type MobileAskPromptConfig = {
  tonePrompt: string;
  forbiddenTerms: string[];
};

export type MobileAskPromptContextBlock = {
  title: string;
  text: string;
};

export const DEFAULT_MOBILE_ASK_PROMPT_CONFIG: MobileAskPromptConfig = {
  tonePrompt: [
    "당신은 임산부를 따뜻하게 돕는 모성간호 안내 챗봇이에요.",
    "답변은 한국어, -어요/-해요 체로 자연스럽게 작성해주세요.",
    "첫 문장은 공감 한 문장으로 짧게 시작하고, 과한 축하·감탄·태담 권유는 쓰지 마세요.",
    "병원 안내만 반복하지 말고, 먼저 사용자가 바로 이해할 수 있는 관찰 기준과 안심 포인트를 말해주세요.",
    "제목은 필요한 경우에만 쓰고, 불릿은 4개 이하로 짧게 유지해주세요.",
  ].join("\n"),
  forbiddenTerms: ["context", "item", "title", "body", "참고", "자료", "출처"],
};

type SystemConfigRow = {
  value: unknown;
};

function normalizeStringList(input: unknown, fallback: string[]) {
  if (!Array.isArray(input)) return fallback;
  const values = input
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
  return values.length > 0 ? values : fallback;
}

export function normalizeMobileAskPromptConfig(
  input: unknown,
): MobileAskPromptConfig {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return DEFAULT_MOBILE_ASK_PROMPT_CONFIG;
  }

  const record = input as Partial<MobileAskPromptConfig>;
  const tonePrompt =
    typeof record.tonePrompt === "string" && record.tonePrompt.trim()
      ? record.tonePrompt.trim()
      : DEFAULT_MOBILE_ASK_PROMPT_CONFIG.tonePrompt;

  return {
    tonePrompt,
    forbiddenTerms: normalizeStringList(
      record.forbiddenTerms,
      DEFAULT_MOBILE_ASK_PROMPT_CONFIG.forbiddenTerms,
    ),
  };
}

export async function loadMobileAskPromptConfig() {
  const row = (
    await dbSelect<SystemConfigRow[]>(
      `system_config?select=value&key=eq.${MOBILE_ASK_PROMPT_KEY}&limit=1`,
    )
  )[0];

  return normalizeMobileAskPromptConfig(row?.value);
}

export function buildMobileAskPrompt(input: {
  query: string;
  currentWeek: number | null;
  contextBlocks: MobileAskPromptContextBlock[];
  config?: MobileAskPromptConfig;
}) {
  const config = input.config ?? DEFAULT_MOBILE_ASK_PROMPT_CONFIG;
  const normalizedConfig = normalizeMobileAskPromptConfig(config);
  const contextText = input.contextBlocks.length
    ? input.contextBlocks
        .map((block, index) =>
          `<item index="${index + 1}">\n<title>${block.title}</title>\n<body>${block.text}</body>\n</item>`.trim(),
        )
        .join("\n\n")
    : "<none />";

  const weekHint =
    typeof input.currentWeek === "number" && Number.isFinite(input.currentWeek)
      ? `산모 주차: ${input.currentWeek}주차`
      : "";

  return [
    normalizedConfig.tonePrompt,
    `<context> 안의 사실만 활용해서 답해주세요. 사용자에게 ${normalizedConfig.forbiddenTerms.join(", ")} 같은 말을 하지 마세요.`,
    "의학적 단정(진단·처방)은 하지 말고, 일반적인 정보와 자가돌봄 관점에서 안내해주세요.",
    "평소보다 태동이 확 줄었거나 거의 느껴지지 않는 경우, 출혈·복통·양수처럼 걱정되는 증상이 함께 있는 경우에는 담당 병원에 바로 문의하라고 부드럽게 안내해주세요.",
    weekHint,
    "",
    "<context>",
    contextText,
    "</context>",
    "",
    `질문: ${input.query}`,
  ]
    .filter(Boolean)
    .join("\n");
}
