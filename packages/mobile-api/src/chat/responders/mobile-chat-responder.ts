import type { ChatMessage } from "@gynecology-chatbot/app-core";

import type { PromptContext } from "../chat-repository";
import { resolveAssistantResponse } from "./response-pipeline";
import {
  buildWorkflowAssistantMessage,
  pickLatestEmotionTone,
} from "./route-response-helpers";
import {
  parseWorkflowAssistantPayload,
  type WorkflowAssistantPayload,
} from "../workflow-payload";

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
    if (isLetterFlow && !/[?？]$/.test(textPart.text.trim())) {
      textPart.text = `${textPart.text.trim()}\n\n지금 편지를 쓰면서 가장 크게 남은 마음은 무엇이었나요?`;
    }
    if (
      isDailyFollowup &&
      !/(태동|몸|하루).*[?？]$/.test(textPart.text.trim())
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
    /아기|태아|발달|성장/.test(input.userText) &&
    /볼래|알려|궁금|네|확인/.test(input.userText);

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
      input.assistantMessage.parts = [
        {
          type: "text",
          id: `workflow-baby-info-${Date.now()}`,
          text: `${weekLabel} 아기 소식이에요.\n\n${body}\n\n엄마 몸 변화도 이어서 볼까요?`,
        },
        {
          type: "quickReplies",
          id: `workflow-baby-info-quick-${Date.now()}`,
          choices: [
            {
              id: "baby-info-mother-yes",
              label: "네",
              message: "네, 엄마 변화도 알려주세요.",
            },
            {
              id: "baby-info-mother-later",
              label: "이따가요",
              message: "아니요, 이따가 확인할래요.",
            },
          ],
        },
      ];
      input.workflowMemoryPayload!.scenario = "baby_info";
      input.workflowMemoryPayload!.nextSessionMemory = {
        ...(input.workflowMemoryPayload?.nextSessionMemory ?? {}),
        compactSummary: "현재 단계: 태아 발달 안내 완료",
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
      {
        type: "quickReplies",
        id: `workflow-baby-info-offer-quick-${Date.now()}`,
        choices: [
          {
            id: "baby-info-offer-yes",
            label: "네",
            message: "아기 발달 정보를 볼래요.",
          },
          {
            id: "baby-info-offer-later",
            label: "이따가요",
            message: "아니요, 이따가 확인할래요.",
          },
        ],
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
      const questions = [
        "오늘 아기에게 가장 먼저 들려주고 싶은 말은 무엇인가요?",
        "요즘 아기가 어떤 순간에 엄마 마음을 느낄 것 같나요?",
      ];
      input.assistantMessage.parts = [
        {
          type: "text",
          id: `workflow-attachment-question-${Date.now()}`,
          text: [
            "오늘 해본 만큼으로도 충분해요. 이제 아기와 마음을 이어볼 질문을 골라보세요.",
            "",
            `- ${questions[0]}`,
            `- ${questions[1]}`,
          ].join("\n"),
        },
        {
          type: "quickReplies",
          id: `workflow-attachment-question-quick-${Date.now()}`,
          choices: questions.map((question, index) => ({
            id: `attachment-question-${index + 1}`,
            label: question,
            message: question,
          })),
        },
      ];
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

function formatPromptItemsForWorkflow(input: {
  promptContext: PromptContext | null;
  alreadyPromptedIds: {
    checklistIds: Set<string>;
    questionIds: Set<string>;
  };
}) {
  if (!input.promptContext) {
    return "";
  }

  const checklists = input.promptContext.checklists
    .filter((item) => !input.alreadyPromptedIds.checklistIds.has(item.id))
    .slice(0, 3)
    .map((item, index) => {
      const description = item.description?.trim()
        ? ` - ${item.description.trim()}`
        : "";
      return `${index + 1}. [${item.id}] ${item.title.trim()}${description}`;
    });

  const questions = input.promptContext.questions
    .filter((item) => !input.alreadyPromptedIds.questionIds.has(item.id))
    .slice(0, 2)
    .map(
      (item, index) =>
        `${index + 1}. [${item.id}] ${item.question_text.trim()}${
          item.help_text?.trim() ? ` - ${item.help_text.trim()}` : ""
        }`,
    );

  return [
    checklists.length > 0
      ? `오늘 체크리스트 후보:\n${checklists.join("\n")}`
      : "오늘 체크리스트 후보: 없음",
    questions.length > 0
      ? `오늘 모아애착 질문 후보:\n${questions.join("\n")}`
      : "오늘 모아애착 질문 후보: 없음",
  ].join("\n\n");
}

export function createMobileChatResponder<
  TSchift,
  TRun extends WorkflowRunLike,
>(deps: {
  getSchiftClient: () => TSchift | null;
  runSchiftWorkflow: (input: {
    schift: TSchift;
    inputs: {
      query: string;
      retrievalQuery: string;
      currentWeek: number | null;
      sessionId: string;
      hasImages: boolean;
      compactSummary: string | null;
      lastScenario: string | null;
      lastCharacterTone: string | null;
      lastEmotionTone: string | null;
      personaHint: string | null;
      personaConfidence: string | null;
      tonePreference: string | null;
      results: string | null;
      weekKnowledgeEntityId: string | null;
      promptItems: string | null;
    };
  }) => Promise<{
    run: TRun;
  }>;
  extractSchiftWorkflowOutputs: (
    run: TRun,
  ) => Record<string, unknown> | undefined;
  formatSchiftWorkflowRun: (run: TRun) => string;
  loadCharacterImages: () => Promise<Record<string, string | null>>;
  ragContext?: string;
  weekKnowledgeEntityId?: string | null;
}) {
  return async function respond(input: {
    userId: string;
    promptContext: PromptContext | null;
    alreadyPromptedIds: {
      checklistIds: Set<string>;
      questionIds: Set<string>;
    };
    currentWeek: number | null;
    normalizedSessionId: string;
    text: string;
    imageDataUris: string[];
    hardGuardrailReason: string | null;
  }): Promise<{
    assistantMessage: ChatMessage;
    workflowMemoryPayload: WorkflowAssistantPayload | null;
  }> {
    const promptItems = formatPromptItemsForWorkflow({
      promptContext: input.promptContext,
      alreadyPromptedIds: input.alreadyPromptedIds,
    });
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
    };
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

        const { run } = await deps.runSchiftWorkflow({
          schift,
          inputs: {
            query: input.text,
            retrievalQuery,
            currentWeek: input.currentWeek,
            sessionId: input.normalizedSessionId,
            hasImages: input.imageDataUris.length > 0,
            compactSummary: memoryContext.compactSummary,
            lastScenario: memoryContext.lastScenario,
            lastCharacterTone: memoryContext.lastCharacterTone,
            lastEmotionTone: memoryContext.lastEmotionTone,
            personaHint: memoryContext.personaHint,
            personaConfidence: memoryContext.personaConfidence,
            tonePreference: memoryContext.tonePreference,
            results: deps.ragContext?.trim() || null,
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
        const workflowPayload = parseWorkflowAssistantPayload(workflowOutputs);
        const structuredWorkflowMessage = await buildWorkflowAssistantMessage({
          run,
          loadCharacterImages: deps.loadCharacterImages,
          extractOutputs: deps.extractSchiftWorkflowOutputs,
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

        return {
          assistantMessage: normalized.assistantMessage,
          workflowMemoryPayload: normalized.workflowMemoryPayload,
        };
      },
    });
  };
}
