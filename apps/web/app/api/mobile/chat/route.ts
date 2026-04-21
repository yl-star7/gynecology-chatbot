import { NextRequest, NextResponse } from "next/server";
import { createKoreanDateKey } from "@gynecology-chatbot/app-core/time";

export const maxDuration = 60;
import { getSchiftClient } from "@/lib/mobile/schift-client";
import {
  extractSchiftWorkflowOutputs,
  formatSchiftWorkflowRun,
  runSchiftWorkflow,
} from "@/lib/mobile/schift-workflow";
import { detectHardGuardrailReason } from "@/lib/mobile/chat/guardrails";
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
} from "@/lib/mobile/chat/chat-repository";
import { buildPromptFollowUpMessages } from "@/lib/mobile/chat/follow-ups";
import { buildChatOrchestrator } from "@/lib/mobile/chat/chat-orchestrator";
import { createMobileChatResponder } from "@/lib/mobile/chat/responders/mobile-chat-responder";
import {
  ProfileMemoryPayload,
  SessionMemoryPayload,
} from "@/lib/mobile/chat/workflow-payload";
import { mobileNoStoreJson } from "@/lib/mobile/session-auth";
import {
  isMobileSessionError,
  requireMobileSession,
} from "@/lib/mobile/session-auth";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";
import { checkRateLimit } from "@/lib/mobile/rate-limit";
import { recordUserAction } from "@/lib/mobile/user-action-log";
import { createPersonaSignalInputFromProfileMemory } from "@/lib/mobile/persona/persona-signals";

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

function getInternalWebhookBaseUrl(request: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    `${request.nextUrl.protocol}//${request.nextUrl.host}`
  ).replace(/\/$/, "");
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
  request: NextRequest;
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
    `${getInternalWebhookBaseUrl(input.request)}/api/internal/persona-signals`,
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

async function postWorkflowSessionMemoryWebhook(input: {
  request: NextRequest;
  userId: string;
  sessionId: string;
  sourceMessageId: string | null;
  nextSessionMemory: SessionMemoryPayload;
  idempotencyKey: string;
}) {
  const payload = {
    userId: input.userId,
    sessionId: input.sessionId,
    sourceMessageId: input.sourceMessageId,
    idempotencyKey: input.idempotencyKey,
    sessionMemory: input.nextSessionMemory,
  };
  const calls: Array<Promise<Response>> = [];
  const webhookUrl = process.env.WORKFLOW_SESSION_MEMORY_WEBHOOK_URL;

  if (webhookUrl) {
    calls.push(
      fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.WORKFLOW_SESSION_MEMORY_WEBHOOK_SECRET
            ? {
                Authorization: `Bearer ${process.env.WORKFLOW_SESSION_MEMORY_WEBHOOK_SECRET}`,
              }
            : {}),
        },
        body: JSON.stringify(payload),
      }),
    );
  }

  const shouldTriggerSummary =
    String(input.nextSessionMemory.stage) === "ended" ||
    input.nextSessionMemory.stageName === "ended";
  if (shouldTriggerSummary && process.env.CRON_SECRET) {
    calls.push(
      fetch(
        `${getInternalWebhookBaseUrl(input.request)}/api/internal/daily-summary`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.CRON_SECRET}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ targetDate: getKstDateKey() }),
        },
      ),
    );
  }

  const results = await Promise.allSettled(calls);
  for (const result of results) {
    if (result.status === "rejected") {
      console.warn("workflow session memory webhook failed", result.reason);
      continue;
    }
    if (!result.value.ok) {
      console.warn(
        `workflow session memory webhook failed (${result.value.status}): ${await result.value.text()}`,
      );
    }
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
  try {
    const document = await prisma.content_pregnancy_documents?.findFirst({
      where: { pregnancy_week: currentWeek },
      select: { id: true },
      orderBy: [{ updated_at: "desc" }],
    });
    return document?.id ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const hintedUserId = typeof body.userId === "string" ? body.userId : "";
    const text = typeof body.text === "string" ? body.text : "";
    const selectedQuestionId =
      typeof body.selectedQuestionId === "string"
        ? body.selectedQuestionId
        : null;
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

    if (text && text.length > 3000) {
      return NextResponse.json(
        { error: "메시지가 너무 길어요. 3,000자 이내로 줄여주세요." },
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
    const hardGuardrailReason = detectHardGuardrailReason(text);

    const weekKnowledgeEntityId =
      await findWeekKnowledgeEntityId(pregnancyWeek);

    const respondWithMobileChat = createMobileChatResponder({
      getSchiftClient,
      runSchiftWorkflow,
      extractSchiftWorkflowOutputs,
      formatSchiftWorkflowRun,
      loadCharacterImages,
      preferLocalFallback: true,
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
          request,
          ...input,
        });
      },
      dispatchSessionMemoryWebhook: async (input) => {
        await postWorkflowSessionMemoryWebhook({
          request,
          ...input,
        });
      },
      buildFollowUps: buildPromptFollowUpMessages,
      createPromptEvents,
      getAlreadyPromptedIds,
    });

    const result = await orchestrateChat({
      userId,
      text,
      selectedQuestionId,
      sessionId: normalizedSessionId,
      pregnancyWeek,
      imageDataUris,
      hardGuardrailReason,
    });

    try {
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
          result.workflowMemoryPayload?.nextSessionMemory?.compactSummary ??
          null,
        assistantSummary: assistantSummary || null,
      };
      if (existingChatCalendarLog?.id) {
        await prisma.calendar_logs.update({
          where: { id: existingChatCalendarLog.id },
          data: {
            title: text.slice(0, 40) || "아기와 대화",
            summary: calendarSummary,
            payload: chatCalendarPayload as Prisma.InputJsonValue,
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
            payload: chatCalendarPayload as Prisma.InputJsonValue,
          },
        });
      }
    } catch (error) {
      console.warn("mobile chat calendar sync failed", error);
    }

    return mobileNoStoreJson({
      assistantMessage: result.assistantMessage,
      assistantMessages: result.assistantMessages,
      sessionId: result.sessionId,
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
    if (error instanceof PastSessionWriteError) {
      return NextResponse.json(
        {
          error:
            "지난 대화는 다시 읽어볼 수만 있어요. 새 대화는 오늘 채팅에서 이어가요.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "채팅 응답 생성에 실패했습니다.",
      },
      { status: 500 },
    );
  }
}
