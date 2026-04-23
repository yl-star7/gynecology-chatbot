import { Hono } from "hono";
import type { Context } from "hono";
import { createKoreanDateKey } from "@gynecology-chatbot/app-core/time";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";
import { searchFileRag } from "@gynecology-chatbot/mobile-api/rag";
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
import {
  maybeShortCircuitStaticTurn,
  type QuestionProgress,
} from "@gynecology-chatbot/mobile-api/chat/stage-shortcut";
import { fetchAttachmentQuestionProgress } from "@gynecology-chatbot/mobile-api/chat/attachment-question-progress";
import {
  markQuestionAnswered,
  recordQuestionSent,
} from "@gynecology-chatbot/mobile-api/chat/question-event-sync";
import {
  buildQuestionSummaryRecord,
  shouldSaveQuestionSummary,
} from "@gynecology-chatbot/mobile-api/chat/question-summary";
import {
  selectStageWorkflow,
  type StageWorkflowMapping,
} from "@gynecology-chatbot/mobile-api/chat/stage-workflow-selector";
import { rewriteLetterReflectionQuickReplies } from "@gynecology-chatbot/mobile-api/chat/letter-reflection-postprocess";
import { loadMaternalNursingWorkflow } from "@gynecology-chatbot/mobile-api/workflows/load-workflow-yaml";
import type {
  CharacterTone,
  ProfileMemoryPayload,
  SessionMemoryPayload,
} from "@gynecology-chatbot/mobile-api/chat/workflow-payload";
import { checkRateLimit } from "@gynecology-chatbot/mobile-api/rate-limit";
import { recordUserAction } from "@gynecology-chatbot/mobile-api/user-action-log";
import { createPersonaSignalInputFromProfileMemory } from "@gynecology-chatbot/mobile-api/persona/persona-signals";
import {
  isMobileSessionError,
  requireMobileSession,
} from "../../lib/session-auth.js";
import { noStoreJson } from "../../lib/responses.js";

const app = new Hono();

function normalizeSessionId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
    ? value
    : crypto.randomUUID();
}

function isUuid(value: string | null) {
  return Boolean(
    value?.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    ),
  );
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

