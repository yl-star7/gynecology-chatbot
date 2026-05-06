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
  maybeShortCircuitStaticTurn,
  type QuestionProgress,
} from "@gynecology-chatbot/mobile-api/chat/stage-shortcut";
import { parseChatFlowConfig } from "@gynecology-chatbot/mobile-api/chat/chat-flow-config";
import { fetchAttachmentQuestionProgress } from "@gynecology-chatbot/mobile-api/chat/attachment-question-progress";
import {
  classifyMoodToneWithLlm,
  createMoodVariantSeed,
  resolveMoodVariantTextPool,
} from "@gynecology-chatbot/mobile-api/mood-variants";
import {
  markQuestionAnswered,
  markQuestionSkipped,
  recordQuestionSent,
} from "@gynecology-chatbot/mobile-api/chat/question-event-sync";
import {
  buildQuestionSummaryRecord,
  isQuestionAnswerText,
  isQuestionSummaryPendingText,
  resolveQuestionSummaryQuestionId,
  shouldSaveQuestionSummary,
} from "@gynecology-chatbot/mobile-api/chat/question-summary";
import {
  selectStageWorkflow,
  type StageWorkflowMapping,
} from "@gynecology-chatbot/mobile-api/chat/stage-workflow-selector";
import {
  resolveLetterReflectionCurrentTurnCount,
  rewriteLetterReflectionQuickReplies,
  syncLetterReflectionPayloadToMessageParts,
} from "@gynecology-chatbot/mobile-api/chat/letter-reflection-postprocess";
import { loadMaternalNursingWorkflow } from "@gynecology-chatbot/mobile-api/workflows/load-workflow-yaml";
import type { CharacterTone } from "@gynecology-chatbot/mobile-api/chat/workflow-payload";
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

function isUuid(value: string | null) {
  return Boolean(
    value?.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    ),
  );
}

