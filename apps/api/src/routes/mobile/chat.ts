import { Hono } from "hono";
import type { Context } from "hono";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createKoreanDateKey } from "@gynecology-chatbot/app-core/time";
import { generateText } from "ai";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";
import {
  searchFileRag,
  type RagSource,
} from "@gynecology-chatbot/mobile-api/rag";
import { getSchiftClient } from "@gynecology-chatbot/mobile-api/schift-client";
import {
  extractSchiftWorkflowOutputs,
  formatSchiftWorkflowRun,
  runSchiftWorkflow,
} from "@gynecology-chatbot/mobile-api/schift-workflow";
import { detectHardGuardrailReason } from "@gynecology-chatbot/mobile-api/chat/guardrails";
import {
  createPromptEvents,
  ensureChatSession,
  getAlreadyPromptedIds,
  getPromptContext,
  markOutstandingPromptEventsAnswered,
  PastSessionWriteError,
  saveAssistantChatMessages,
  saveUserChatMessage,
  touchChatSessionActivity,
  updateProfileMemory,
  updateSessionMemory,
} from "@gynecology-chatbot/mobile-api/chat/chat-repository";
import { buildPromptFollowUpMessages } from "@gynecology-chatbot/mobile-api/chat/follow-ups";
import { buildChatOrchestrator } from "@gynecology-chatbot/mobile-api/chat/chat-orchestrator";
import { createMobileChatResponder } from "@gynecology-chatbot/mobile-api/chat/responders/mobile-chat-responder";
import type { ProfileMemoryPayload } from "@gynecology-chatbot/mobile-api/chat/workflow-payload";
import { checkRateLimit } from "@gynecology-chatbot/mobile-api/rate-limit";
import { recordUserAction } from "@gynecology-chatbot/mobile-api/user-action-log";
import { createPersonaSignalInputFromProfileMemory } from "@gynecology-chatbot/mobile-api/persona/persona-signals";
import {
  isMobileSessionError,
  requireMobileSession,
} from "../../lib/session-auth.js";
import { noStoreJson } from "../../lib/responses.js";

const app = new Hono();

function getGoogleApiKey() {
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required for mobile chat responses");
  }

  return apiKey;
}

function google(modelName: string) {
  return createGoogleGenerativeAI({
    apiKey: getGoogleApiKey(),
  })(modelName);
}

function normalizeSessionId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
    ? value
    : crypto.randomUUID();
}

function getKstDateKey() {
  return createKoreanDateKey();
}

function getInternalWebhookBaseUrl(c: Context) {
  const host =
    c.req.header("x-forwarded-host") ?? c.req.header("host") ?? "localhost";
  const protocol =
    c.req.header("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");

  return (process.env.NEXT_PUBLIC_APP_URL ?? `${protocol}://${host}`).replace(
    /\/$/,
    "",
  );
}

function parseDateOnly(isoDate: string) {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function asStringRecord(
  value: Prisma.JsonValue,
): Record<string, string | null> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      typeof item === "string" || item === null ? item : null,
    ]),
  );
}

async function postPersonaSignalWebhook(input: {
  c: Context;
  userId: string;
  sessionId: string;
  sourceMessageId: string | null;
  nextProfileMemory: ProfileMemoryPayload | null | undefined;
  idempotencyKey: string;
}) {
  const signal = createPersonaSignalInputFromProfileMemory({
    userId: input.userId,
    sessionId: input.sessionId,
    sourceMessageId: input.sourceMessageId,
    nextProfileMemory: input.nextProfileMemory,
    idempotencyKey: input.idempotencyKey,
  });
  if (!signal) return;

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn("CRON_SECRET missing; skipping persona signal webhook");
    return;
  }

  const response = await fetch(
    `${getInternalWebhookBaseUrl(input.c)}/api/internal/persona-signals`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(signal),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    console.warn(`persona signal webhook failed (${response.status}): ${text}`);
  }
}

async function loadCharacterImages(): Promise<Record<string, string | null>> {
  try {
    const row = await prisma.system_config.findUnique({
      where: { key: "character_images" },
      select: { value: true },
    });
    return row ? asStringRecord(row.value) : {};
  } catch {
    return {};
  }
}

async function findWeekKnowledgeEntityId(currentWeek: number | null) {
  if (!currentWeek) return null;
  const document = await prisma.content_pregnancy_documents.findFirst({
    where: { pregnancy_week: currentWeek },
    select: { id: true },
    orderBy: [{ updated_at: "desc" }],
  });
  return document?.id ?? null;
}

