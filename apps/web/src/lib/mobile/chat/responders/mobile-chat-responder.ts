import type { ChatMessage } from "@gynecology-chatbot/app-core";

import type { PromptContext } from "@/lib/mobile/chat/chat-repository";
import { resolveAssistantResponse } from "@/lib/mobile/chat/responders/response-pipeline";
import {
  buildMemorySystemBlock,
  buildWorkflowAssistantMessage,
  pickLatestEmotionTone,
} from "@/lib/mobile/chat/responders/route-response-helpers";
import { parseWorkflowAssistantPayload, type WorkflowAssistantPayload } from "@/lib/mobile/chat/workflow-payload";

export function createMobileChatResponder(deps: {
  getSchiftClient: () => unknown;
  runSchiftWorkflow: (input: {
    schift: unknown;
    inputs: {
      query: string;
      currentWeek: number | null;
      sessionId: string;
      hasImages: boolean;
      compactSummary: string | null;
      lastScenario: string | null;
      lastCharacterTone: string | null;
      lastEmotionTone: string | null;
      tonePreference: string | null;
    };
  }) => Promise<{
    run: {
      status: string;
      error?: string;
      outputs?: Record<string, unknown>;
      block_states?: unknown;
    };
  }>;
  extractSchiftWorkflowOutputs: (run: {
    outputs?: Record<string, unknown>;
  }) => Record<string, unknown> | undefined;
  formatSchiftWorkflowRun: (run: {
    outputs?: Record<string, unknown>;
    block_states?: unknown;
  }) => string;
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
      tonePreference: input.promptContext?.tonePreference ?? null,
    };
    const memorySystemBlock = buildMemorySystemBlock(memoryContext);
    const schift = deps.getSchiftClient();

    return resolveAssistantResponse({
      hardGuardrailReason: input.hardGuardrailReason,
      workflowEnabled: Boolean(schift),
      runWorkflow: async () => {
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

        if (isEmptyWorkflowOutput) {
          throw new Error("Schift workflow returned empty output");
        }

        return {
          assistantMessage:
            structuredWorkflowMessage ?? {
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
            },
          workflowMemoryPayload: workflowPayload,
        };
      },
      runFallback: async () =>
        deps.runFallbackModel({
          text: input.text,
          currentWeek: input.currentWeek,
          normalizedSessionId: input.normalizedSessionId,
          imageDataUris: input.imageDataUris,
          memorySystemBlock,
          workflowEnabled: Boolean(schift),
        }),
    });
  };
}
