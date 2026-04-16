import type { ChatMessage } from "@gynecology-chatbot/app-core";

import {
  type CharacterTone,
  parseWorkflowAssistantPayload,
  type ProfileMemoryPayload,
  type SessionMemoryPayload,
  type WorkflowScenario,
} from "@/lib/mobile/chat/workflow-payload";
import { sanitizeInlineCitationMarkers } from "@/lib/mobile/chat/sanitizers";

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
  tonePreference: string | null;
}) {
  return [
    input.compactSummary ? `최근 세션 요약: ${input.compactSummary}` : null,
    input.lastScenario ? `직전 상담 분기: ${input.lastScenario}` : null,
    input.lastCharacterTone
      ? `직전 캐릭터 톤: ${input.lastCharacterTone}`
      : null,
    input.lastEmotionTone ? `최근 감정 톤: ${input.lastEmotionTone}` : null,
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

  if (payload.characterTone) {
    const characterImages = await input.loadCharacterImages();
    const customUrl = characterImages[payload.characterTone] ?? null;
    const { imageUrl, useIllustration } = createCharacterImageUrl(
      payload.characterTone,
      customUrl,
    );
    const toneLabel = CHARACTER_TONE_CONFIG[payload.characterTone].label;

    parts.push({
      type: "image",
      id: `character-${Date.now()}`,
      imageUrl,
      alt: toneLabel,
      caption: useIllustration
        ? "C간호사 캐릭터"
        : "워크플로우가 선택한 캐릭터 표정",
    });
  }

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
    text: sanitizeInlineCitationMarkers(payload.answer.trim()),
  });

  return {
    id: `assistant-${Date.now()}`,
    role: "assistant",
    createdAtLabel: "방금 전",
    parts,
  };
}
