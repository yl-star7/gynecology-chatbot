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

function normalizeAssistantMessageParts(
  parts: unknown,
): ChatMessage["parts"] | null {
  if (!Array.isArray(parts) || parts.length === 0) {
    return null;
  }

  const normalized: ChatMessage["parts"] = [];

  for (const [index, part] of parts.entries()) {
    if (!part || typeof part !== "object") {
      continue;
    }

    const candidate = part as Record<string, unknown>;
    const id =
      typeof candidate.id === "string"
        ? candidate.id
        : `assistant-part-${index + 1}`;

    switch (candidate.type) {
      case "text": {
        if (typeof candidate.text !== "string") {
          continue;
        }

        normalized.push({
          type: "text",
          id,
          text: sanitizeInlineCitationMarkers(candidate.text),
        });
        continue;
      }
      case "carousel": {
        if (
          typeof candidate.title !== "string" ||
          !Array.isArray(candidate.cards)
        ) {
          continue;
        }

        const cards = candidate.cards.flatMap((card, cardIndex) => {
          if (!card || typeof card !== "object") {
            return [];
          }

          const cardRecord = card as Record<string, unknown>;
          if (
            typeof cardRecord.eyebrow !== "string" ||
            typeof cardRecord.title !== "string" ||
            typeof cardRecord.description !== "string"
          ) {
            return [];
          }

          return [
            {
              id:
                typeof cardRecord.id === "string"
                  ? cardRecord.id
                  : `${id}-card-${cardIndex + 1}`,
              eyebrow: cardRecord.eyebrow,
              title: cardRecord.title,
              description: cardRecord.description,
            },
          ];
        });

        normalized.push({
          type: "carousel",
          id,
          title: candidate.title,
          cards,
        });
        continue;
      }
      case "deepLink": {
        if (
          typeof candidate.title !== "string" ||
          typeof candidate.description !== "string" ||
          candidate.target !== "knowledge"
        ) {
          continue;
        }

        normalized.push({
          type: "deepLink",
          id,
          title: candidate.title,
          description: candidate.description,
          target: candidate.target,
          entityId:
            typeof candidate.entityId === "string"
              ? candidate.entityId
              : undefined,
        });
        continue;
      }
      case "quickReplies": {
        if (!Array.isArray(candidate.choices)) {
          continue;
        }

        const choices = candidate.choices.flatMap((choice, choiceIndex) => {
          if (!choice || typeof choice !== "object") {
            return [];
          }
          const choiceRecord = choice as Record<string, unknown>;
          const label =
            typeof choiceRecord.label === "string"
              ? choiceRecord.label.trim()
              : "";
          if (!label) {
            return [];
          }
          const rawMessage =
            typeof choiceRecord.message === "string"
              ? choiceRecord.message.trim()
              : "";
          return [
            {
              id:
                typeof choiceRecord.id === "string" && choiceRecord.id
                  ? choiceRecord.id
                  : `${id}-choice-${choiceIndex + 1}`,
              label,
              message: rawMessage || label,
            },
          ];
        });

        if (choices.length === 0) {
          continue;
        }

        normalized.push({
          type: "quickReplies",
          id,
          title:
            typeof candidate.title === "string" ? candidate.title : undefined,
          choices,
        });
        continue;
      }
      default:
        continue;
    }
  }

  return normalized.length > 0 ? normalized : null;
}

function normalizeAssistantMessage(input: unknown): ChatMessage | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const candidate = input as Record<string, unknown>;
  const parts = normalizeAssistantMessageParts(candidate.parts);
  if (!parts) {
    return null;
  }

  return {
    id:
      typeof candidate.id === "string"
        ? candidate.id
        : `assistant-${Date.now()}`,
    role: "assistant",
    createdAtLabel:
      typeof candidate.createdAtLabel === "string"
        ? candidate.createdAtLabel
        : "방금 전",
    parts,
  };
}

function parseAssistantResponse(input: unknown): ChatMessage | null {
  const direct = normalizeAssistantMessage(input);
  if (direct) {
    return direct;
  }

  if (!input || typeof input !== "object") {
    return null;
  }

  const candidate = input as Record<string, unknown>;

  if (candidate.experimental_output) {
    const structured = normalizeAssistantMessage(candidate.experimental_output);
    if (structured) {
      return structured;
    }
  }

  if (typeof candidate.text === "string") {
    try {
      const parsed = JSON.parse(candidate.text);
      return normalizeAssistantMessage(parsed);
    } catch {
      return null;
    }
  }

  return null;
}

export function buildFallbackReply(input: {
  currentWeek: number | null;
}): ChatMessage {
  const weekLabel = input.currentWeek
    ? `${input.currentWeek}주차 기준`
    : "현재 주차 기준";

  return {
    id: `assistant-${Date.now()}`,
    role: "assistant",
    createdAtLabel: "방금 전",
    parts: [
      {
        type: "text",
        id: `fallback-text-${Date.now()}`,
        text: `${weekLabel} 증상이 언제부터 있었는지, 얼마나 자주 느껴지는지, 쉬면 달라지는지를 함께 적어주시면 더 정확히 도와드릴 수 있어요. 출혈이나 물처럼 흐르는 분비물, 참기 어려운 통증이 있으면 바로 진료를 받아야 해요.`,
      },
    ],
  };
}

export async function parseAssistantResponseWithRetry(input: {
  generate: () => Promise<unknown>;
  currentWeek: number | null;
  maxAttempts?: number;
}): Promise<ChatMessage> {
  const maxAttempts = input.maxAttempts ?? 2;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const result = await input.generate();
    const parsed = parseAssistantResponse(result);
    if (parsed) {
      return parsed;
    }
  }

  return buildFallbackReply({ currentWeek: input.currentWeek });
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
    text: sanitizeInlineCitationMarkers(payload.answer.trim()),
  });

  return {
    id: `assistant-${Date.now()}`,
    role: "assistant",
    createdAtLabel: "방금 전",
    parts,
  };
}
