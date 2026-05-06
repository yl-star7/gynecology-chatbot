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
const DEFAULT_DIRECT_INPUT_ACKNOWLEDGEMENT_TEXT = "기분을 나눠줘서 고마워요.";

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
        : DEFAULT_DIRECT_INPUT_ACKNOWLEDGEMENT_TEXT;
    const moodPrompts = Array.isArray(parsed.moodPrompts)
      ? parsed.moodPrompts
          .map(parseMoodPrompt)
          .filter((prompt): prompt is InitialMoodPrompt => prompt !== null)
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
      directInputAcknowledgementText: DEFAULT_DIRECT_INPUT_ACKNOWLEDGEMENT_TEXT,
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
