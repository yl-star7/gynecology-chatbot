import type { ChatMessage, EmotionTone } from "@gynecology-chatbot/app-core";
import type { CharacterTone } from "./workflow-payload";

export type InitialMoodPrompt = {
  label: string;
  message: string;
  tone: CharacterTone;
};

export type InitialMoodIntakeConfig = {
  scenario: "mood_intake";
  promptText: string;
  directInputAcknowledgementText: string;
  moodPrompts: InitialMoodPrompt[];
};

const DEFAULT_PROMPT_TEXT =
  "오늘은 마음이 어떠세요?\n\n편하게 하나만 골라도 좋고, 직접 말해줘도 괜찮아요.";
export const DIRECT_INPUT_MOOD_LABEL = "직접 말하고 싶어요";
export const DIRECT_INPUT_MOOD_MESSAGE = "직접 말하고 싶어요.";
export const DIRECT_INPUT_MOOD_ACKNOWLEDGEMENT_TEXT =
  "오늘의 기분 나눠줘서 고마워요. 잘 기억해서 차근차근 더 이야기 해볼게요.";

const ALLOWED_TONES = new Set<CharacterTone>([
  "calm",
  "joyful",
  "anxious",
  "tired",
  "sad",
]);

const INITIAL_CHOICE_IDS = [
  "initial-workflow-good",
  "initial-workflow-down",
  "initial-workflow-sad",
  "initial-workflow-angry",
  "initial-workflow-direct",
] as const;

const FIXED_INITIAL_MOOD_MESSAGES_BY_LABEL = new Map<string, string>([
  ["좋아요", "오늘은 좋은 기분이에요."],
  ["우울해요", "오늘은 우울한 기분이에요."],
  ["울적해요", "오늘은 울적한 기분이에요."],
  ["슬퍼요", "오늘은 슬픈 기분이에요."],
  ["화나요", "오늘은 화나는 기분이에요."],
  ["짜증나요", "오늘은 짜증나는 기분이에요."],
  ["걱정돼요", "오늘은 걱정되는 기분이에요."],
  ["불안해요", "오늘은 불안한 기분이에요."],
  ["피곤해요", "오늘은 피곤한 기분이에요."],
  ["졸려요", "오늘은 졸린 기분이에요."],
  ["무거워요", "오늘은 무거운 기분이에요."],
  ["외로워요", "오늘은 외로운 기분이에요."],
  ["답답해요", "오늘은 답답한 기분이에요."],
  ["예민해요", "오늘은 예민한 기분이에요."],
  ["편안해요", "오늘은 편안한 기분이에요."],
  ["차분해요", "오늘은 차분한 기분이에요."],
  ["괜찮아요", "오늘은 괜찮은 기분이에요."],
  ["설레요", "오늘은 설레는 기분이에요."],
  ["기대돼요", "오늘은 기대되는 기분이에요."],
  ["감사해요", "오늘은 감사한 기분이에요."],
]);

function normalizeTone(value: unknown): CharacterTone | null {
  return typeof value === "string" && ALLOWED_TONES.has(value as CharacterTone)
    ? (value as CharacterTone)
    : null;
}

function parseMoodPrompt(value: unknown): InitialMoodPrompt | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const label = typeof record.label === "string" ? record.label.trim() : "";
  const message =
    typeof record.message === "string" ? record.message.trim() : "";
  const tone = normalizeTone(record.tone);

  if (!label || !message || !tone) {
    return null;
  }

  return { label, message, tone };
}

function isDirectMoodPrompt(prompt: InitialMoodPrompt, index?: number) {
  return (
    index === 4 ||
    prompt.label === "직접 입력" ||
    prompt.label === DIRECT_INPUT_MOOD_LABEL ||
    prompt.message.replace(/\s+/g, " ").trim() === DIRECT_INPUT_MOOD_MESSAGE
  );
}

