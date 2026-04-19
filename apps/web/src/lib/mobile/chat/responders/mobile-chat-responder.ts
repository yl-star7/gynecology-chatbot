import type { ChatMessage } from "@gynecology-chatbot/app-core";

import type { PromptContext } from "@/lib/mobile/chat/chat-repository";
import { resolveAssistantResponse } from "@/lib/mobile/chat/responders/response-pipeline";
import {
  buildLocalWorkflowFallbackReply,
  buildMemorySystemBlock,
  buildWorkflowAssistantMessage,
  pickLatestEmotionTone,
} from "@/lib/mobile/chat/responders/route-response-helpers";
import { parseWorkflowAssistantPayload, type WorkflowAssistantPayload } from "@/lib/mobile/chat/workflow-payload";

type WorkflowRunLike = {
  status: string;
  error?: string | null;
  outputs?: Record<string, unknown>;
  block_states?: unknown;
};

export function createMobileChatResponder<TSchift, TRun extends WorkflowRunLike>(deps: {
  getSchiftClient: () => TSchift | null;
  runSchiftWorkflow: (input: {
    schift: TSchift;
    inputs: {
      query: string;
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
  extractSchiftWorkflowOutputs: (run: TRun) => Record<string, unknown> | undefined;
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
      compactSummary: input.promptContext?.sessionMemory?.compactSummary ?? null,
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
          throw new Error(`Schift workflow run failed: ${run.error ?? run.status}`);
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

        return {
          assistantMessage: structuredWorkflowMessage,
          workflowMemoryPayload: workflowPayload,
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
