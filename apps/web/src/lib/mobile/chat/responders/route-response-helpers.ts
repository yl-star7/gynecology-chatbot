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
    input.lastCharacterTone ? `직전 캐릭터 톤: ${input.lastCharacterTone}` : null,
    input.lastEmotionTone ? `최근 감정 톤: ${input.lastEmotionTone}` : null,
    input.tonePreference ? `사용자 선호 상담 분위기: ${input.tonePreference}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildFallbackReply(input: {
  text: string;
  hasImages: boolean;
  pregnancyWeek?: number | null;
  ragSummary?: string;
}): ChatMessage {
  const guidance = [
    input.pregnancyWeek
      ? `현재 ${input.pregnancyWeek}주차 기준으로 우선 안내드릴게요.`
      : null,
    input.text ? `문의하신 내용은 "${input.text}"입니다.` : null,
    input.hasImages
      ? "첨부 이미지는 저장되었고, 필요 시 진료 시점에 함께 보여주실 수 있습니다."
      : null,
    input.ragSummary && input.ragSummary !== "검색된 임신 주차 문서 없음"
      ? input.ragSummary.split("\n").slice(0, 5).join(" ")
      : null,
    "증상이 심해지거나 출혈, 극심한 통증, 호흡곤란처럼 응급 신호가 있으면 바로 의료진 진료를 권합니다.",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    id: `assistant-${Date.now()}`,
    role: "assistant",
    createdAtLabel: "방금 전",
    parts: [
      {
        type: "text",
        id: `text-${Date.now()}`,
        text: guidance || "질문이 접수됐어요. 잠시 후 다시 시도해주세요.",
      },
      {
        type: "deepLink",
        id: `link-${Date.now()}`,
        title: "임신수첩 체크리스트",
        description: "임신수첩으로 이동해요.",
        target: "notebook",
        entityId: "visit-checklist",
      },
    ],
  };
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

export async function buildWorkflowAssistantMessage<TRun extends {
  outputs?: Record<string, unknown>;
  block_states?: unknown;
}>(input: {
  run: TRun;
  loadCharacterImages: () => Promise<Record<string, string | null>>;
  extractOutputs: (run: TRun) => Record<string, unknown> | undefined;
}): Promise<ChatMessage | null> {
  const payload = parseWorkflowAssistantPayload(input.extractOutputs(input.run));
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

function parseAssistantResponse(rawText: string): ChatMessage {
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON payload found");
  }

  const parsed = JSON.parse(jsonMatch[0]) as ChatMessage;
  const normalizedParts = Array.isArray(parsed.parts)
    ? parsed.parts.map((part, index) => {
        if (!part || typeof part !== "object" || !("type" in part)) {
          return {
            type: "text" as const,
            id: `part-fallback-${index}`,
            text: "응답을 정리하는 중 문제가 있었어요.",
          };
        }

        if (part.type === "carousel") {
          const cards = Array.isArray((part as { cards?: unknown[] }).cards)
            ? (
                part as {
                  cards: Array<{
                    id?: string;
                    eyebrow?: string;
                    title?: string;
                    description?: string;
                  }>;
                }
              ).cards
            : Array.isArray((part as unknown as { items?: unknown[] }).items)
              ? (
                  part as unknown as {
                    items: Array<{
                      id?: string;
                      eyebrow?: string;
                      title?: string;
                      description?: string;
                    }>;
                  }
                ).items
              : [];

          return {
            type: "carousel" as const,
            id: typeof part.id === "string" ? part.id : `carousel-${index}`,
            title:
              typeof (part as { title?: string }).title === "string"
                ? (part as { title?: string }).title!
                : "참고 항목",
            cards: cards.map((card, cardIndex) => ({
              id:
                typeof card.id === "string"
                  ? card.id
                  : `carousel-card-${index}-${cardIndex}`,
              eyebrow: typeof card.eyebrow === "string" ? card.eyebrow : "안내",
              title: typeof card.title === "string" ? card.title : "참고 정보",
              description:
                typeof card.description === "string" ? card.description : "",
            })),
          };
        }

        return part;
      })
    : [];

  return {
    ...parsed,
    id: parsed.id || `assistant-${Date.now()}`,
    role: "assistant",
    createdAtLabel: "방금 전",
    parts: normalizedParts,
  };
}

export async function parseAssistantResponseWithSingleRetry(input: {
  generate: () => Promise<string>;
  buildFallback: () => ChatMessage;
}) {
  const firstResponseText = await input.generate();

  try {
    return parseAssistantResponse(firstResponseText);
  } catch {
    const retryResponseText = await input.generate();

    try {
      return parseAssistantResponse(retryResponseText);
    } catch {
      return input.buildFallback();
    }
  }
}