app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const hintedUserId = typeof body.userId === "string" ? body.userId : "";
    const text = typeof body.text === "string" ? body.text : "";
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    const pregnancyWeek =
      typeof body.pregnancyWeek === "number" ? body.pregnancyWeek : null;
    const imageDataUris = Array.isArray(body.imageDataUris)
      ? body.imageDataUris
      : [];

    if (!sessionId || (!text && imageDataUris.length === 0)) {
      return c.json(
        { error: "sessionId and text or imageDataUris are required" },
        400,
      );
    }

    if (text && text.length > 3000) {
      return c.json(
        { error: "메시지가 너무 길어요. 3,000자 이내로 줄여주세요." },
        400,
      );
    }
    const { userId } = await requireMobileSession(c, hintedUserId);

    const rateCheck = checkRateLimit(`chat:${userId}`, 20, 60_000);
    if (!rateCheck.allowed) {
      c.header(
        "Retry-After",
        String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)),
      );
      c.header("X-RateLimit-Remaining", "0");
      return c.json(
        { error: "너무 많은 요청이에요. 잠시 후 다시 시도해주세요." },
        429,
      );
    }

    const normalizedSessionId = normalizeSessionId(sessionId);
    const hardGuardrailReason = detectHardGuardrailReason(text);

    let fileRagSources: RagSource[] = [];
    let fileRagContext = "";
    const weekKnowledgeEntityId =
      await findWeekKnowledgeEntityId(pregnancyWeek);
    if (!hardGuardrailReason && text.trim()) {
      const fileRag = await searchFileRag({
        query: text,
        currentWeek: pregnancyWeek,
        matchCount: 5,
      });
      fileRagSources = fileRag.sources;
      fileRagContext = fileRag.context;
    }

    const respondWithMobileChat = createMobileChatResponder({
      getSchiftClient,
      runSchiftWorkflow,
      extractSchiftWorkflowOutputs,
      formatSchiftWorkflowRun,
      loadCharacterImages,
      ragContext: fileRagContext,
      weekKnowledgeEntityId,
    });

    const orchestrateChat = buildChatOrchestrator({
      ensureSession: ensureChatSession,
      saveUserMessage: saveUserChatMessage,
      touchSessionActivity: touchChatSessionActivity,
      recordUserAction: async (input) => {
        await recordUserAction({
          userId: input.userId,
          actionType: "chat_message_sent",
          sessionId: input.sessionId,
          messageId: input.messageId,
          payload: {
            pregnancyWeek: input.pregnancyWeek,
            imageCount: input.imageCount,
            textPreview: input.textPreview,
          },
        });
      },
      markOutstandingPromptEventsAnswered,
      getPromptContext,
      resolveAssistantResponse: respondWithMobileChat,
      saveAssistantMessages: saveAssistantChatMessages,
      updateSessionMemory,
      updateProfileMemory: async (
        userId,
        onboardingPayload,
        currentProfileMemory,
        nextProfileMemory,
        timestamp,
      ) => {
        await updateProfileMemory({
          userId,
          onboardingPayload,
          currentProfileMemory,
          nextProfileMemory,
          timestamp,
        });
      },
      dispatchPersonaSignalWebhook: async (input) => {
        await postPersonaSignalWebhook({
          c,
          ...input,
        });
      },
      buildFollowUps: (input) =>
        buildPromptFollowUpMessages({
          ...input,
          generateChecklistChoices: async ({
            title,
            description,
            weekNumber,
          }) => {
            try {
              const weekLine = weekNumber ? `${weekNumber}주차 ` : "";
              const descLine = description?.trim()
                ? `설명: ${description.trim()}`
                : "";
              const { text: rawText } = await generateText({
                model: google("gemini-2.5-flash-lite"),
                system: [
                  "당신은 임산부 상담 앱의 체크리스트 응답 버튼 라벨을 만드는 도우미입니다.",
                  "체크리스트 항목 하나가 주어지면 산모가 탭으로 바로 답할 수 있는 3개의 짧은 선택지를 JSON 배열로만 출력하세요.",
                  "각 항목은 { label, message } 구조이고 label은 화면에 표시할 버튼 글자(최대 10자, 따뜻한 -어요체), message는 탭 시 전송될 한 문장입니다.",
                  "첫 번째는 '완료' 의미, 두 번째는 '아직 못함' 의미, 세 번째는 '어떻게/왜 해야 하는지' 묻는 의미로 구성하세요.",
                  "JSON 외 어떤 텍스트도 포함하지 마세요. 코드 블록 래핑 없이 순수 JSON만.",
                ].join("\n"),
                prompt: [
                  `${weekLine}체크리스트 항목:`,
                  `제목: ${title}`,
                  descLine,
                  "",
                  '예시 형식: [{"label":"…","message":"…"},{"label":"…","message":"…"},{"label":"…","message":"…"}]',
                ]
                  .filter(Boolean)
                  .join("\n"),
              });
              const cleaned = rawText
                .trim()
                .replace(/^```(?:json)?/i, "")
                .replace(/```$/i, "")
                .trim();
              const parsed = JSON.parse(cleaned);
              if (!Array.isArray(parsed)) return null;
              return parsed
                .map((item) => {
                  if (!item || typeof item !== "object") return null;
                  const record = item as Record<string, unknown>;
                  const label =
                    typeof record.label === "string" ? record.label.trim() : "";
                  if (!label) return null;
                  const message =
                    typeof record.message === "string" && record.message.trim()
                      ? record.message.trim()
                      : label;
                  return { label, message };
                })
                .filter(
                  (v): v is { label: string; message: string } => v !== null,
                )
                .slice(0, 3);
            } catch (error) {
              console.warn("generateChecklistChoices failed", error);
              return null;
            }
          },
        }),
      createPromptEvents,
      getAlreadyPromptedIds,
      decorateAssistantMessage: (message) => {
        if (fileRagSources.length === 0) {
          return message;
        }

        return {
          ...message,
          parts: [
            ...message.parts,
            {
              type: "_rag_sources",
              id: `rag-sources-${Date.now()}`,
              sources: fileRagSources,
            } as unknown as (typeof message.parts)[number],
          ],
        };
      },
    });

    const result = await orchestrateChat({
      userId,
      text,
      sessionId: normalizedSessionId,
      pregnancyWeek,
      imageDataUris,
      hardGuardrailReason,
    });

    const todayDate = getKstDateKey();
    const existingChatCalendarLog = await prisma.calendar_logs.findFirst({
      where: {
        user_id: userId,
        date: parseDateOnly(todayDate),
        session_id: result.sessionId,
        entry_type: "chat_saved",
      },
      select: { id: true },
    });
    const assistantSummary = result.assistantMessages
      .flatMap((message) =>
        message.parts.flatMap((part) =>
          part.type === "text" && part.text.trim() ? [part.text.trim()] : [],
        ),
      )
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    const compactSummary =
      result.workflowMemoryPayload?.nextSessionMemory?.compactSummary
        ?.replace(/^현재 단계:\s*/u, "")
        .trim();
    const calendarSummary =
      compactSummary ||
      assistantSummary.slice(0, 220) ||
      text.slice(0, 140) ||
      null;
    const chatCalendarPayload = {
      lastMessageAt: new Date().toISOString(),
      source: "chat_session_sync",
      compactSummary:
        result.workflowMemoryPayload?.nextSessionMemory?.compactSummary ?? null,
      assistantSummary: assistantSummary || null,
    };
    if (existingChatCalendarLog?.id) {
      await prisma.calendar_logs.update({
        where: { id: existingChatCalendarLog.id },
        data: {
          title: text.slice(0, 40) || "아기와 대화",
          summary: calendarSummary,
          payload: chatCalendarPayload,
        },
      });
    } else {
      await prisma.calendar_logs.create({
        data: {
          user_id: userId,
          session_id: result.sessionId,
          date: parseDateOnly(todayDate),
          entry_type: "chat_saved",
          title: text.slice(0, 40) || "아기와 대화",
          summary: calendarSummary,
          payload: chatCalendarPayload,
        },
      });
    }

    return noStoreJson(c, {
      assistantMessage: result.assistantMessage,
      assistantMessages: result.assistantMessages,
      sessionId: result.sessionId,
    });
  } catch (error) {
    console.error("mobile chat route error", error);
    if (isMobileSessionError(error)) {
      return c.json(
        {
          error: error.message,
        },
        401,
      );
    }
    if (error instanceof PastSessionWriteError) {
      return c.json(
        {
          error:
            "지난 대화는 다시 읽어볼 수만 있어요. 새 대화는 오늘 채팅에서 이어가요.",
        },
        409,
      );
    }
    return c.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "채팅 응답 생성에 실패했습니다.",
      },
      500,
    );
  }
});

export default app;
