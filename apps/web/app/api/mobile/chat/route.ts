import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { ChatMessage } from "@gynecology-chatbot/app-core";
import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { formatRagContext, retrievePregnancyContext } from "@/lib/mobile/rag";
import { getSchiftClient } from "@/lib/mobile/schift-client";
import {
  formatSchiftWorkflowRun,
  runSchiftWorkflow,
} from "@/lib/mobile/schift-workflow";
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
  baby_nickname: string | null;
  display_name: string | null;
  due_date: string | null;
  onboarding_payload: {
    tonePreference?: string | null;
  } | null;
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
  question_type:
    | "text"
    | "single_choice"
    | "multi_choice"
    | "yes_no"
    | "number";
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

type CharacterTone = "calm" | "joyful" | "anxious" | "tired" | "sad";

type WorkflowAssistantPayload = {
  answer?: string;
  characterTone?: CharacterTone;
  guardrailStatus?: "safe" | "medical_caution" | "redirect";
  guardrailReason?: string;
};

function buildWeekPromptParts(input: {
  week: WeekDataRow;
  dayContent: DayContentRow | null;
  checklists: ChecklistRow[];
  questions: QuestionRow[];
}): ChatMessage["parts"] {
  const parts: ChatMessage["parts"] = [];

  if (input.dayContent) {
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
      type: "text",
      id: `checklist-${checklist.id}`,
      text: `${input.week.checklist_intro ?? "오늘 할 일"}\n- ${checklist.title}${
        checklist.description ? `\n${checklist.description}` : ""
      }`,
    });
  }

  for (const question of input.questions) {
    parts.push({
      type: "text",
      id: `question-${question.id}`,
      text: `${input.week.question_intro ?? "생각해볼 질문"}\n${question.question_text}${
        question.help_text ? `\n${question.help_text}` : ""
      }`,
    });
  }

  return parts;
}