async function postWorkflowSessionMemoryWebhook(input: {
  c: Context;
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
        `${getInternalWebhookBaseUrl(input.c)}/api/internal/daily-summary`,
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

app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const hintedUserId = typeof body.userId === "string" ? body.userId : "";
    const text = typeof body.text === "string" ? body.text : "";
    const selectedQuestionId =
      typeof body.selectedQuestionId === "string"
        ? body.selectedQuestionId
        : null;
    const clientWorkflowStage =
      typeof body.clientWorkflowStage === "number" ||
      typeof body.clientWorkflowStage === "string"
        ? body.clientWorkflowStage
        : null;
    const clientWorkflowStageName =
      typeof body.clientWorkflowStageName === "string"
        ? body.clientWorkflowStageName
        : null;
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

    const weekKnowledgeEntityId =
      await findWeekKnowledgeEntityId(pregnancyWeek);

    const stageMapping: StageWorkflowMapping = await (async () => {
      try {
        const row = await prisma.system_config.findUnique({
          where: { key: "workflow_stage_mapping" },
          select: { value: true },
        });
        const stored = (row?.value ?? null) as unknown;
        if (stored && typeof stored === "object" && !Array.isArray(stored)) {
          const s = stored as Record<string, unknown>;
          const pick = (k: string, envKey: string) =>
            typeof s[k] === "string" && (s[k] as string).trim()
              ? (s[k] as string).trim()
              : (process.env[envKey] ?? null);
          return {
            baby_info: pick("baby_info", "SCHIFT_WF_BABY_INFO"),
            letter_reflection: pick(
              "letter_reflection",
              "SCHIFT_WF_LETTER_REFLECTION",
            ),
            free_chat: pick("free_chat", "SCHIFT_WF_FREE_CHAT"),
            general: pick("general", "SCHIFT_WF_GENERAL"),
          };
        }
      } catch {
        // fallthrough to env
      }
      return {
        baby_info: process.env.SCHIFT_WF_BABY_INFO ?? null,
        letter_reflection: process.env.SCHIFT_WF_LETTER_REFLECTION ?? null,
        free_chat: process.env.SCHIFT_WF_FREE_CHAT ?? null,
        general: process.env.SCHIFT_WF_GENERAL ?? null,
      };
    })();

    const baseMobileResponder = createMobileChatResponder({
      getSchiftClient,
      runSchiftWorkflow,
      extractSchiftWorkflowOutputs,
      formatSchiftWorkflowRun,
      loadCharacterImages,
      preferLocalFallback: false,
      loadRagContext: ({ query, currentWeek }) =>
        searchFileRag({
          query,
          currentWeek,
          matchCount: 5,
        }),
      weekKnowledgeEntityId,
      selectWorkflowId: (sel) => {
        const picked = selectStageWorkflow(sel, stageMapping);
        if (picked) {
          console.info(
            `[stage-workflow] key=${picked.key} id=${picked.workflowId} reason=${picked.reason}`,
          );
          return picked.workflowId;
        }
        return null;
      },
    });

    const workflowDef = loadMaternalNursingWorkflow();
    const moodPool = (() => {
      try {
        const parsed = JSON.parse(
          workflowDef.prompts.static_mood_intake ?? "{}",
        );
        return Array.isArray(parsed.moodPrompts)
          ? (parsed.moodPrompts as Array<{
              label: string;
              message: string;
              tone: CharacterTone;
            }>)
          : [];
      } catch {
        return [];
      }
    })();
    const weekInfoOptInVariations = (() => {
      try {
        const parsed = JSON.parse(
          workflowDef.prompts.static_week_info_opt_in ?? "{}",
        );
        return Array.isArray(parsed.answerVariations)
          ? (parsed.answerVariations as string[])
          : [];
      } catch {
        return [];
      }
    })();

    const respondWithMobileChat: typeof baseMobileResponder = async (input) => {
      let progress: QuestionProgress;
      try {
        progress = await fetchAttachmentQuestionProgress({
          prisma: prisma as unknown as Parameters<
            typeof fetchAttachmentQuestionProgress
          >[0]["prisma"],
          userId: input.userId,
          sessionId: input.normalizedSessionId,
        });
      } catch (error) {
        console.warn("attachment progress fetch failed", error);
        progress = {
          answeredQuestionIds: [],
          currentAttachmentQuestionId: null,
        };
      }

      const todayQuestionCandidates = (
        input.promptContext?.questions ?? []
      ).map((q) => ({
        id: q.id,
        text:
          (q as unknown as { question_text?: string }).question_text ??
          (q as unknown as { text?: string }).text ??
          q.id,
      }));

      const selectedMood =
        moodPool.find((m) => m.message === input.text)?.message ??
        (() => {
          const initialMoodLabelByChoiceId: Record<string, string> = {
            "initial-workflow-good": "좋아요",
            "initial-workflow-down": "울적해요",
            "initial-workflow-sad": "슬퍼요",
            "initial-workflow-angry": "짜증나요",
          };
          const selectedLabel = input.selectedQuestionId
            ? initialMoodLabelByChoiceId[input.selectedQuestionId]
            : null;
          return selectedLabel
            ? (moodPool.find((m) => m.label === selectedLabel)?.message ??
                null)
            : null;
        })();

      const shortcut = maybeShortCircuitStaticTurn({
        userText: input.text,
        selectedMood,
        selectedQuestionId: isUuid(input.selectedQuestionId ?? null)
          ? (input.selectedQuestionId ?? null)
          : null,
        clientWorkflowStage,
        clientWorkflowStageName,
        currentWeek: input.currentWeek,
        promptContext: input.promptContext,
        moodPool,
        weekInfoOptInVariations,
        todayQuestionCandidates,
        progress,
      });

      if (shortcut) {
        if (shortcut.sideEffects?.fireMoodWebhook) {
          const moodSide = shortcut.sideEffects.fireMoodWebhook;
          postWorkflowSessionMemoryWebhook({
            c,
            userId: input.userId,
            sessionId: input.normalizedSessionId,
            sourceMessageId: null,
            idempotencyKey: `mood-${input.userId}-${input.normalizedSessionId}-${moodSide.moodId}`,
            nextSessionMemory: {
              moodId: moodSide.moodId,
              moodLabel: moodSide.moodLabel,
            } as SessionMemoryPayload,
          }).catch((error) => {
            console.warn("mood webhook dispatch failed", error);
          });
        }
        return {
          assistantMessage: shortcut.assistantMessage,
          workflowMemoryPayload: shortcut.workflowMemoryPayload,
        };
      }

      const result = await baseMobileResponder(input);
      const payload = result.workflowMemoryPayload;
      const priorStage = input.promptContext?.sessionMemory?.stage ?? null;
      if (payload) {
        const next = payload.nextSessionMemory as
          | (SessionMemoryPayload & {
              currentAttachmentQuestionId?: string | null;
              answeredQuestionIds?: string[];
            })
          | undefined;
        if (next && progress.currentAttachmentQuestionId) {
          if (Number(next.stage) === 0 || (next.stage as unknown) === "0") {
            next.stage = 2;
            next.stageName = "choice_conversation";
            if (!next.compactSummary?.includes("질문")) {
              next.compactSummary = "현재 단계: 질문 답변 중";
            }
          }
          if (!next.currentAttachmentQuestionId) {
            (next as Record<string, unknown>).currentAttachmentQuestionId =
              progress.currentAttachmentQuestionId;
          }
          if (!Array.isArray(next.answeredQuestionIds)) {
            (next as Record<string, unknown>).answeredQuestionIds =
              progress.answeredQuestionIds;
          }
        }
        if (next && priorStage === "free_chat" && next.stage !== "ended") {
          next.stage = "free_chat";
          next.stageName = "free_chat";
          if (!next.compactSummary?.includes("자유 대화")) {
            next.compactSummary = "현재 단계: 자유 대화";
          }
        }
        const scenarioOut =
          (payload.scenario as string | undefined) ??
          (next?.lastScenario as string | undefined);
        const stageNumOrStr = (next?.stage as unknown) ?? null;
        if (
          next &&
          scenarioOut === "baby_info" &&
          (Number(stageNumOrStr) === 0 ||
            stageNumOrStr === null ||
            stageNumOrStr === undefined)
        ) {
          next.stage = 1;
          next.stageName = "today_question";
          if (!next.compactSummary?.includes("주차 정보 안내")) {
            next.compactSummary = "현재 단계: 주차 정보 안내 완료";
          }
        }
        const priorScenario =
          input.promptContext?.sessionMemory?.lastScenario ?? null;
        if (
          next &&
          scenarioOut === "baby_info_offer" &&
          priorScenario === "baby_info_offer" &&
          Number(stageNumOrStr) === 0
        ) {
          next.stage = 1;
          next.stageName = "today_question";
          next.compactSummary = "현재 단계: 오늘의 질문 준비";
        }
      }
      const scenarioFinal =
        (payload?.scenario as string | undefined) ??
        ((payload?.nextSessionMemory as any)?.lastScenario as
          | string
          | undefined);
      if (
        scenarioFinal === "letter_reflection" ||
        scenarioFinal === "daily_followup" ||
        scenarioFinal === "empathy_chat"
      ) {
        rewriteLetterReflectionQuickReplies(payload as any, progress);
        const quickReplies = Array.isArray((payload as any)?.quickReplies)
          ? ((payload as any).quickReplies as Array<{
              label?: unknown;
              message?: unknown;
            }>)
          : [];
        if (quickReplies.length > 0) {
          const quickRepliesId = `workflow-quick-${Date.now()}`;
          result.assistantMessage.parts = [
            ...result.assistantMessage.parts.filter(
              (part) => part.type !== "quickReplies",
            ),
            {
              type: "quickReplies",
              id: quickRepliesId,
              choices: quickReplies
                .map((choice, index) => {
                  const label =
                    typeof choice.label === "string"
                      ? choice.label.trim()
                      : "";
                  const message =
                    typeof choice.message === "string" &&
                    choice.message.trim()
                      ? choice.message.trim()
                      : label;
                  return label
                    ? {
                        id: `${quickRepliesId}-choice-${index + 1}`,
                        label,
                        message,
                      }
                    : null;
                })
                .filter(
                  (
                    choice,
                  ): choice is {
                    id: string;
                    label: string;
                    message: string;
                  } => Boolean(choice),
                ),
            },
          ];
        }
      }
      return result;
    };

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
      dispatchSessionMemoryWebhook: async (input) => {
        await postWorkflowSessionMemoryWebhook({
          c,
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

    if (isUuid(selectedQuestionId)) {
      try {
        await recordQuestionSent({
          prisma: prisma as unknown as Parameters<
            typeof recordQuestionSent
          >[0]["prisma"],
          userId,
          sessionId: result.sessionId,
          questionId: selectedQuestionId,
        });
      } catch (error) {
        console.warn("recordQuestionSent failed", error);
      }
    }

    const nextMem = (result.workflowMemoryPayload?.nextSessionMemory ??
      null) as
      | (SessionMemoryPayload & {
          currentAttachmentQuestionId?: string | null;
        })
      | null;
    const priorCurrent = ((
      result as unknown as {
        priorSessionMemory?: { currentAttachmentQuestionId?: string | null };
      }
    ).priorSessionMemory?.currentAttachmentQuestionId ?? null) as string | null;
    const nextCurrent = nextMem?.currentAttachmentQuestionId ?? null;
    const justClosedQuestionId =
      priorCurrent && priorCurrent !== nextCurrent ? priorCurrent : null;
    if (justClosedQuestionId) {
      try {
        const answerText = text.trim();
        await markQuestionAnswered({
          prisma: prisma as unknown as Parameters<
            typeof markQuestionAnswered
          >[0]["prisma"],
          userId,
          sessionId: result.sessionId,
          questionId: justClosedQuestionId,
          answerText,
        });
      } catch (error) {
        console.warn("markQuestionAnswered failed", error);
      }
    }

    const stageForSummary = nextMem?.stage;
    const assistantAnswer = result.assistantMessages
      .flatMap((message) =>
        message.parts.flatMap((part) =>
          part.type === "text" && part.text.trim() ? [part.text.trim()] : [],
        ),
      )
      .join("\n\n")
      .trim();
    if (
      shouldSaveQuestionSummary({
        workflowStage: stageForSummary,
        selectedQuestionId,
        alreadyPersistedQuestionIds: new Set(),
      })
    ) {
      try {
        const dateKey = getKstDateKey();
        const questionRow = await prisma.content_week_questions.findFirst({
          where: { id: selectedQuestionId! },
          select: { question_text: true },
        });
        const record = buildQuestionSummaryRecord({
          userId,
          sessionId: result.sessionId,
          dateKey,
          questionId: selectedQuestionId!,
          questionText: questionRow?.question_text ?? null,
          userAnswer: text.trim(),
          assistantAnswer,
          compactSummary: nextMem?.compactSummary ?? null,
          emotionTone: nextMem?.lastEmotionTone ?? null,
          moodId: nextMem?.moodId ?? null,
          moodLabel: nextMem?.moodLabel ?? null,
        });
        await prisma.calendar_logs.create({
          data: {
            user_id: record.userId,
            session_id: record.sessionId,
            date: parseDateOnly(record.date),
            entry_type: record.entryType,
            title: record.title,
            summary: record.summary,
            payload: record.payload as Prisma.InputJsonValue,
          },
        });
      } catch (error) {
        console.warn("question_summary calendar save failed", error);
      }
    }

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
    } catch (error) {
      console.warn("mobile chat calendar sync failed", error);
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
