import type { ChatMessage } from "@gynecology-chatbot/app-core";

import type { PromptContext } from "../chat-repository";
import { resolveAssistantResponse } from "./response-pipeline";
import {
  buildLocalWorkflowFallbackReply,
  buildMemorySystemBlock,
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

type WorkflowRunLike = {
  status: string;
  error?: string | null;
  outputs?: Record<string, unknown>;
  block_states?: unknown;
};

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
    };
  }) => Promise<{
    run: TRun;
  }>;
  extractSchiftWorkflowOutputs: (
    run: TRun,
  ) => Record<string, unknown> | undefined;
  formatSchiftWorkflowRun: (run: TRun) => string;
  loadCharacterImages: () => Promise<Record<string, string | null>>;
  runFallbackModel: (input: {
    text: string;
    currentWeek: number | null;
    normalizedSessionId: string;
    imageDataUris: string[];
    memorySystemBlock: string;
    workflowEnabled: boolean;
  }) => Promise<ChatMessage>;
}) {
  return async function respond(input: {
    promptContext: PromptContext | null;
    currentWeek: number | null;
    normalizedSessionId: string;
    text: string;
    imageDataUris: string[];
    hardGuardrailReason: string | null;
  }): Promise<{
    assistantMessage: ChatMessage;
    workflowMemoryPayload: WorkflowAssistantPayload | null;
  }> {
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
    const memorySystemBlock = buildMemorySystemBlock(memoryContext);
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

        const normalized = normalizeLetterFollowUpFlow({
          assistantMessage: structuredWorkflowMessage,
          workflowMemoryPayload: workflowPayload,
        });

        return {
          assistantMessage: normalized.assistantMessage,
          workflowMemoryPayload: normalized.workflowMemoryPayload,
        };
      },
      runFallback: async () => {
        try {
          return await deps.runFallbackModel({
            text: input.text,
            currentWeek: input.currentWeek,
            normalizedSessionId: input.normalizedSessionId,
            imageDataUris: input.imageDataUris,
            memorySystemBlock,
            workflowEnabled: Boolean(schift),
          });
        } catch (error) {
          console.warn(
            "mobile chat fallback model failed; using local workflow fallback",
            error instanceof Error ? error.message : error,
          );
          return buildLocalWorkflowFallbackReply({
            currentWeek: input.currentWeek,
            text: input.text,
          });
        }
      },
    });
  };
}
