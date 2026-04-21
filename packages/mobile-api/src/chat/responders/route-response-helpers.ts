import type { ChatMessage } from "@gynecology-chatbot/app-core";

import {
  type CharacterTone,
  parseWorkflowAssistantPayload,
  type ProfileMemoryPayload,
  type SessionMemoryPayload,
  type WorkflowScenario,
} from "../workflow-payload";
import { sanitizeInlineCitationMarkers } from "../sanitizers";

const CHARACTER_TONE_CONFIG = {
  calm: {
    label: "차분한 안내",
    background: "#edf4fb",
    emoji: "\u{1F60C}",
  },
  joyful: {
    label: "밝은 안내",
    background: "#eef8e8",
    emoji: "\u{1F60A}",
  },
  anxious: {
    label: "걱정 어린 안내",
    background: "#fff2df",
    emoji: "\u{1F61F}",
  },
  tired: {
    label: "쉬임이 필요한 안내",
    background: "#f4ede6",
    emoji: "\u{1F634}",
  },
  sad: {
    label: "위로하는 안내",
    background: "#f2edf7",
    emoji: "\u{1F622}",
  },
} satisfies Record<
  CharacterTone,
  {
    label: string;
    background: string;
    emoji: string;
  }
>;

export function pickLatestEmotionTone(input: {
  sessionMemory: SessionMemoryPayload | null;
  profileMemory: ProfileMemoryPayload | null;
}) {
  return (
    input.profileMemory?.lastEmotionTone ??
    input.sessionMemory?.lastEmotionTone ??
    null
  );
}

