import type { ChatMessage } from "@gynecology-chatbot/app-core";

import type { PromptContext } from "../chat-repository";
import { resolveAssistantResponse } from "./response-pipeline";
import {
  buildWorkflowAssistantMessage,
  pickLatestEmotionTone,
} from "./route-response-helpers";
import {
  parseWorkflowAssistantPayload,
  type CharacterTone,
  type WorkflowAssistantPayload,
  type WorkflowScenario,
} from "../workflow-payload";
import { resolveMoodVariantSuffix } from "../../mood-variants";

function normalizeLetterFollowUpFlow(input: {
  assistantMessage: ChatMessage;
  workflowMemoryPayload: WorkflowAssistantPayload | null;
}) {
  const scenario =
    input.workflowMemoryPayload?.nextSessionMemory?.lastScenario ??
    input.workflowMemoryPayload?.scenario ??
    null;
  const compactSummary =
    input.workflowMemoryPayload?.nextSessionMemory?.compactSummary ?? "";
  const isLetterFlow =
    scenario === "letter_reflection" ||
    compactSummary.includes("편지 후속 질문") ||
    /편지|아기에게|마음을 전하|쓰셨군요/.test(
      input.assistantMessage.parts
        .flatMap((part) => (part.type === "text" ? [part.text] : []))
        .join("\n"),
    );
  const isDailyFollowup =
    scenario === "daily_followup" ||
    compactSummary.includes("태동/데일리 후속 질문");

  if (!isLetterFlow && !isDailyFollowup) {
    return input;
  }

  input.assistantMessage.parts = input.assistantMessage.parts.filter((part) => {
    if (part.type !== "quickReplies") return true;
    if (isLetterFlow || isDailyFollowup) {
      return false;
    }
    return !part.choices.some((choice) =>
      /오늘은 여기까지|더 이야기|하나 더 말할래요/.test(choice.label),
    );
  });

  const textPart = input.assistantMessage.parts.find(
    (part) => part.type === "text",
  );
  if (textPart?.type === "text") {
    const hasTerminalQuestion = /[?？](?:["”']?\*\*)?\s*$/.test(
      textPart.text.trim(),
    );
    if (isLetterFlow && !hasTerminalQuestion) {
      textPart.text = `${textPart.text.trim()}\n\n지금 편지를 쓰면서 가장 크게 남은 마음은 무엇이었나요?`;
    }
    if (
      isDailyFollowup &&
      !/(태동|몸|하루).*[?？](?:["”']?\*\*)?\s*$/.test(textPart.text.trim())
    ) {
      textPart.text = `${textPart.text.trim()}\n\n오늘은 태동이나 몸 상태가 평소와 비교해 어땠나요?`;
    }
  }

  return input;
}

function normalizeStageContractFlow(input: {
  assistantMessage: ChatMessage;
  workflowMemoryPayload: WorkflowAssistantPayload | null;
  currentWeek: number | null;
  userText: string;
  promptContext: PromptContext | null;
}) {
  const scenario =
    input.workflowMemoryPayload?.scenario ??
    input.workflowMemoryPayload?.nextSessionMemory?.lastScenario ??
    null;
  const requestedBabyInfo =
    (/아기|태아|발달|성장/.test(input.userText) &&
      /볼래|알려|궁금|네|확인/.test(input.userText)) ||
    (/네|응|좋아|볼래|알려|확인/.test(input.userText) &&
      (input.promptContext?.sessionMemory?.lastScenario === "baby_info_offer" ||
        input.promptContext?.sessionMemory?.compactSummary?.includes(
          "태아 발달 확인 제안",
        )));

  if (scenario === "baby_info_offer") {
    if (requestedBabyInfo) {
      const weekLabel = input.currentWeek
        ? `${input.currentWeek}주차`
        : "지금 주수";
      const babyItems =
        input.promptContext?.dayContent?.baby_development_payload?.items ?? [];
      const babySummary = [
        ...babyItems,
        input.promptContext?.dayContent?.baby_message,
        input.promptContext?.week.baby_summary,
      ]
        .filter((value): value is string => Boolean(value?.trim()))
        .slice(0, 2);
      const body =
        babySummary.length > 0
          ? babySummary.join("\n\n")
          : "아기 발달 정보를 준비 중이에요. 지금은 담당 의료진과 확인한 주수 정보를 기준으로 천천히 살펴볼게요.";
      const motherItems =
        input.promptContext?.dayContent?.mother_changes_payload?.items ?? [];
      const motherSummary = [
        ...motherItems,
        input.promptContext?.week.mother_summary,
      ]
        .filter((value): value is string => Boolean(value?.trim()))
        .slice(0, 2);
      const motherBody =
        motherSummary.length > 0
          ? motherSummary.join("\n\n")
          : "엄마 몸 변화는 주수와 개인 컨디션에 따라 다르게 느껴질 수 있어요.";
      input.assistantMessage.parts = [
        {
          type: "text",
          id: `workflow-baby-info-${Date.now()}`,
          text: [
            `${weekLabel} 주차 정보를 같이 볼게요.`,
            "",
            `아기: ${body}`,
            "",
            `엄마: ${motherBody}`,
            "",
            "이어서 오늘의 질문으로 넘어가볼까요?",
          ].join("\n"),
        },
        {
          type: "quickReplies",
          id: `workflow-baby-info-quick-${Date.now()}`,
          choices: [
            {
              id: "weekly-info-question-yes",
              label: "질문 보기",
              message: "오늘 질문을 하나 골라볼게요.",
            },
            {
              id: "weekly-info-question-later",
              label: "나중에요",
              message: "나중에 볼게요.",
            },
          ],
        },
      ];
      input.workflowMemoryPayload!.scenario = "baby_info";
      input.workflowMemoryPayload!.nextSessionMemory = {
        ...(input.workflowMemoryPayload?.nextSessionMemory ?? {}),
        compactSummary: "현재 단계: 주차 정보 안내 완료",
        lastScenario: "baby_info",
      };
      return input;
    }

    const weekLabel = input.currentWeek
      ? `${input.currentWeek}주차`
      : "지금 주수";
    input.assistantMessage.parts = [
      {
        type: "text",
        id: `workflow-baby-info-offer-${Date.now()}`,
        text: `좋은 기분을 나눠줘서 고마워요.\n\n${weekLabel}에 맞는 아기 발달 정보를 짧게 확인해볼까요?`,
      },
    ];
    input.workflowMemoryPayload!.scenario = "baby_info_offer";
    input.workflowMemoryPayload!.nextSessionMemory = {
      ...(input.workflowMemoryPayload?.nextSessionMemory ?? {}),
      compactSummary: "현재 단계: 태아 발달 확인 제안",
      lastScenario: "baby_info_offer",
    };
  }

  if (scenario === "attachment_question") {
    const promptQuestions = input.promptContext?.questions ?? [];
    const normalizeQuestionText = (value: string) =>
      value.replace(/\s+/g, " ").trim();
    const findPromptQuestion = (
      choice: { label: string; message: string },
      index: number,
    ) => {
      const selectedId =
        input.workflowMemoryPayload?.selectedQuestionIds?.[index] ?? null;
      const bySelectedId = selectedId
        ? promptQuestions.find((question) => question.id === selectedId)
        : null;
      if (bySelectedId) return bySelectedId;

      const labelText = normalizeQuestionText(choice.label);
      const messageText = normalizeQuestionText(choice.message);
      return promptQuestions.find((question) => {
        const questionText = normalizeQuestionText(question.question_text);
        return questionText === labelText || questionText === messageText;
      });
    };
    const questionCount =
      input.assistantMessage.parts
        .flatMap((part) => (part.type === "text" ? [part.text] : []))
        .join("\n")
        .match(/[?？]/g)?.length ?? 0;
    const quickReplies = input.assistantMessage.parts.find(
      (part) => part.type === "quickReplies",
    );
    const shouldNormalize =
      questionCount < 2 ||
      !quickReplies ||
      quickReplies.type !== "quickReplies" ||
      quickReplies.choices.length !== 2 ||
      quickReplies.choices.some((choice) =>
        /네|아니요|이따가|질문해/.test(choice.label),
      );

    if (shouldNormalize) {
      const selectedPromptQuestions =
        input.workflowMemoryPayload?.selectedQuestionIds
          ?.map((id) => promptQuestions.find((question) => question.id === id))
          .filter((question): question is (typeof promptQuestions)[number] =>
            Boolean(question),
          ) ?? [];
      const normalizedPromptQuestions =
        selectedPromptQuestions.length > 0
          ? selectedPromptQuestions
          : promptQuestions.slice(0, 2);
      const questions =
        normalizedPromptQuestions.length > 0
          ? normalizedPromptQuestions.map((question) => ({
              id: question.id,
              label: question.question_text,
              message: question.question_text,
            }))
          : [
              {
                id: "attachment-question-1",
                label: "오늘 아기에게 가장 먼저 들려주고 싶은 말은 무엇인가요?",
                message:
                  "오늘 아기에게 가장 먼저 들려주고 싶은 말은 무엇인가요?",
              },
              {
                id: "attachment-question-2",
                label: "요즘 아기가 어떤 순간에 엄마 마음을 느낄 것 같나요?",
                message: "요즘 아기가 어떤 순간에 엄마 마음을 느낄 것 같나요?",
              },
            ];
      input.assistantMessage.parts = [
        {
          type: "text",
          id: `workflow-attachment-question-${Date.now()}`,
          text: "아래 질문 중 하나를 골라 이어가요.",
        },
        {
          type: "quickReplies",
          id: `workflow-attachment-question-quick-${Date.now()}`,
          choices: questions,
        },
      ];
    } else if (quickReplies?.type === "quickReplies") {
      quickReplies.choices = quickReplies.choices.map((choice, index) => {
        const promptQuestion = findPromptQuestion(choice, index);
        if (!promptQuestion) return choice;
        return {
          ...choice,
          id: promptQuestion.id,
          label: promptQuestion.question_text,
          message: promptQuestion.question_text,
        };
      });
    }
    input.workflowMemoryPayload!.scenario = "attachment_question";
    input.workflowMemoryPayload!.nextSessionMemory = {
      ...(input.workflowMemoryPayload?.nextSessionMemory ?? {}),
      compactSummary: "현재 단계: 모아애착 질문",
      lastScenario: "attachment_question",
    };
  }

  return input;
}

type WorkflowRunLike = {
  status: string;
  error?: string | null;
  outputs?: Record<string, unknown>;
  block_states?: unknown;
};

type RagContextResult = {
  context: string;
  sources?: unknown[];
};

function formatPromptItemsForWorkflow(input: {
  promptContext: PromptContext | null;
  alreadyPromptedIds: {
    checklistIds: Set<string>;
    questionIds: Set<string>;
  } | null;
}) {
  if (!input.promptContext) {
    return "";
  }

  const alreadyPromptedIds = input.alreadyPromptedIds ?? {
    checklistIds: new Set<string>(),
    questionIds: new Set<string>(),
  };
  const questions = input.promptContext.questions
    .filter((item) => !alreadyPromptedIds.questionIds.has(item.id))
    .slice(0, 2)
    .map(
      (item, index) =>
        `${index + 1}. [${item.id}] ${item.question_text.trim()}${
          item.help_text?.trim() ? ` - ${item.help_text.trim()}` : ""
        }`,
    );

  return questions.length > 0
    ? `오늘 모아애착 질문 후보:\n${questions.join("\n")}`
    : "오늘 모아애착 질문 후보: 없음";
}

function isQuestionChoiceTurn(input: {
  promptContext: PromptContext | null;
  lastScenario: WorkflowScenario | null;
  userText: string;
}) {
  if (input.lastScenario !== "attachment_question") return false;
  const normalizedUserText = input.userText.replace(/\s+/g, " ").trim();
  if (!normalizedUserText) return false;
  const matchesPromptQuestion =
    input.promptContext?.questions.some(
      (question) =>
        question.question_text.replace(/\s+/g, " ").trim() ===
        normalizedUserText,
    ) ?? false;

  return (
    matchesPromptQuestion ||
    normalizedUserText.endsWith("?") ||
    normalizedUserText.endsWith("？")
  );
}

function buildStageContext(input: {
  compactSummary: string | null;
  currentStage: WorkflowScenario | null;
  currentTurnStage: string | null;
  userText: string;
}) {
  const lines = [
    input.currentStage ? `currentStage=${input.currentStage}` : null,
    input.currentTurnStage
      ? `currentTurnStage=${input.currentTurnStage}`
      : null,
    input.compactSummary ? `compactSummary=${input.compactSummary}` : null,
    input.currentTurnStage === "stage=2/question-choice"
      ? "stage=2/question-choice: 선택된 질문을 현재 입력으로 처리하고, stage 0/1 이전 workflow를 replay하지 말고 inference로 직접 라우팅하세요."
      : null,
    input.userText.trim() ? `currentUserInput=${input.userText.trim()}` : null,
  ].filter((value): value is string => Boolean(value));

  return lines.length > 0 ? lines.join("\n") : null;
}

function buildRequiredToneContext(input: {
  lastEmotionTone: CharacterTone | null;
  tonePreference: string | null;
}) {
  const lines = [
    input.lastEmotionTone
      ? `최근 선택된 감정 톤(${input.lastEmotionTone})을 필수 말투 맥락으로 유지하세요.`
      : null,
    input.tonePreference
      ? `사용자 선호 상담 분위기: ${input.tonePreference}`
      : null,
  ].filter((value): value is string => Boolean(value));

  return lines.length > 0 ? lines.join("\n") : null;
}

function formatCompressedLogForWorkflow(promptContext: PromptContext | null) {
  return (promptContext?.recentMessages ?? [])
    .slice(-8)
    .map((message) => {
      const role =
        message.role === "assistant"
          ? "Assistant"
          : message.role === "user"
            ? "User"
            : "System";
      const text = message.text.replace(/\s+/g, " ").trim();
      return text ? `${role}: ${text.slice(0, 500)}` : null;
    })
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

const INFO_INTENT_PATTERN =
  /(정상|검사|수치|주차|몇\s*주|태동|부종|체중|당뇨|철분|비타민|혈압|발달|크기|초음파|양수|태반|호르몬|영양|철|칼슘|엽산|단백질|체온|심박|임신성)/;
const SYMPTOM_INTENT_PATTERN =
  /(아파|아픔|통증|출혈|분비물|쥐가|어지러|메스꺼|호흡|수축|태동이\s*줄|열나|발열|구토|두통|복통|허리|골반|가려|저려|부어|붓는|붓기)/;

function hasInfoOrSymptomIntent(text: string): boolean {
  return INFO_INTENT_PATTERN.test(text) || SYMPTOM_INTENT_PATTERN.test(text);
}

function shouldLoadRagContext(input: {
  userText: string;
  currentStage: WorkflowScenario | null;
  currentTurnStage: string | null;
  workflowStage: string | number | null;
}) {
  const trimmed = input.userText.trim();
  if (!trimmed) return false;
  if (input.currentTurnStage === "stage=2/question-choice") return false;
  if (
    input.workflowStage === 2 ||
    input.workflowStage === "free_chat" ||
    input.workflowStage === "ended"
  ) {
    return hasInfoOrSymptomIntent(trimmed);
  }
  return ![
    "emotion_checkin",
    "emotion_reason",
    "attachment_question",
    "letter_reflection",
    "daily_followup",
    "empathy_chat",
  ].includes(input.currentStage ?? "");
}

function normalizeWorkflowMemoryPayload(
  payload: WorkflowAssistantPayload | null,
) {
  if (!payload) return payload;

  const emotionTone =
    payload.nextSessionMemory?.lastEmotionTone ??
    payload.nextProfileMemory?.lastEmotionTone ??
    (payload.scenario === "emotion_checkin" ||
    payload.scenario === "emotion_reason"
      ? payload.characterTone
      : undefined);

  if (!emotionTone) return payload;

  return {
    ...payload,
    nextSessionMemory: {
      ...(payload.nextSessionMemory ?? {}),
      ...(payload.scenario ? { lastScenario: payload.scenario } : {}),
      ...(payload.characterTone
        ? { lastCharacterTone: payload.characterTone }
        : {}),
      lastEmotionTone: emotionTone,
    },
    nextProfileMemory: {
      ...(payload.nextProfileMemory ?? {}),
      lastEmotionTone: emotionTone,
    },
  };
}

export function createMobileChatResponder<
  TSchift,
  TRun extends WorkflowRunLike,
>(deps: {
  getSchiftClient: () => TSchift | null;
  runSchiftWorkflow: (input: {
    schift: TSchift;
    workflowId?: string;
    inputs: {
      query: string;
      retrievalQuery: string;
      currentWeek: number | null;
      sessionId: string;
      hasImages: boolean;
      compactSummary: string | null;
      currentStage: string | null;
      currentTurnStage: string | null;
      compressedLog: string | null;
      stageContext: string | null;
      lastScenario: string | null;
      lastCharacterTone: string | null;
      lastEmotionTone: string | null;
      workflowVersion: number | null;
      workflowStage: string | number | null;
      workflowStageName: string | null;
      selectedQuestionId: string | null;
      sessionMoodId: string | null;
      sessionMoodLabel: string | null;
      requiredToneContext: string | null;
      personaHint: string | null;
      personaConfidence: string | null;
      tonePreference: string | null;
      results: string | null;
      weekKnowledgeEntityId: string | null;
      promptItems: string | null;
      currentAttachmentQuestionId: unknown;
      answeredQuestionIds: unknown;
      answeredCount: number;
      dailyQuestionQuota: number;
    };
  }) => Promise<{
    run: TRun;
  }>;
  extractSchiftWorkflowOutputs: (
    run: TRun,
  ) => Record<string, unknown> | undefined;
  formatSchiftWorkflowRun: (run: TRun) => string;
  loadCharacterImages: () => Promise<Record<string, string | null>>;
  loadRagContext?: (input: {
    query: string;
    currentWeek: number | null;
  }) => Promise<RagContextResult>;
  /**
   * stage 기반으로 호출할 Schift workflow ID 를 고른다.
   * 반환 값이 있으면 해당 ID 로 호출, 없으면 기본 resolveSchiftWorkflowId 로직 (name 매칭).
   */
  selectWorkflowId?: (input: {
    query: string;
    workflowStage: string | number | null;
    currentAttachmentQuestionId: string | null;
    lastScenario: string | null;
    compactSummary: string | null;
  }) => string | null | undefined;
  ragContext?: string;
  weekKnowledgeEntityId?: string | null;
}) {
  return async function respond(input: {
    userId: string;
    promptContext: PromptContext | null;
    alreadyPromptedIds?: {
      checklistIds: Set<string>;
      questionIds: Set<string>;
    };
    currentWeek: number | null;
    normalizedSessionId: string;
    text: string;
    selectedQuestionId?: string | null;
    imageDataUris: string[];
    hardGuardrailReason: string | null;
  }): Promise<{
    assistantMessage: ChatMessage;
    workflowMemoryPayload: WorkflowAssistantPayload | null;
  }> {
    const promptItems = formatPromptItemsForWorkflow({
      promptContext: input.promptContext,
      alreadyPromptedIds: input.alreadyPromptedIds ?? null,
    });
    const compressedLog = formatCompressedLogForWorkflow(input.promptContext);
    const memoryContext = {
      compactSummary:
        input.promptContext?.sessionMemory?.compactSummary ?? null,
      lastScenario: input.promptContext?.sessionMemory?.lastScenario ?? null,
      lastCharacterTone:
        input.promptContext?.sessionMemory?.lastCharacterTone ?? null,
      lastEmotionTone: pickLatestEmotionTone({
        sessionMemory: input.promptContext?.sessionMemory ?? null,
        profileMemory: input.promptContext?.profileMemory ?? null,
      }),
      personaHint: input.promptContext?.profileMemory?.personaHint ?? null,
      personaConfidence:
        input.promptContext?.profileMemory?.personaConfidence ?? null,
      tonePreference: input.promptContext?.tonePreference ?? null,
      workflowVersion:
        input.promptContext?.sessionMemory?.workflowVersion ?? null,
      workflowStage: input.promptContext?.sessionMemory?.stage ?? null,
      workflowStageName: input.promptContext?.sessionMemory?.stageName ?? null,
      sessionMoodId: input.promptContext?.sessionMemory?.moodId ?? null,
      sessionMoodLabel: input.promptContext?.sessionMemory?.moodLabel ?? null,
      ragContext: input.promptContext?.sessionMemory?.ragContext ?? null,
      ragContextWeek:
        input.promptContext?.sessionMemory?.ragContextWeek ?? null,
    };
    const currentStage = memoryContext.lastScenario;
    const currentTurnStage = isQuestionChoiceTurn({
      promptContext: input.promptContext,
      lastScenario: currentStage,
      userText: input.text,
    })
      ? "stage=2/question-choice"
      : memoryContext.workflowStage !== null &&
          memoryContext.workflowStage !== undefined
        ? `stage=${memoryContext.workflowStage}/${memoryContext.workflowStageName ?? "active"}`
        : null;
    const baseToneContext = buildRequiredToneContext({
      lastEmotionTone: memoryContext.lastEmotionTone,
      tonePreference: memoryContext.tonePreference,
    });
    const moodVariantSuffix = await resolveMoodVariantSuffix({
      scenario: memoryContext.lastScenario,
      mood:
        memoryContext.lastEmotionTone ??
        memoryContext.lastCharacterTone ??
        null,
    });
    const requiredToneContext = [
      baseToneContext,
      memoryContext.sessionMoodLabel
        ? `세션 기분: ${memoryContext.sessionMoodLabel}`
        : null,
      moodVariantSuffix ? `감정 맞춤 안내: ${moodVariantSuffix}` : null,
    ]
      .filter(Boolean)
      .join("\n");
    const baseStageContext = buildStageContext({
      compactSummary: memoryContext.compactSummary,
      currentStage,
      currentTurnStage,
      userText: input.text,
    });
    const stageContext = [
      memoryContext.workflowVersion === 2 ? "workflow_version=2" : null,
      baseStageContext,
    ]
      .filter(Boolean)
      .join("\n");
    const retrievalQuery = [
      input.currentWeek ? `현재 임신 주수 ${input.currentWeek}주` : null,
      input.text,
      memoryContext.lastScenario
        ? `최근 상담 분기 ${memoryContext.lastScenario}`
        : null,
      memoryContext.compactSummary
        ? `최근 대화 맥락 ${memoryContext.compactSummary}`
        : null,
    ]
      .filter((value): value is string => Boolean(value && value.trim()))
      .join("\n");

    const schift = deps.getSchiftClient();
    return resolveAssistantResponse({
      hardGuardrailReason: input.hardGuardrailReason,
      workflowEnabled: Boolean(schift),
      runWorkflow: async () => {
        if (!schift) {
          throw new Error("Schift client is unavailable");
        }

        const cachedRagContext =
          memoryContext.ragContext?.trim() &&
          (!memoryContext.ragContextWeek ||
            !input.currentWeek ||
            memoryContext.ragContextWeek === input.currentWeek)
            ? { context: memoryContext.ragContext, sources: [] }
            : null;
        const loadedRagContext = deps.ragContext?.trim()
          ? { context: deps.ragContext, sources: [] }
          : (cachedRagContext ??
            (deps.loadRagContext &&
            shouldLoadRagContext({
              userText: input.text,
              currentStage,
              currentTurnStage,
              workflowStage: memoryContext.workflowStage,
            })
              ? await deps.loadRagContext({
                  query: input.text,
                  currentWeek: input.currentWeek,
                })
              : null));

        const selectedWorkflowId = deps.selectWorkflowId?.({
          query: input.text,
          workflowStage: memoryContext.workflowStage,
          currentAttachmentQuestionId:
            ((
              input.promptContext?.sessionMemory as unknown as Record<
                string,
                unknown
              >
            )?.currentAttachmentQuestionId as string | null) ?? null,
          lastScenario: memoryContext.lastScenario,
          compactSummary: memoryContext.compactSummary,
        });
        console.info(
          [
            "[mobile-chat-workflow]",
            "event=run_start",
            `workflowId=${selectedWorkflowId ?? "auto"}`,
            `sessionId=${input.normalizedSessionId}`,
            `stage=${memoryContext.workflowStage ?? "null"}`,
            `stageName=${memoryContext.workflowStageName ?? "null"}`,
            `lastScenario=${memoryContext.lastScenario ?? "null"}`,
            `turnStage=${currentTurnStage ?? "null"}`,
            `hasRag=${loadedRagContext?.context.trim() ? "true" : "false"}`,
          ].join(" "),
        );
        const { run } = await deps.runSchiftWorkflow({
          schift,
          ...(selectedWorkflowId ? { workflowId: selectedWorkflowId } : {}),
          inputs: {
            query: input.text,
            retrievalQuery,
            currentWeek: input.currentWeek,
            sessionId: input.normalizedSessionId,
            hasImages: input.imageDataUris.length > 0,
            compactSummary: memoryContext.compactSummary,
            currentStage,
            currentTurnStage,
            compressedLog: compressedLog || null,
            stageContext: stageContext || null,
            lastScenario: memoryContext.lastScenario,
            lastCharacterTone: memoryContext.lastCharacterTone,
            lastEmotionTone: memoryContext.lastEmotionTone,
            workflowVersion: memoryContext.workflowVersion,
            workflowStage: memoryContext.workflowStage,
            workflowStageName: memoryContext.workflowStageName,
            selectedQuestionId: input.selectedQuestionId?.trim() || null,
            currentAttachmentQuestionId:
              (
                input.promptContext?.sessionMemory as unknown as Record<
                  string,
                  unknown
                >
              )?.currentAttachmentQuestionId ?? null,
            answeredQuestionIds:
              (
                input.promptContext?.sessionMemory as unknown as Record<
                  string,
                  unknown
                >
              )?.answeredQuestionIds ?? [],
            answeredCount: Array.isArray(
              (
                input.promptContext?.sessionMemory as unknown as Record<
                  string,
                  unknown
                >
              )?.answeredQuestionIds,
            )
              ? (
                  (
                    input.promptContext?.sessionMemory as unknown as Record<
                      string,
                      unknown
                    >
                  ).answeredQuestionIds as unknown[]
                ).length
              : 0,
            dailyQuestionQuota: 3,
            sessionMoodId: memoryContext.sessionMoodId,
            sessionMoodLabel: memoryContext.sessionMoodLabel,
            requiredToneContext: requiredToneContext || null,
            personaHint: memoryContext.personaHint,
            personaConfidence: memoryContext.personaConfidence,
            tonePreference: memoryContext.tonePreference,
            results: loadedRagContext?.context.trim() || null,
            weekKnowledgeEntityId: deps.weekKnowledgeEntityId?.trim() || null,
            promptItems: promptItems || null,
          },
        });

        if (run.status !== "completed" || run.error) {
          throw new Error(
            `Schift workflow run failed: ${run.error ?? run.status}`,
          );
        }

        const workflowOutputs = deps.extractSchiftWorkflowOutputs(run);
        console.info(
          [
            "[mobile-chat-workflow]",
            "event=run_done",
            `workflowId=${selectedWorkflowId ?? "auto"}`,
            `sessionId=${input.normalizedSessionId}`,
            `status=${run.status}`,
            `outputKeys=${Object.keys(workflowOutputs ?? {}).join(",") || "-"}`,
          ].join(" "),
        );
        const workflowPayload = normalizeWorkflowMemoryPayload(
          parseWorkflowAssistantPayload(workflowOutputs),
        );
        if (
          workflowPayload &&
          loadedRagContext?.context.trim() &&
          loadedRagContext !== cachedRagContext
        ) {
          workflowPayload.nextSessionMemory = {
            ...(workflowPayload?.nextSessionMemory ?? {}),
            ragContext: loadedRagContext.context.trim().slice(0, 6000),
            ragContextWeek: input.currentWeek,
          };
        }
        const structuredWorkflowMessage = await buildWorkflowAssistantMessage({
          run,
          loadCharacterImages: deps.loadCharacterImages,
          extractOutputs: deps.extractSchiftWorkflowOutputs,
          currentWeek: input.currentWeek,
        });
        const workflowText = deps.formatSchiftWorkflowRun(run);
        const isEmptyWorkflowOutput =
          !workflowOutputs ||
          Object.keys(workflowOutputs).length === 0 ||
          workflowText === "답변: {}" ||
          workflowText === "답변: workflow 출력이 없어요.";

        if (isEmptyWorkflowOutput || !structuredWorkflowMessage) {
          throw new Error(
            isEmptyWorkflowOutput
              ? "Schift workflow returned empty output"
              : "Schift workflow returned unstructured output",
          );
        }

        const normalized = normalizeLetterFollowUpFlow(
          normalizeStageContractFlow({
            assistantMessage: structuredWorkflowMessage,
            workflowMemoryPayload: workflowPayload,
            currentWeek: input.currentWeek,
            userText: input.text,
            promptContext: input.promptContext,
          }),
        );
        if (loadedRagContext?.sources?.length) {
          normalized.assistantMessage.parts.push({
            type: "_rag_sources",
            id: `rag-sources-${Date.now()}`,
            sources: loadedRagContext.sources,
          } as unknown as (typeof normalized.assistantMessage.parts)[number]);
        }

        return {
          assistantMessage: normalized.assistantMessage,
          workflowMemoryPayload: normalized.workflowMemoryPayload,
        };
      },
    });
  };
}
