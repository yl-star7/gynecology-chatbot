import type { ChatMessage } from "@gynecology-chatbot/app-core";

import type { WorkflowAssistantPayload } from "../workflow-payload";

function formatError(error: unknown) {
  return error instanceof Error
    ? { name: error.name, message: error.message }
    : { message: String(error) };
}

export async function resolveAssistantResponse(input: {
  hardGuardrailReason: string | null;
  workflowEnabled: boolean;
  runWorkflow: () => Promise<{
    assistantMessage: ChatMessage;
    workflowMemoryPayload: WorkflowAssistantPayload | null;
  }>;
  fallbackResponse?: () => Promise<{
    assistantMessage: ChatMessage;
    workflowMemoryPayload: WorkflowAssistantPayload | null;
  }>;
}): Promise<{
  assistantMessage: ChatMessage;
  workflowMemoryPayload: WorkflowAssistantPayload | null;
}> {
  if (input.hardGuardrailReason) {
    console.info("mobile chat response: hard guardrail response");
    return {
      assistantMessage: {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        createdAtLabel: "방금 전",
        parts: [
          {
            type: "text",
            id: `guardrail-${Date.now()}`,
            text: `안전 안내: ${input.hardGuardrailReason}`,
          },
          {
            type: "text",
            id: `guardrail-help-${Date.now()}`,
            text: "임신 중 몸 상태나 걱정되는 증상을 적어주시면 그 범위 안에서 다시 도와드릴게요.",
          },
        ],
      },
      workflowMemoryPayload: null,
    };
  }

  if (input.workflowEnabled) {
    console.info("mobile chat response: workflow start");
    try {
      const result = await input.runWorkflow();
      console.info("mobile chat response: workflow success");
      return result;
    } catch (error) {
      console.warn("mobile chat response: workflow failed", {
        error: formatError(error),
      });
      throw error;
    }
  }

  const error = new Error("Mobile chat workflow is unavailable");
  console.warn("mobile chat response: workflow unavailable", {
    error: formatError(error),
  });
  throw error;
}
