import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { ChatMessage } from "@gynecology-chatbot/app-core";
import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { formatRagContext, retrievePregnancyContext } from "@/lib/mobile/rag";
import { getSchiftClient } from "@/lib/mobile/schift-client";
import {
  isMobileSessionError,
  requireMobileSession,
} from "@/lib/mobile/session-auth";
import {
  supabaseInsert,
  supabaseSelect,
  supabaseUpdate,
} from "@/lib/mobile/supabase-rest";
import { checkRateLimit } from "@/lib/mobile/rate-limit";
import { recordUserAction } from "@/lib/mobile/user-action-log";

const google = createGoogleGenerativeAI({
  apiKey:
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

function normalizeSessionId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
    ? value
    : crypto.randomUUID();
}

type PregnancyProfilePromptRow = {
  pregnancy_week: number | null;
  pregnancy_day_in_week: number | null;
  tone_preference: string | null;
  baby_nickname: string | null;
  display_name: string | null;
  due_date: string | null;
};

type WeekDataRow = {
  id: string;
  week_number: number;
  title: string | null;
  baby_summary: string | null;
  mother_summary: string | null;
  warning_signs: string | null;
  recommended_actions: string | null;
  checklist_intro: string | null;
  question_intro: string | null;
  status: "draft" | "published" | "archived";
};

type DayContentRow = {
  id: string;
  day_number: number;
  title: string | null;
  baby_development_payload: { items?: string[] } | null;
  baby_message: string | null;
  mother_changes_payload: { items?: string[] } | null;
};

type ChecklistRow = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  checklist_payload: {
    items?: Array<{ id?: string; label?: string }>;
    rawText?: string;
  } | null;
  display_order: number;
  is_required: boolean;
};

type QuestionRow = {
  id: string;
  code: string;
  question_text: string;
  question_type: "text" | "single_choice" | "multi_choice" | "yes_no" | "number";
  help_text: string | null;
  question_payload: {
    choices?: Array<{ id?: string; label?: string }>;
    yesLabel?: string;
    noLabel?: string;
    rawText?: string;
  } | null;
  display_order: number;
  is_required: boolean;
};

type UserChecklistEventRow = {
  id: string;
  checklist_id: string;
  status: "sent" | "opened" | "completed" | "skipped";
};

type UserQuestionEventRow = {
  id: string;
  question_id: string;
  status: "sent" | "opened" | "answered" | "skipped";
};

function resolveSurveyChoicesFromChecklist(checklist: ChecklistRow) {
  const choices =
    checklist.checklist_payload?.items?.map((item, index) => ({
      id: item.id ?? `${checklist.code}-choice-${index + 1}`,
      label: item.label ?? `항목 ${index + 1}`,
    })) ?? [];

  return choices.length > 0
    ? choices
    : [
        { id: `${checklist.code}-yes`, label: "예" },
        { id: `${checklist.code}-no`, label: "아니오" },
      ];
}

function resolveSurveyChoicesFromQuestion(question: QuestionRow) {
  if (question.question_type === "yes_no") {
    return [
      {
        id: `${question.code}-yes`,
        label: question.question_payload?.yesLabel ?? "예",
      },
      {
        id: `${question.code}-no`,
        label: question.question_payload?.noLabel ?? "아니오",
      },
    ];
  }

  if (
    question.question_type === "single_choice" ||
    question.question_type === "multi_choice"
  ) {
    const choices =
      question.question_payload?.choices?.map((choice, index) => ({
        id: choice.id ?? `${question.code}-choice-${index + 1}`,
        label: choice.label ?? `선택지 ${index + 1}`,
      })) ?? [];

    if (choices.length > 0) {
      return choices;
    }
  }

  return [];
}