function normalizeMoodTone(value: unknown): CharacterTone | null {
  return value === "calm" ||
    value === "joyful" ||
    value === "anxious" ||
    value === "tired" ||
    value === "sad"
    ? value
    : null;
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
    const selectedMoodTone = normalizeMoodTone(body.selectedMoodTone);
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

    // stage → workflow ID 매핑 조회 (DB 우선, 없으면 env)
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

    // Short-circuit 래퍼 — stage=0/1 static 턴은 LLM 없이 즉시 반환.
    // stage=2 및 LLM 필요 턴은 baseMobileResponder 로 위임.
    const workflowDef = loadMaternalNursingWorkflow();
    const chatFlowConfig = parseChatFlowConfig({
      chatFlow: workflowDef.chatFlow,
      prompts: workflowDef.prompts,
    });
    const moodIntakeConfig = chatFlowConfig.moodIntake;
    const moodPool = moodIntakeConfig.moodPrompts;
    const weekInfoOptInVariations =
      chatFlowConfig.weekInfoOptIn.answerVariations;

    const respondWithMobileChat: typeof baseMobileResponder = async (input) => {
      // 0) SQL 기반 진행 상태 조회
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

      // mood selection 은 user 가 mood quickReply 탭 시 text 로 들어옴
      const moodVariantSeed = createMoodVariantSeed([
        input.userId,
        input.normalizedSessionId,
        input.text,
      ]);
      const memory = input.promptContext?.sessionMemory ?? null;
      const rawStage = memory?.stage ?? null;
      const compactSummary = memory?.compactSummary ?? "";
      const canInferFreeTextMood =
        !progress.currentAttachmentQuestionId &&
        (rawStage === 0 || rawStage === null) &&
        !compactSummary.includes("태아 발달 확인 제안") &&
        !compactSummary.includes("주차 정보 안내");
      const matchedMoodEntry = moodPool.find((m) => m.message === input.text);
      const shouldInferFreeTextMood =
        !selectedMoodTone && !matchedMoodEntry && canInferFreeTextMood;
      const inferredFreeTextMood = shouldInferFreeTextMood
        ? await classifyMoodToneWithLlm({ text: input.text })
        : "unknown";
      const selectedMoodEntry = selectedMoodTone
        ? {
            label: matchedMoodEntry?.label ?? input.text,
            message: input.text,
            tone: selectedMoodTone,
          }
        : (matchedMoodEntry ??
          (inferredFreeTextMood !== "unknown"
            ? {
                label: "직접 입력",
                message: input.text,
                tone: inferredFreeTextMood,
              }
            : null));
      const effectiveMoodPool =
        selectedMoodEntry &&
        !moodPool.some((m) => m.message === selectedMoodEntry.message)
          ? [selectedMoodEntry, ...moodPool]
          : moodPool;
      const selectedMood = selectedMoodEntry?.message ?? null;
      const moodAcknowledgementPool = selectedMoodEntry
        ? await resolveMoodVariantTextPool({
            scenario: "mood_intake",
            mood: selectedMoodEntry.tone,
            rngSeed: moodVariantSeed,
          })
        : [];

      const shortcut = maybeShortCircuitStaticTurn({
        userText: input.text,
        selectedMood,
        selectedQuestionId: isUuid(input.selectedQuestionId ?? null)
          ? (input.selectedQuestionId ?? null)
          : null,
        transientWorkflowStage:
          selectedMoodEntry && rawStage === null ? 0 : null,
        currentWeek: input.currentWeek,
        promptContext: input.promptContext,
        moodPool: effectiveMoodPool,
        moodPromptText: moodIntakeConfig.promptText,
        directMoodAcknowledgementText:
          moodIntakeConfig.directInputAcknowledgementText,
        moodAcknowledgementPool,
        weekInfoOptInVariations,
        flowConfig: chatFlowConfig,
        todayQuestionCandidates,
        progress,
        rngSeed: moodVariantSeed,
      });

      if (shortcut) {
        // mood webhook fire-and-forget (session memory 에 mood 주입)
        if (shortcut.sideEffects?.fireMoodWebhook) {
          const moodSide = shortcut.sideEffects.fireMoodWebhook;
          postWorkflowSessionMemoryWebhook({
            request,
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

      // 1) 일반 Schift 경로
      const result = await baseMobileResponder(input);

      // 2) Schift LLM 이 stage 를 잘못 리셋해도 보정.
      const payload = result.workflowMemoryPayload;
      const priorStage = input.promptContext?.sessionMemory?.stage ?? null;
      if (payload) {
        const next = payload.nextSessionMemory as
          | (SessionMemoryPayload & {
              currentAttachmentQuestionId?: string | null;
              answeredQuestionIds?: string[];
            })
          | undefined;
        // (a) 질문 대화 중이면 stage=2 강제 유지
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
        // (b) 직전이 free_chat 이었으면 유지 (LLM 이 stage=2 리셋하는 버그 대응)
        if (next && priorStage === "free_chat" && next.stage !== "ended") {
          next.stage = "free_chat";
          next.stageName = "free_chat";
          if (!next.compactSummary?.includes("자유 대화")) {
            next.compactSummary = "현재 단계: 자유 대화";
          }
        }
        // (c) Y path 성공: scenario=baby_info 인데 stage 가 0/null 이면 stage=1 로 강제 전진
        //      (stage=1 today_question 로 이어가 loop 방지)
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
        // (d) scenario=baby_info_offer 가 stage=0 을 반복 loop 하는 경우 방지:
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
      // (e) letter_reflection 응답 후처리: 남은 질문 개수 quickReply 라벨에 반영
      const scenarioFinal =
        (payload?.scenario as string | undefined) ??
        ((payload?.nextSessionMemory as any)?.lastScenario as
          | string
          | undefined);
      const priorMemory = input.promptContext?.sessionMemory as
        | (SessionMemoryPayload & {
            currentQuestionTurnCount?: number;
            currentAttachmentQuestionId?: string | null;
          })
        | null
        | undefined;
      const activeQuestionId =
        progress.currentAttachmentQuestionId ??
        priorMemory?.currentAttachmentQuestionId ??
        null;
      if (
        activeQuestionId ||
        scenarioFinal === "letter_reflection" ||
        scenarioFinal === "daily_followup" ||
        scenarioFinal === "empathy_chat"
      ) {
        const priorTurnCount = priorMemory?.currentQuestionTurnCount ?? 0;
        const priorQuestionId =
          priorMemory?.currentAttachmentQuestionId ?? null;
        const nextMem = payload?.nextSessionMemory as
          | (SessionMemoryPayload & {
              currentAttachmentQuestionId?: string | null;
              currentQuestionTurnCount?: number;
            })
          | undefined;
        const nextQuestionId =
          nextMem?.currentAttachmentQuestionId ?? activeQuestionId;
        const currentQuestionTurnCount =
          resolveLetterReflectionCurrentTurnCount({
            priorQuestionId,
            priorTurnCount,
            nextQuestionId,
            recentMessages: input.promptContext?.recentMessages,
          });
        if (nextMem) {
          (nextMem as Record<string, unknown>).currentQuestionTurnCount =
            currentQuestionTurnCount;
        }
        rewriteLetterReflectionQuickReplies(
          payload as any,
          {
            answeredQuestionIds: progress.answeredQuestionIds,
            currentAttachmentQuestionId: activeQuestionId,
            currentQuestionTurnCount,
          },
          {
            mode: chatFlowConfig.questionAnswer.reflectionLoop.quickReplyMode,
            loopPolicy: chatFlowConfig.questionAnswer.reflectionLoop,
            quota: todayQuestionCandidates.length,
            candidateQuestionIds: todayQuestionCandidates.map((q) => q.id),
          },
        );
        syncLetterReflectionPayloadToMessageParts(
          result.assistantMessage,
          payload as any,
        );
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

    // ── attachment_question 이벤트 동기화 ──
    // 1) 사용자가 질문 선택 (selectedQuestionId 입력) → user_question_events INSERT
    if (selectedQuestionId && isUuid(selectedQuestionId)) {
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
    // 2) 이전 턴의 currentAttachmentQuestionId 와 다음 턴이 다르면 질문 종료로 간주
    //    → UPDATE status='answered' + calendar question_summary 기록
    const nextMem = (result.workflowMemoryPayload?.nextSessionMemory ??
      null) as
      | (SessionMemoryPayload & {
          currentAttachmentQuestionId?: string | null;
        })
      | null;
    const priorCurrent =
      (
        result.promptContext?.sessionMemory as {
          currentAttachmentQuestionId?: string | null;
        } | null
      )?.currentAttachmentQuestionId ?? null;
    const nextCurrent = nextMem?.currentAttachmentQuestionId ?? null;
    const priorCurrentQuestionId = isUuid(priorCurrent) ? priorCurrent : null;
    const nextCurrentQuestionId = isUuid(nextCurrent) ? nextCurrent : null;
    const justClosedQuestionId =
      priorCurrentQuestionId && priorCurrentQuestionId !== nextCurrentQuestionId
        ? priorCurrentQuestionId
        : null;
    const selectedQuestionIdForSummary = isUuid(selectedQuestionId)
      ? selectedQuestionId
      : null;
    const activeQuestionId = resolveQuestionSummaryQuestionId({
      selectedQuestionId: selectedQuestionIdForSummary,
      currentAttachmentQuestionId: priorCurrentQuestionId,
      nextAttachmentQuestionId: nextCurrentQuestionId,
    });
    const answerText = text.trim();
    const answerQuestionId =
      !selectedQuestionIdForSummary &&
      isQuestionAnswerText({ userAnswer: answerText })
        ? activeQuestionId
        : justClosedQuestionId &&
            isQuestionAnswerText({ userAnswer: answerText })
          ? justClosedQuestionId
          : null;
    if (answerQuestionId) {
      try {
        await markQuestionAnswered({
          prisma: prisma as unknown as Parameters<
            typeof markQuestionAnswered
          >[0]["prisma"],
          userId,
          sessionId: result.sessionId,
          questionId: answerQuestionId,
          answerText,
        });
      } catch (error) {
        console.warn("markQuestionAnswered failed", error);
      }
    }
    if (
      justClosedQuestionId &&
      nextMem?.stage === "free_chat" &&
      nextMem.stageName === "question_session_deferred" &&
      !isQuestionAnswerText({ userAnswer: answerText })
    ) {
      try {
        await markQuestionSkipped({
          prisma: prisma as unknown as Parameters<
            typeof markQuestionSkipped
          >[0]["prisma"],
          userId,
          sessionId: result.sessionId,
          questionId: justClosedQuestionId,
          reasonText: answerText,
        });
      } catch (error) {
        console.warn("markQuestionSkipped failed", error);
      }
    }
    // 3) stage=2 턴 (LLM 경로) 에서 selectedQuestionId 있을 때 calendar question_summary 기록
    const stageForSummary = nextMem?.stage;
    const assistantAnswer = result.assistantMessages
      .flatMap((message) =>
        message.parts.flatMap((part) =>
          part.type === "text" && part.text.trim() ? [part.text.trim()] : [],
        ),
      )
      .join("\n\n")
      .trim();
    if (activeQuestionId && isQuestionAnswerText({ userAnswer: text })) {
      try {
        const dateKey = getKstDateKey();
        const existingQuestionRows = await prisma.calendar_logs.findMany({
          where: {
            user_id: userId,
            date: parseDateOnly(dateKey),
            entry_type: "question_summary",
          },
          select: { id: true, summary: true, payload: true },
        });
        const existingQuestionRowById = new Map<
          string,
          (typeof existingQuestionRows)[number]
        >();
        const alreadyPersistedQuestionIds = new Set<string>();
        for (const row of existingQuestionRows) {
          const payload =
            row.payload &&
            typeof row.payload === "object" &&
            !Array.isArray(row.payload)
              ? (row.payload as {
                  questionId?: unknown;
                  answer?: unknown;
                  compactSummary?: unknown;
                })
              : null;
          const questionId =
            typeof payload?.questionId === "string" ? payload.questionId : null;
          if (!questionId) continue;
          existingQuestionRowById.set(questionId, row);
          const storedAnswer =
            typeof payload?.answer === "string" ? payload.answer : row.summary;
          const storedSummary =
            typeof payload?.compactSummary === "string"
              ? payload.compactSummary
              : row.summary;
          if (
            isQuestionAnswerText({ userAnswer: storedAnswer }) &&
            !isQuestionSummaryPendingText(storedSummary)
          ) {
            alreadyPersistedQuestionIds.add(questionId);
          }
        }
        if (
          !shouldSaveQuestionSummary({
            workflowStage: stageForSummary,
            selectedQuestionId: activeQuestionId,
            alreadyPersistedQuestionIds,
            compactSummary: nextMem?.compactSummary ?? null,
          })
        ) {
          throw new Error("skip_question_summary");
        }
        const questionRow = await prisma.content_week_questions.findFirst({
          where: { id: activeQuestionId },
          select: { question_text: true },
        });
        if (
          !isQuestionAnswerText({
            userAnswer: text,
            questionText: questionRow?.question_text ?? null,
          })
        ) {
          throw new Error("skip_question_summary");
        }
        const record = buildQuestionSummaryRecord({
          userId,
          sessionId: result.sessionId,
          dateKey,
          questionId: activeQuestionId,
          questionText: questionRow?.question_text ?? null,
          userAnswer: text.trim(),
          assistantAnswer,
          compactSummary: nextMem?.compactSummary ?? null,
          emotionTone: nextMem?.lastEmotionTone ?? null,
          moodId: nextMem?.moodId ?? null,
          moodLabel: nextMem?.moodLabel ?? null,
        });
        const data = {
          user_id: record.userId,
          session_id: record.sessionId,
          date: parseDateOnly(record.date),
          entry_type: record.entryType,
          title: record.title,
          summary: record.summary,
          payload: record.payload as Prisma.InputJsonValue,
        };
        const existingQuestionRow =
          existingQuestionRowById.get(activeQuestionId);
        if (existingQuestionRow) {
          await prisma.calendar_logs.update({
            where: { id: existingQuestionRow.id },
            data,
          });
        } else {
          await prisma.calendar_logs.create({
            data,
          });
        }
      } catch (error) {
        if ((error as Error).message !== "skip_question_summary") {
          console.warn("question_summary calendar save failed", error);
        }
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
