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
    characterTone:
      typeof candidate.characterTone === "string"
        ? (candidate.characterTone as ChatMessage["characterTone"])
        : null,
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

function inferFallbackCharacterTone(text: string): CharacterTone {
  const normalized = text.toLowerCase();
  if (/불안|걱정|무서|초조|긴장/.test(normalized)) return "anxious";
  if (/우울|슬프|눈물|속상/.test(normalized)) return "sad";
  if (/피곤|졸리|잠|지쳐|힘들/.test(normalized)) return "tired";
  if (/좋아|기뻐|행복|설레/.test(normalized)) return "joyful";
  return "calm";
}

function buildQuickReplies(
  idPrefix: string,
  choices: Array<{ label: string; message: string }>,
): ChatMessage["parts"][number] {
  return {
    type: "quickReplies",
    id: `${idPrefix}-quick`,
    choices: choices.map((choice, index) => ({
      id: `${idPrefix}-choice-${index + 1}`,
      label: choice.label,
      message: choice.message,
    })),
  };
}

export function buildLocalWorkflowFallbackReply(input: {
  currentWeek: number | null;
  text: string;
}): ChatMessage {
  const now = Date.now();
  const idPrefix = `local-workflow-${now}`;
  const tone = inferFallbackCharacterTone(input.text);
  const weekLabel = input.currentWeek
    ? `${input.currentWeek}주차`
    : "현재 주차";
  const text = input.text.trim();
  const parts: ChatMessage["parts"] = [];

  if (/체크|실천|할 일|해야/.test(text)) {
    parts.push({
      type: "text",
      id: `${idPrefix}-text`,
      text: [
        `${weekLabel} 기준으로 오늘은 아주 작게 해도 괜찮아요.`,
        "",
        "- 물을 천천히 한 컵 마셔요",
        "- 편한 자세로 5분 쉬어요",
        "- 몸이 보내는 신호를 한 가지 적어봐요",
        "",
        "해본 만큼만 알려주세요.",
      ].join("\n"),
    });
    parts.push(
      buildQuickReplies(idPrefix, [
        { label: "다 했어요", message: "다 했어요." },
        { label: "하나만 했어요", message: "하나만 했어요." },
        { label: "이따가 할래요", message: "이따가 할래요." },
      ]),
    );
  } else if (/아기|태아|발달|크기|성장/.test(text)) {
    parts.push({
      type: "text",
      id: `${idPrefix}-text`,
      text: `${weekLabel} 아기 소식이 궁금하셨군요.\n\n지금은 내부 workflow 응답을 안정화하는 중이라 자세한 자료를 길게 단정하진 않을게요. 대신 아기 변화와 엄마 몸 변화를 한 단계씩 나눠서 볼 수 있어요.`,
    });
    parts.push(
      buildQuickReplies(idPrefix, [
        { label: "아기 소식", message: "아기 소식을 볼래요." },
        { label: "엄마 변화", message: "엄마 몸 변화도 볼래요." },
        { label: "오늘 할 일", message: "오늘 실천할 일을 볼래요." },
      ]),
    );
  } else if (tone === "anxious" || tone === "sad" || tone === "tired") {
    parts.push({
      type: "text",
      id: `${idPrefix}-text`,
      text: [
        "그렇게 느낄 수 있어요. 말해줘서 고마워요.",
        "",
        "오늘은 마음을 급하게 바꾸려고 하지 않아도 괜찮아요. 부담스럽지 않게, 지금 마음이 어디에서 온 건지 조금만 같이 살펴볼게요.",
      ].join("\n"),
    });
    parts.push(
      buildQuickReplies(idPrefix, [
        { label: "이유 없어요", message: "그냥 이유 없이 그래요." },
        { label: "피곤해요", message: "몸이 너무 피곤해요." },
        { label: "걱정돼요", message: "걱정이 많아졌어요." },
        { label: "말할래요", message: "조금 더 말하고 싶어요." },
      ]),
    );
  } else {
    parts.push({
      type: "text",
      id: `${idPrefix}-text`,
      text: `${weekLabel} 기준으로 같이 천천히 볼게요.\n\n오늘 기분을 먼저 확인하고, 원하시면 아기 소식이나 엄마 몸 변화로 이어갈 수 있어요.`,
    });
    parts.push(
      buildQuickReplies(idPrefix, [
        { label: "좋아요", message: "오늘은 좋아요." },
        { label: "우울해요", message: "오늘은 우울해요." },
        { label: "슬퍼요", message: "오늘은 슬퍼요." },
        { label: "화나요", message: "오늘은 화나요." },
      ]),
    );
  }

  return {
    id: `assistant-${now}`,
    role: "assistant",
    createdAtLabel: "방금 전",
    characterTone: tone,
    parts,
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

  if (payload.quickReplies && payload.quickReplies.length > 0) {
    const quickRepliesId = `workflow-quick-${Date.now()}`;
    parts.push({
      type: "quickReplies",
      id: quickRepliesId,
      choices: payload.quickReplies.map((choice, index) => ({
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