export function buildMemorySystemBlock(input: {
  compactSummary: string | null;
  lastScenario: WorkflowScenario | null;
  lastCharacterTone: CharacterTone | null;
  lastEmotionTone: CharacterTone | null;
  personaHint?: string | null;
  personaConfidence?: string | null;
  tonePreference: string | null;
}) {
  return [
    input.compactSummary ? `최근 세션 요약: ${input.compactSummary}` : null,
    input.lastScenario ? `직전 상담 분기: ${input.lastScenario}` : null,
    input.lastCharacterTone
      ? `직전 캐릭터 톤: ${input.lastCharacterTone}`
      : null,
    input.lastEmotionTone ? `최근 감정 톤: ${input.lastEmotionTone}` : null,
    input.personaHint
      ? `상담 성향 힌트: ${input.personaHint}${
          input.personaConfidence ? ` (${input.personaConfidence})` : ""
        }`
      : null,
    input.tonePreference
      ? `사용자 선호 상담 분위기: ${input.tonePreference}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function createCharacterImageUrl(
  tone: CharacterTone,
  customImageUrl?: string | null,
): { imageUrl: string; useIllustration: boolean } {
  if (customImageUrl) {
    return { imageUrl: customImageUrl, useIllustration: true };
  }

  const selected = CHARACTER_TONE_CONFIG[tone];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-label="${selected.label}">
      <rect width="128" height="128" rx="36" fill="${selected.background}" />
      <text x="64" y="72" text-anchor="middle" font-size="46">${selected.emoji}</text>
      <rect x="38" y="92" width="52" height="18" rx="9" fill="#ffffff" opacity="0.86" />
      <text x="64" y="104" text-anchor="middle" font-family="Noto Sans KR, sans-serif" font-size="10" fill="#5a4c45">${selected.label}</text>
    </svg>
  `.trim();

  return {
    imageUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    useIllustration: false,
  };
}

function stripQuestionChoicesFromAnswer(input: {
  text: string;
  quickReplies?: Array<{ label: string; message: string }>;
  scenario?: string;
}) {
  if (
    input.scenario !== "attachment_question" ||
    !input.quickReplies ||
    input.quickReplies.length === 0
  ) {
    return input.text;
  }

  const labels = input.quickReplies
    .flatMap((choice) => [choice.label, choice.message])
    .map((value) => value.trim())
    .filter(Boolean);

  return input.text
    .split("\n")
    .filter((line) => {
      const normalized = line.replace(/^[-*•]\s*/, "").trim();
      return !labels.some(
        (label) =>
          normalized === label ||
          normalized.includes(label) ||
          label.includes(normalized),
      );
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractQuestionChoicesFromAnswer(text: string) {
  return text
    .split("\n")
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter((line) => line.endsWith("?"))
    .slice(0, 2)
    .map((question) => ({ label: question, message: question }));
}

function resolveQuickReplies(input: {
  answer: string;
  scenario?: string;
  quickReplies?: Array<{ label: string; message: string }>;
}) {
  if (input.quickReplies && input.quickReplies.length > 0) {
    return input.quickReplies;
  }

  if (input.scenario === "attachment_question") {
    const extracted = extractQuestionChoicesFromAnswer(input.answer);
    if (extracted.length > 0) return extracted;
  }

  if (input.scenario === "emotion_reason") {
    return [
      { label: "그냥 그래요", message: "그냥 이유 없이 그래요." },
      { label: "몸이 피곤해요", message: "몸이 너무 피곤해요." },
      { label: "걱정돼요", message: "걱정이 많아졌어요." },
      { label: "말할래요", message: "조금 더 말하고 싶어요." },
    ];
  }

  if (input.scenario === "baby_info") {
    return [
      { label: "엄마 변화도 볼래요", message: "엄마 변화도 알려주세요." },
      { label: "오늘은 여기까지", message: "오늘은 여기까지 할게요." },
    ];
  }

  if (input.scenario === "mother_info") {
    return [
      { label: "오늘 할 일 볼래요", message: "오늘 실천할 일을 볼래요." },
      { label: "오늘 질문 볼래요", message: "오늘의 질문을 볼래요." },
      { label: "이따가 할래요", message: "이따가 확인할래요." },
    ];
  }

  if (input.scenario === "checklist") {
    return [
      { label: "다 했어요", message: "다 했어요." },
      { label: "하나만 했어요", message: "하나만 했어요." },
      { label: "이따가 할래요", message: "이따가 할래요." },
    ];
  }

  if (input.scenario === "empathy_chat") {
    return [
      { label: "오늘은 여기까지", message: "오늘은 여기까지 할게요." },
      { label: "하나 더 말할래요", message: "하나 더 말하고 싶어요." },
    ];
  }

  return [];
}

export async function buildWorkflowAssistantMessage<
  TRun extends {
    outputs?: Record<string, unknown>;
    block_states?: unknown;
  },
>(input: {
  run: TRun;
  loadCharacterImages: () => Promise<Record<string, string | null>>;
  extractOutputs: (run: TRun) => Record<string, unknown> | undefined;
}): Promise<ChatMessage | null> {
  const payload = parseWorkflowAssistantPayload(
    input.extractOutputs(input.run),
  );
  if (!payload?.answer?.trim()) {
    return null;
  }

  const parts: ChatMessage["parts"] = [];
  const quickReplies = resolveQuickReplies({
    answer: payload.answer,
    scenario: payload.scenario,
    quickReplies: payload.quickReplies,
  });

  // C간호사 캐릭터 이미지는 채팅 말풍선에 포함하지 않는다.

  if (
    payload.guardrailStatus &&
    payload.guardrailStatus !== "safe" &&
    payload.guardrailReason?.trim()
  ) {
    parts.push({
      type: "text",
      id: `guardrail-${Date.now()}`,
      text: `안전 안내: ${payload.guardrailReason.trim()}`,
    });
  }

  parts.push({
    type: "text",
    id: `workflow-answer-${Date.now()}`,
    text: sanitizeInlineCitationMarkers(
      stripQuestionChoicesFromAnswer({
        text: payload.answer.trim(),
        quickReplies,
        scenario: payload.scenario,
      }),
    ),
  });

  if (payload.deepLinks && payload.deepLinks.length > 0) {
    const deepLinkId = `workflow-link-${Date.now()}`;
    for (const [index, link] of payload.deepLinks.entries()) {
      parts.push({
        type: "deepLink",
        id: `${deepLinkId}-${index + 1}`,
        title: link.title,
        description: link.description,
        target: link.target,
        entityId: link.entityId,
      });
    }
  }

  if (quickReplies.length > 0) {
    const quickRepliesId = `workflow-quick-${Date.now()}`;
    parts.push({
      type: "quickReplies",
      id: quickRepliesId,
      choices: quickReplies.map((choice, index) => ({
        id: `${quickRepliesId}-choice-${index + 1}`,
        label: choice.label,
        message: choice.message,
      })),
    });
  }

  return {
    id: `assistant-${Date.now()}`,
    role: "assistant",
    createdAtLabel: "방금 전",
    characterTone: payload.characterTone ?? null,
    parts,
  };
}