async function getPromptContext(
  userId: string,
  hintedPregnancyWeek: number | null,
) {
  const profiles = await supabaseSelect<PregnancyProfilePromptRow[]>(
    `pregnancy_profiles?select=pregnancy_week,pregnancy_day_in_week,baby_nickname,display_name,due_date,onboarding_payload&user_id=eq.${userId}&limit=1`,
  );

  const pregnancyWeek =
    hintedPregnancyWeek ?? profiles[0]?.pregnancy_week ?? null;
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
  if (!profile?.display_name || profile.display_name === "사용자")
    missingFields.push("이름");

  return {
    pregnancyWeek,
    dayNumber,
    week,
    dayContent,
    checklists,
    questions,
    tonePreference: profile?.onboarding_payload?.tonePreference ?? null,
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

  const checklistSet = new Set(
    checklistEvents.map((event) => event.checklist_id),
  );
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

function createCharacterImageUrl(tone: CharacterTone) {
  const config = {
    calm: {
      label: "차분한 안내",
      background: "#edf4fb",
      emoji: "😌",
    },
    joyful: {
      label: "밝은 안내",
      background: "#eef8e8",
      emoji: "😊",
    },
    anxious: {
      label: "걱정 어린 안내",
      background: "#fff2df",
      emoji: "😟",
    },
    tired: {
      label: "쉬임이 필요한 안내",
      background: "#f4ede6",
      emoji: "😴",
    },
    sad: {
      label: "위로하는 안내",
      background: "#f2edf7",
      emoji: "😢",
    },
  } satisfies Record<CharacterTone, {
    label: string;
    background: string;
    emoji: string;
  }>;

  const selected = config[tone];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-label="${selected.label}">
      <rect width="128" height="128" rx="36" fill="${selected.background}" />
      <text x="64" y="72" text-anchor="middle" font-size="46">${selected.emoji}</text>
      <rect x="38" y="92" width="52" height="18" rx="9" fill="#ffffff" opacity="0.86" />
      <text x="64" y="104" text-anchor="middle" font-family="Noto Sans KR, sans-serif" font-size="10" fill="#5a4c45">${selected.label}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function parseWorkflowAssistantPayload(
  outputs: Record<string, unknown> | undefined,
): WorkflowAssistantPayload | null {
  if (!outputs) {
    return null;
  }

  const directAnswer =
    typeof outputs.answer === "string"
      ? outputs.answer
      : typeof outputs.reply === "string"
        ? outputs.reply
        : typeof outputs.result === "string"
          ? outputs.result
          : null;

  const directPayload = {
    answer:
      typeof outputs.answer === "string"
        ? outputs.answer
        : typeof outputs.reply === "string"
          ? outputs.reply
          : typeof outputs.result === "string"
            ? outputs.result
            : undefined,
    characterTone:
      typeof outputs.characterTone === "string"
        ? (outputs.characterTone as CharacterTone)
        : undefined,
    guardrailStatus:
      typeof outputs.guardrailStatus === "string"
        ? (outputs.guardrailStatus as WorkflowAssistantPayload["guardrailStatus"])
        : undefined,
    guardrailReason:
      typeof outputs.guardrailReason === "string"
        ? outputs.guardrailReason
        : undefined,
  };

  if (
    directPayload.characterTone ||
    directPayload.guardrailStatus ||
    directPayload.guardrailReason
  ) {
    return directPayload;
  }

  if (!directAnswer) {
    return null;
  }

  try {
    const parsed = JSON.parse(directAnswer) as WorkflowAssistantPayload;
    if (
      (typeof parsed.answer === "string" && parsed.answer.trim()) ||
      typeof parsed.characterTone === "string" ||
      typeof parsed.guardrailStatus === "string"
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

function buildAssistantMessageFromWorkflowRun(run: {
  outputs?: Record<string, unknown>;
}) {
  const payload = parseWorkflowAssistantPayload(run.outputs);
  if (!payload?.answer?.trim()) {
    return null;
  }

  const parts: ChatMessage["parts"] = [];

  if (payload.characterTone) {
    parts.push({
      type: "image",
      id: `character-${Date.now()}`,
      imageUrl: createCharacterImageUrl(payload.characterTone),
      alt: `${payload.characterTone} 캐릭터 표현`,
      caption: "워크플로우가 선택한 캐릭터 표정",
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
    text: payload.answer.trim(),
  });

  return {
    id: `assistant-${Date.now()}`,
    role: "assistant" as const,
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
            "Retry-After": String(
              Math.ceil((rateCheck.resetAt - Date.now()) / 1000),
            ),
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

    const schift = getSchiftClient();

    let assistantMessage: ChatMessage;

    if (schift) {
      try {
        const { run } = await runSchiftWorkflow({
          schift,
          inputs: {
            query: text,
            currentWeek,
            sessionId: normalizedSessionId,
            hasImages: imageDataUris.length > 0,
          },
        });

        const structuredWorkflowMessage = buildAssistantMessageFromWorkflowRun(run);
        const workflowText = formatSchiftWorkflowRun(run);
        const isEmptyWorkflowOutput =
          !run.outputs ||
          Object.keys(run.outputs).length === 0 ||
          workflowText === "답변: {}" ||
          workflowText === "답변: workflow 출력이 없어요.";

        if (isEmptyWorkflowOutput) {
          throw new Error("Schift workflow returned empty output");
        }

        assistantMessage =
          structuredWorkflowMessage ??
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            createdAtLabel: "방금 전",
            parts: [
              {
                type: "text",
                id: `workflow-text-${Date.now()}`,
                text: workflowText,
              },
            ],
          };
      } catch (workflowError) {
        console.error("mobile chat workflow execution failed", workflowError);

        if (!apiKey) {
          assistantMessage = buildFallbackReply({
            text,
            hasImages: imageDataUris.length > 0,
            pregnancyWeek: currentWeek,
          });
        } else {
          const ragTools = {
            searchPregnancyKnowledge: tool({
              description:
                "임신 관련 의료 지식을 검색합니다. 사용자가 증상, 주차별 변화, 검사, 영양 등에 대해 물어볼 때 호출하세요.",
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
          };

          const { text: responseText } = await generateText({
            model: google("gemini-2.5-flash-lite"),
            tools: ragTools,
            stopWhen: stepCountIs(2),
            system: [
              "당신은 임산부 채팅 앱의 어시스턴트입니다.",
              "항상 JSON 하나만 반환하세요.",
              "응답 스키마는 ChatMessage 타입과 유사하며 role은 assistant입니다.",
              "parts는 text, image, carousel, deepLink 중 필요한 것만 사용하세요.",
              "survey 파트는 사용하지 마세요.",
              "carousel은 명시적으로 보여줄 콘텐츠 카드가 있을 때만 사용하세요. 단순 텍스트 요약을 카드로 바꾸지 마세요.",
              "deepLink target은 knowledge 또는 notebook만 사용하세요.",
              "워크플로우 실행이 실패한 경우에만 searchPregnancyKnowledge 도구를 사용하세요.",
              "대화는 세션 단위로 이어지므로 현재 세션 맥락을 유지하세요.",
              ...(promptContext?.tonePreference
                ? [
                    `사용자가 선호하는 상담 분위기: ${promptContext.tonePreference}. 이 톤에 맞춰 응답하세요.`,
                  ]
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

          assistantMessage = parseAssistantResponse(responseText);
        }
      }
    } else if (!apiKey) {
      assistantMessage = buildFallbackReply({
        text,
        hasImages: imageDataUris.length > 0,
        pregnancyWeek: currentWeek,
      });
    } else {
      const ragTools = {
        searchPregnancyKnowledge: tool({
          description:
            "임신 관련 의료 지식을 검색합니다. 사용자가 증상, 주차별 변화, 검사, 영양 등에 대해 물어볼 때 호출하세요.",
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
      };

      const { text: responseText } = await generateText({
        model: google("gemini-2.5-flash-lite"),
        tools: ragTools,
        stopWhen: stepCountIs(2),
        system: [
          "당신은 임산부 채팅 앱의 어시스턴트입니다.",
          "항상 JSON 하나만 반환하세요.",
          "응답 스키마는 ChatMessage 타입과 유사하며 role은 assistant입니다.",
          "parts는 text, image, carousel, deepLink 중 필요한 것만 사용하세요.",
          "survey 파트는 사용하지 마세요.",
          "carousel은 명시적으로 보여줄 콘텐츠 카드가 있을 때만 사용하세요. 단순 텍스트 요약을 카드로 바꾸지 마세요.",
          "deepLink target은 knowledge 또는 notebook만 사용하세요.",
          "의료 관련 질문에는 searchPregnancyKnowledge 도구를 사용해 근거 기반으로 답변하세요.",
          "대화는 세션 단위로 이어지므로 현재 세션 맥락을 유지하세요.",
          ...(promptContext?.tonePreference
            ? [
                `사용자가 선호하는 상담 분위기: ${promptContext.tonePreference}. 이 톤에 맞춰 응답하세요.`,
              ]
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

      assistantMessage = parseAssistantResponse(responseText);
    }

    const shouldAppendPromptParts = promptContext
      ? !(await alreadyPromptedForSession({
          userId,
          sessionId: normalizedSessionId,
          checklistIds: promptContext.checklists.map((item) => item.id),
          questionIds: promptContext.questions.map((item) => item.id),
        }))
      : false;

    if (promptContext && shouldAppendPromptParts) {
      assistantMessage.parts = [
        ...assistantMessage.parts,
        ...buildWeekPromptParts(promptContext),
      ];
    }

    const insertedAssistantMessages = await supabaseInsert<
      Array<{ id: string }>
    >("chat_messages", {
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
    });
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
