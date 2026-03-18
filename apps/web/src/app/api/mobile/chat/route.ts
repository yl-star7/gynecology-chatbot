import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { ChatMessage } from "@gynecology-chatbot/app-core";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { formatRagContext, retrievePregnancyContext } from "@/lib/mobile/rag";
import { supabaseInsert, supabaseSelect } from "@/lib/mobile/supabase-rest";
import { recordUserAction } from "@/lib/mobile/user-action-log";

const google = createGoogleGenerativeAI({
  apiKey:
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

function buildFallbackReply(input: {
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
        text:
          guidance || "질문은 정상 접수되었습니다. 잠시 후 다시 시도해 주세요.",
      },
      {
        type: "deepLink",
        id: `link-${Date.now()}`,
        title: "임신수첩 체크리스트",
        description: "앱 내부 화면으로 이동합니다.",
        target: "notebook",
        entityId: "visit-checklist",
      },
    ],
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
            text: "응답 형식을 정리하는 중 문제가 있어 텍스트로 변환했습니다.",
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = typeof body.userId === "string" ? body.userId : "";
    const text = typeof body.text === "string" ? body.text : "";
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    const pregnancyWeek =
      typeof body.pregnancyWeek === "number" ? body.pregnancyWeek : null;
    const imageDataUris = Array.isArray(body.imageDataUris)
      ? body.imageDataUris
      : [];

    if (!userId || !sessionId || (!text && imageDataUris.length === 0)) {
      return NextResponse.json(
        { error: "userId, sessionId, and text or imageDataUris are required" },
        { status: 400 },
      );
    }

    const existingSessions = await supabaseSelect<
      Array<{ id: string; title: string }>
    >(
      `chat_sessions?select=id,title&id=eq.${sessionId}&user_id=eq.${userId}&limit=1`,
    );

    if (!existingSessions[0]) {
      await supabaseInsert("chat_sessions", {
        id: sessionId,
        user_id: userId,
        title: text.slice(0, 40) || "새 대화",
        status: "active",
      });
    }

    const userMessageParts: ChatMessage["parts"] = [
      ...(text
        ? [
            {
              type: "text" as const,
              id: `user-text-${Date.now()}`,
              text,
            },
          ]
        : []),
      ...imageDataUris.map((uri: string, index: number) => ({
        type: "image" as const,
        id: `user-image-${Date.now()}-${index}`,
        imageUrl: uri,
        alt: "사용자 첨부 이미지",
        caption: "사용자 첨부 이미지",
      })),
    ];

    const insertedUserMessages = await supabaseInsert<Array<{ id: string }>>(
      "chat_messages",
      {
        session_id: sessionId,
        user_id: userId,
        role: "user",
        parts: userMessageParts,
        plain_text: text,
        image_attachments: imageDataUris.map((uri: string) => ({ uri })),
      },
    );
    const insertedUserMessage = insertedUserMessages[0] ?? null;

    await recordUserAction({
      userId,
      actionType: "chat_message_sent",
      sessionId,
      messageId: insertedUserMessage?.id ?? null,
      payload: {
        pregnancyWeek,
        imageCount: imageDataUris.length,
        textPreview: text.slice(0, 120),
      },
    });

    const apiKey =
      process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const ragDocuments = await retrievePregnancyContext({
      currentWeek: pregnancyWeek,
      query: text,
    });
    const assistantMessage = !apiKey
      ? buildFallbackReply({
          text,
          hasImages: imageDataUris.length > 0,
          pregnancyWeek,
          ragSummary: formatRagContext(ragDocuments),
        })
      : await (async () => {
          const { text: responseText } = await generateText({
            model: google("gemini-2.5-flash-lite"),
            system: [
              "당신은 임산부 상담 앱의 어시스턴트입니다.",
              "항상 JSON 하나만 반환하세요.",
              "응답 스키마는 ChatMessage 타입과 유사하며 role은 assistant입니다.",
              "parts는 text, carousel, survey, deepLink 중 필요한 것만 사용하세요.",
              "deepLink target은 knowledge 또는 notebook만 사용하세요.",
              "대화는 세션 단위로 이어지므로 현재 세션 맥락을 유지하세요.",
              "임신 주차 정보가 주어지면 그 주차와 인접 주차 기준으로 설명한다고 가정하세요.",
              "RAG 문맥이 주어지면 그 범위 안에서만 참고 정보를 요약하세요.",
              "의료 응답은 진단 확정 표현을 피하고 필요한 경우 진료 권고를 포함하세요.",
            ].join("\n"),
            prompt: [
              `세션 ID: ${sessionId || "(없음)"}`,
              `현재 임신 주차: ${pregnancyWeek ?? "(정보 없음)"}`,
              `사용자 텍스트: ${text || "(텍스트 없음)"}`,
              `첨부 이미지 수: ${imageDataUris.length}`,
              `RAG 문맥:\n${formatRagContext(ragDocuments)}`,
              'JSON 예시: {"id":"assistant-1","role":"assistant","createdAtLabel":"방금 전","parts":[{"type":"text","id":"p1","text":"..."}]}',
            ].join("\n"),
          });

          return parseAssistantResponse(responseText);
        })();

    await supabaseInsert("chat_messages", {
      session_id: sessionId,
      user_id: userId,
      role: "assistant",
      parts: assistantMessage.parts,
      plain_text: assistantMessage.parts
        .filter(
          (part): part is Extract<typeof part, { type: "text" }> =>
            part.type === "text",
        )
        .map((part) => part.text)
        .join("\n"),
      model_name: apiKey ? "gemini-2.5-flash-lite" : "fallback",
    });

    return NextResponse.json({
      assistantMessage,
    });
  } catch (error) {
    console.error("mobile chat route error", error);
    return NextResponse.json(
      {
        assistantMessage: buildFallbackReply({
          text: "잠시 후 다시 시도해 주세요.",
          hasImages: false,
        }),
      },
      { status: 200 },
    );
  }
}