function buildWeekPromptParts(input: {
  week: WeekDataRow;
  dayContent: DayContentRow | null;
  checklists: ChecklistRow[];
  questions: QuestionRow[];
}): ChatMessage["parts"] {
  const parts: ChatMessage["parts"] = [];

  if (input.dayContent) {
    const carouselCards = [
      ...(input.dayContent.baby_development_payload?.items ?? []).map(
        (item, index) => ({
          id: `baby-${input.week.week_number}-${input.dayContent?.day_number}-${index + 1}`,
          eyebrow: "오늘 아기는요",
          title: input.dayContent?.title ?? `Day ${input.dayContent?.day_number}`,
          description: item,
        }),
      ),
      ...(input.dayContent.mother_changes_payload?.items ?? []).map(
        (item, index) => ({
          id: `mother-${input.week.week_number}-${input.dayContent?.day_number}-${index + 1}`,
          eyebrow: "오늘 엄마는요",
          title: input.dayContent?.title ?? `Day ${input.dayContent?.day_number}`,
          description: item,
        }),
      ),
    ];

    if (carouselCards.length > 0) {
      parts.push({
        type: "carousel",
        id: `week-day-carousel-${input.week.week_number}-${input.dayContent.day_number}`,
        title: `${input.week.week_number}주차 Day ${input.dayContent.day_number}`,
        cards: carouselCards,
      });
    }

    if (input.dayContent.baby_message) {
      parts.push({
        type: "text",
        id: `baby-message-${input.week.week_number}-${input.dayContent.day_number}`,
        text: input.dayContent.baby_message,
      });
    }
  }

  for (const checklist of input.checklists) {
    parts.push({
      type: "survey",
      id: `checklist-${checklist.id}`,
      title: checklist.title,
      body:
        checklist.description ??
        input.week.checklist_intro ??
        "오늘 함께 해 볼 체크리스트입니다.",
      choices: resolveSurveyChoicesFromChecklist(checklist),
    });
  }

  for (const question of input.questions) {
    const choices = resolveSurveyChoicesFromQuestion(question);
    if (choices.length > 0) {
      parts.push({
        type: "survey",
        id: `question-${question.id}`,
        title: question.question_text,
        body:
          question.help_text ??
          input.week.question_intro ??
          "아기와 나누는 마음 질문입니다.",
        choices,
      });
      continue;
    }

    parts.push({
      type: "text",
      id: `question-${question.id}`,
      text: `${question.question_text}${question.help_text ? `\n${question.help_text}` : ""}`,
    });
  }

  return parts;
}

async function getPromptContext(userId: string, hintedPregnancyWeek: number | null) {
  const profiles = await supabaseSelect<PregnancyProfilePromptRow[]>(
    `pregnancy_profiles?select=pregnancy_week,pregnancy_day_in_week,tone_preference,baby_nickname,display_name,due_date&user_id=eq.${userId}&limit=1`,
  );

  const pregnancyWeek = hintedPregnancyWeek ?? profiles[0]?.pregnancy_week ?? null;
  if (!pregnancyWeek) {
    return null;
  }

  const dayNumber = ((profiles[0]?.pregnancy_day_in_week ?? 0) % 7) + 1;

  const weekRows = await supabaseSelect<WeekDataRow[]>(
    `v_pregnancy_week_data?select=id,week_number,title,baby_summary,mother_summary,warning_signs,recommended_actions,checklist_intro,question_intro,status&week_number=eq.${pregnancyWeek}&status=eq.published&limit=1`,
  );
  const week = weekRows[0];
  if (!week) {
    return null;
  }

  const dayContentRows = await supabaseSelect<DayContentRow[]>(
    `v_pregnancy_day_contents?select=id,day_number,title,baby_development_payload,baby_message,mother_changes_payload&week_data_id=eq.${week.id}&day_number=eq.${dayNumber}&limit=1`,
  );
  const dayContent = dayContentRows[0] ?? null;

  const checklists = await supabaseSelect<ChecklistRow[]>(
    `v_week_checklists?select=id,code,title,description,checklist_payload,display_order,is_required&week_data_id=eq.${week.id}&day_number=eq.${dayNumber}&is_active=eq.true&order=display_order.asc`,
  );
  const questions = await supabaseSelect<QuestionRow[]>(
    `v_week_questions?select=id,code,question_text,question_type,help_text,question_payload,display_order,is_required&week_data_id=eq.${week.id}&day_number=eq.${dayNumber}&is_active=eq.true&order=display_order.asc`,
  );

  const profile = profiles[0];
  const missingFields: string[] = [];
  if (!profile?.baby_nickname) missingFields.push("태명");
  if (!profile?.due_date) missingFields.push("출산 예정일");
  if (!profile?.display_name || profile.display_name === "사용자") missingFields.push("이름");

  return {
    pregnancyWeek,
    dayNumber,
    week,
    dayContent,
    checklists,
    questions,
    tonePreference: profile?.tone_preference ?? null,
    missingFields,
  };
}