export function normalizeInitialMoodPrompts(
  prompts: InitialMoodPrompt[],
): InitialMoodPrompt[] {
  return prompts.map((prompt, index) => {
    if (isDirectMoodPrompt(prompt, index)) {
      return {
        label: DIRECT_INPUT_MOOD_LABEL,
        message: DIRECT_INPUT_MOOD_MESSAGE,
        tone: "calm",
      };
    }

    if (index < INITIAL_CHOICE_IDS.length - 1) {
      return {
        ...prompt,
        message:
          FIXED_INITIAL_MOOD_MESSAGES_BY_LABEL.get(prompt.label) ??
          prompt.message,
      };
    }

    return prompt;
  });
}

export async function resolveSelectedMoodEntry(input: {
  text: string;
  selectedMoodTone: CharacterTone | null;
  canInferFreeTextMood: boolean;
  moodPool: InitialMoodPrompt[];
  classifyMoodTone: (input: {
    text: string;
  }) => Promise<CharacterTone | "unknown">;
}): Promise<InitialMoodPrompt | null> {
  const text = input.text.trim();
  const matchedMoodEntry = input.selectedMoodTone
    ? (input.moodPool.find((m) => m.message === text) ?? null)
    : null;

  if (input.selectedMoodTone) {
    return {
      label: matchedMoodEntry?.label ?? text,
      message: text,
      tone: input.selectedMoodTone,
    };
  }

  if (!input.canInferFreeTextMood) {
    return null;
  }

  const inferredTone =
    text === DIRECT_INPUT_MOOD_MESSAGE
      ? "calm"
      : await input.classifyMoodTone({ text });

  if (inferredTone === "unknown") {
    return null;
  }

  return {
    label: "직접 입력",
    message: text,
    tone: inferredTone,
  };
}

export function parseInitialMoodIntakeConfig(
  promptJson: string | undefined,
): InitialMoodIntakeConfig {
  try {
    const parsed = JSON.parse(promptJson ?? "{}") as Record<string, unknown>;
    const promptText =
      typeof parsed.promptText === "string" && parsed.promptText.trim()
        ? parsed.promptText.trim()
        : DEFAULT_PROMPT_TEXT;
    const directInputAcknowledgementText =
      typeof parsed.directInputAcknowledgementText === "string" &&
      parsed.directInputAcknowledgementText.trim()
        ? parsed.directInputAcknowledgementText.trim()
        : DIRECT_INPUT_MOOD_ACKNOWLEDGEMENT_TEXT;
    const moodPrompts = Array.isArray(parsed.moodPrompts)
      ? normalizeInitialMoodPrompts(
          parsed.moodPrompts
            .map(parseMoodPrompt)
            .filter((prompt): prompt is InitialMoodPrompt => prompt !== null),
        )
      : [];

    return {
      scenario: "mood_intake",
      promptText,
      directInputAcknowledgementText,
      moodPrompts,
    };
  } catch {
    return {
      scenario: "mood_intake",
      promptText: DEFAULT_PROMPT_TEXT,
      directInputAcknowledgementText: DIRECT_INPUT_MOOD_ACKNOWLEDGEMENT_TEXT,
      moodPrompts: [],
    };
  }
}

export function buildInitialWorkflowMessage(
  input: InitialMoodIntakeConfig,
): ChatMessage {
  return {
    id: "assistant-initial-workflow",
    role: "assistant",
    createdAtLabel: "방금 전",
    characterTone: "calm",
    parts: [
      {
        type: "text",
        id: "initial-workflow-text",
        text: input.promptText,
      },
      {
        type: "quickReplies",
        id: "initial-workflow-quick",
        choices: input.moodPrompts.slice(0, 5).map((prompt, index) => ({
          id: INITIAL_CHOICE_IDS[index] ?? `initial-workflow-mood-${index + 1}`,
          label: prompt.label,
          message: prompt.message,
          ...(index === 4 ? {} : { moodTone: prompt.tone as EmotionTone }),
        })),
      },
    ],
  };
}

export function createInitialWorkflowMessageFromPrompt(
  promptJson: string | undefined,
) {
  return buildInitialWorkflowMessage(parseInitialMoodIntakeConfig(promptJson));
}
