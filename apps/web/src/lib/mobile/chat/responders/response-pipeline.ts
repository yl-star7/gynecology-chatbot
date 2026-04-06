import type { ChatMessage } from "@gynecology-chatbot/app-core";

import type { WorkflowAssistantPayload } from "@/lib/mobile/chat/workflow-payload";

export async function resolveAssistantResponse(input: {
  hardGuardrailReason: string | null;
  workflowEnabled: boolean;
  runWorkflow: () => Promise<{
    assistantMessage: ChatMessage;
    workflowMemoryPayload: WorkflowAssistantPayload | null;
  }>;
  runFallback: () => Promise<ChatMessage>;
}): Promise<{
  assistantMessage: ChatMessage;
  workflowMemoryPayload: WorkflowAssistantPayload | null;
}> {
  if (input.hardGuardrailReason) {
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
    try {
      return await input.runWorkflow();
    } catch {
      return {
        assistantMessage: await input.runFallback(),
        workflowMemoryPayload: null,
      };
    }
  }

  return {
    assistantMessage: await input.runFallback(),
    workflowMemoryPayload: null,
  };
}