async function markOutstandingPromptEventsAnswered(input: {
  userId: string;
  sessionId: string;
  userMessageId: string | null;
}) {
  const checklistEvents = await supabaseSelect<UserChecklistEventRow[]>(
    `user_checklist_events?select=id,checklist_id,status&user_id=eq.${input.userId}&session_id=eq.${input.sessionId}&status=eq.sent`,
  );
  const questionEvents = await supabaseSelect<UserQuestionEventRow[]>(
    `user_question_events?select=id,question_id,status&user_id=eq.${input.userId}&session_id=eq.${input.sessionId}&status=eq.sent`,
  );

  const now = new Date().toISOString();

  for (const event of checklistEvents) {
    await supabaseUpdate(`user_checklist_events?id=eq.${event.id}`, {
      status: "completed",
      completion_message_id: input.userMessageId,
      completed_at: now,
      updated_at: now,
    });
  }

  for (const event of questionEvents) {
    await supabaseUpdate(`user_question_events?id=eq.${event.id}`, {
      status: "answered",
      answer_message_id: input.userMessageId,
      answered_at: now,
      updated_at: now,
    });
  }
}

async function createPromptEvents(input: {
  userId: string;
  sessionId: string;
  assistantMessageId: string | null;
  checklists: ChecklistRow[];
  questions: QuestionRow[];
}) {
  const now = new Date().toISOString();

  for (const checklist of input.checklists) {
    await supabaseInsert("user_checklist_events", {
      user_id: input.userId,
      checklist_id: checklist.id,
      session_id: input.sessionId,
      prompt_message_id: input.assistantMessageId,
      status: "sent",
      sent_at: now,
      updated_at: now,
    });
  }

  for (const question of input.questions) {
    await supabaseInsert("user_question_events", {
      user_id: input.userId,
      question_id: question.id,
      session_id: input.sessionId,
      prompt_message_id: input.assistantMessageId,
      status: "sent",
      sent_at: now,
      updated_at: now,
    });
  }
}

async function alreadyPromptedForSession(input: {
  userId: string;
  sessionId: string;
  checklistIds: string[];
  questionIds: string[];
}) {
  if (input.checklistIds.length === 0 && input.questionIds.length === 0) {
    return true;
  }

  const checklistEvents = input.checklistIds.length
    ? await supabaseSelect<UserChecklistEventRow[]>(
        `user_checklist_events?select=id,checklist_id,status&user_id=eq.${input.userId}&session_id=eq.${input.sessionId}`,
      )
    : [];
  const questionEvents = input.questionIds.length
    ? await supabaseSelect<UserQuestionEventRow[]>(
        `user_question_events?select=id,question_id,status&user_id=eq.${input.userId}&session_id=eq.${input.sessionId}`,
      )
    : [];

  const checklistSet = new Set(checklistEvents.map((event) => event.checklist_id));
  const questionSet = new Set(questionEvents.map((event) => event.question_id));

  return (
    input.checklistIds.every((id) => checklistSet.has(id)) &&
    input.questionIds.every((id) => questionSet.has(id))
  );
}

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
          guidance || "질문이 접수됐어요. 잠시 후 다시 시도해주세요.",
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const hintedUserId = typeof body.userId === "string" ? body.userId : "";
    const text = typeof body.text === "string" ? body.text : "";
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    const pregnancyWeek =
      typeof body.pregnancyWeek === "number" ? body.pregnancyWeek : null;
    const imageDataUris = Array.isArray(body.imageDataUris)
      ? body.imageDataUris
      : [];

    if (!sessionId || (!text && imageDataUris.length === 0)) {
      return NextResponse.json(
        { error: "sessionId and text or imageDataUris are required" },
        { status: 400 },
      );
    }
    const { userId } = await requireMobileSession(request, hintedUserId);

    const rateCheck = checkRateLimit(`chat:${userId}`, 20, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "너무 많은 요청이에요. 잠시 후 다시 시도해주세요." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)),
            "X-RateLimit-Remaining": "0",
          },
        },
      );
    }

    const normalizedSessionId = normalizeSessionId(sessionId);

    const existingSessions = await supabaseSelect<
      Array<{ id: string; title: string }>
    >(
      `chat_sessions?select=id,title&id=eq.${normalizedSessionId}&user_id=eq.${userId}&limit=1`,
    );

    if (!existingSessions[0]) {
      await supabaseInsert("chat_sessions", {
        id: normalizedSessionId,
        user_id: userId,
        title: text.slice(0, 40) || "새 상담",
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
        session_id: normalizedSessionId,
        user_id: userId,
        role: "user",
        parts: userMessageParts,
        plain_text: text,
        image_attachments: imageDataUris.map((uri: string) => ({ uri })),
      },
    );
    const insertedUserMessage = insertedUserMessages[0] ?? null;
    const lastMessageAt = new Date().toISOString();

    await supabaseUpdate(`chat_sessions?id=eq.${normalizedSessionId}`, {
      last_message_at: lastMessageAt,
      updated_at: lastMessageAt,
    });

    await recordUserAction({
      userId,
      actionType: "chat_message_sent",
      sessionId: normalizedSessionId,
      messageId: insertedUserMessage?.id ?? null,
      payload: {
        pregnancyWeek,
        imageCount: imageDataUris.length,
        textPreview: text.slice(0, 120),
      },
    });

    await markOutstandingPromptEventsAnswered({
      userId,
      sessionId: normalizedSessionId,
      userMessageId: insertedUserMessage?.id ?? null,
    });

    const apiKey =
      process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const promptContext = await getPromptContext(userId, pregnancyWeek);
    const currentWeek = promptContext?.pregnancyWeek ?? pregnancyWeek;

    const ragTools = {
      searchPregnancyKnowledge: tool({
        description: "임신 관련 의료 지식을 검색합니다. 사용자가 증상, 주차별 변화, 검사, 영양 등에 대해 물어볼 때 호출하세요.",
        inputSchema: z.object({
          query: z.string().describe("검색할 질문 또는 키워드"),
        }),
        execute: async ({ query }) => {
          const docs = await retrievePregnancyContext({
            query,
            currentWeek,
            matchCount: 5,
          });
          return formatRagContext(docs);
        },
      }),
      searchSchiftBucket: tool({
        description: "Schift 벡터 DB에서 임신 관련 문서를 검색합니다. 더 넓은 범위의 문서가 필요할 때 호출하세요.",
        inputSchema: z.object({
          query: z.string().describe("검색 쿼리"),
          bucketId: z.string().optional().describe("검색할 버킷 ID (기본: pregnancy-knowledge)"),
        }),
        execute: async ({ query, bucketId }) => {
          const schift = getSchiftClient();
          if (!schift) return "Schift가 설정되지 않았습니다.";
          try {
            const result = await schift.chat({
              bucketId: bucketId ?? "pregnancy-knowledge",
              message: query,
              topK: 5,
            });
            const sourceSummary = result.sources.map((s, i) => `[${i + 1}] ${s.text.slice(0, 200)}`).join("\n");
            return `답변: ${result.reply}\n\n참고 문서:\n${sourceSummary}`;
          } catch (e) {
            return `검색 실패: ${e instanceof Error ? e.message : "알 수 없는 오류"}`;
          }
        },
      }),
    };

    const assistantMessage = !apiKey
      ? buildFallbackReply({
          text,
          hasImages: imageDataUris.length > 0,
          pregnancyWeek: currentWeek,
        })
      : await (async () => {
          const { text: responseText } = await generateText({
            model: google("gemini-2.5-flash-lite"),
            tools: ragTools,
            stopWhen: stepCountIs(3),
            system: [
              "당신은 임산부 채팅 앱의 어시스턴트입니다.",
              "항상 JSON 하나만 반환하세요.",
              "응답 스키마는 ChatMessage 타입과 유사하며 role은 assistant입니다.",
              "parts는 text, carousel, survey, deepLink 중 필요한 것만 사용하세요.",
              "deepLink target은 knowledge 또는 notebook만 사용하세요.",
              "의료 관련 질문에는 반드시 searchPregnancyKnowledge 또는 searchSchiftBucket 도구를 호출해서 근거 기반으로 답변하세요.",
              "일상 대화나 안부에는 도구를 호출하지 않아도 됩니다.",
              "추가로 현재 주차 체크리스트와 질문이 있으면 survey/text part로 포함하세요.",
              "대화는 세션 단위로 이어지므로 현재 세션 맥락을 유지하세요.",
              ...(promptContext?.tonePreference
                ? [`사용자가 선호하는 상담 분위기: ${promptContext.tonePreference}. 이 톤에 맞춰 응답하세요.`]
                : []),
              ...(promptContext?.missingFields && promptContext.missingFields.length > 0
                ? [`아직 비어있는 정보: ${promptContext.missingFields.join(", ")}. 대화 흐름에 자연스럽게 녹여서 한 번에 하나씩만 물어보세요. 억지로 물어보지 말고, 맥락이 맞을 때만 자연스럽게 여쭤보세요.`]
                : []),
              "임신 주차 정보가 주어지면 그 주차와 인접 주차 기준으로 설명한다고 가정하세요.",
              "의료 응답은 진단 확정 표현을 피하고 필요한 경우 진료 권고를 포함하세요.",
            ].join("\n"),
            prompt: [
              `세션 ID: ${normalizedSessionId || "(없음)"}`,
              `현재 임신 주차: ${currentWeek ?? "(정보 없음)"}`,
              `사용자 텍스트: ${text || "(텍스트 없음)"}`,
              `첨부 이미지 수: ${imageDataUris.length}`,
              'JSON 예시: {"id":"assistant-1","role":"assistant","createdAtLabel":"방금 전","parts":[{"type":"text","id":"p1","text":"..."}]}',
            ].join("\n"),
          });

          return parseAssistantResponse(responseText);
        })();

    const shouldAppendPromptParts = promptContext
      ? !(
          await alreadyPromptedForSession({
            userId,
            sessionId: normalizedSessionId,
            checklistIds: promptContext.checklists.map((item) => item.id),
            questionIds: promptContext.questions.map((item) => item.id),
          })
        )
      : false;

    if (promptContext && shouldAppendPromptParts) {
        assistantMessage.parts = [
          ...assistantMessage.parts,
          ...buildWeekPromptParts(promptContext),
      ];
    }

    const insertedAssistantMessages = await supabaseInsert<Array<{ id: string }>>(
      "chat_messages",
      {
        session_id: normalizedSessionId,
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
      },
    );
    const insertedAssistantMessage = insertedAssistantMessages[0] ?? null;

    if (promptContext && shouldAppendPromptParts) {
      await createPromptEvents({
        userId,
        sessionId: normalizedSessionId,
        assistantMessageId: insertedAssistantMessage?.id ?? null,
        checklists: promptContext.checklists,
        questions: promptContext.questions,
      });
    }

    const assistantMessageAt = new Date().toISOString();
    await supabaseUpdate(`chat_sessions?id=eq.${normalizedSessionId}`, {
      last_message_at: assistantMessageAt,
      updated_at: assistantMessageAt,
    });

    return NextResponse.json({
      assistantMessage,
      sessionId: normalizedSessionId,
    });
  } catch (error) {
    console.error("mobile chat route error", error);
    if (isMobileSessionError(error)) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 401 },
      );
    }
    return NextResponse.json(
      {
        assistantMessage: buildFallbackReply({
          text: "잠시 후 다시 시도해주세요.",
          hasImages: false,
        }),
      },
      { status: 200 },
    );
  }
}
