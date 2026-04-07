import type { ChatMessage } from "@gynecology-chatbot/app-core";

import type { PromptContext } from "./chat-repository";
import type {
  ProfileMemoryPayload,
  SessionMemoryPayload,
} from "@/lib/mobile/chat/workflow-payload";
import { sanitizeChatParts } from "@/lib/mobile/chat/sanitizers";
import type { WorkflowAssistantPayload } from "@/lib/mobile/chat/workflow-payload";

export function buildChatOrchestrator(deps: {
  ensureSession: (input: {
    userId: string;
    sessionId: string;
    title: string;
  }) => Promise<{ sessionId: string }>;
  saveUserMessage: (input: {
    sessionId: string;
    userId: string;
    text: string;
    imageDataUris: string[];
  }) => Promise<{ id: string | null }>;
  touchSessionActivity: (sessionId: string, timestamp: string) => Promise<void>;
  recordUserAction: (input: {
    userId: string;
    sessionId: string;
    messageId: string | null;
    pregnancyWeek: number | null;
    imageCount: number;
    textPreview: string;
  }) => Promise<void>;
  markOutstandingPromptEventsAnswered: (input: {
    userId: string;
    sessionId: string;
    userMessageId: string | null;
    userMessageText: string;
  }) => Promise<void>;
  getPromptContext: (
    userId: string,
    pregnancyWeek: number | null,
    sessionId: string,
  ) => Promise<PromptContext | null>;
  resolveAssistantResponse: (input: {
    promptContext: PromptContext | null;
    currentWeek: number | null;
    normalizedSessionId: string;
    text: string;
    imageDataUris: string[];
    hardGuardrailReason: string | null;
  }) => Promise<{
    assistantMessage: ChatMessage;
    workflowMemoryPayload: WorkflowAssistantPayload | null;
  }>;
  saveAssistantMessages: (input: {
    sessionId: string;
    userId: string;
    messages: ChatMessage[];
  }) => Promise<Array<{ id: string }>>;
  updateSessionMemory: (
    sessionId: string,
    nextSessionMemory: SessionMemoryPayload | null | undefined,
    timestamp: string,
  ) => Promise<void>;
  updateProfileMemory: (
    userId: string,
    onboardingPayload: PromptContext["onboardingPayload"],
    currentProfileMemory: ProfileMemoryPayload | null,
    nextProfileMemory: ProfileMemoryPayload | null | undefined,
    timestamp: string,
  ) => Promise<void>;
}) {
  return async function orchestrate(input: {
    userId: string;
    text: string;
    sessionId: string;
    pregnancyWeek: number | null;
    imageDataUris: string[];
    hardGuardrailReason: string | null;
  }) {
    const { sessionId } = await deps.ensureSession({
      userId: input.userId,
      sessionId: input.sessionId,
      title: input.text.slice(0, 40) || "새 상담",
    });

    const userMessage = await deps.saveUserMessage({
      sessionId,
      userId: input.userId,
      text: input.text,
      imageDataUris: input.imageDataUris,
    });
    const userMessageAt = new Date().toISOString();

    await deps.touchSessionActivity(sessionId, userMessageAt);
    await deps.recordUserAction({
      userId: input.userId,
      sessionId,
      messageId: userMessage.id,
      pregnancyWeek: input.pregnancyWeek,
      imageCount: input.imageDataUris.length,
      textPreview: input.text.slice(0, 120),
    });
    await deps.markOutstandingPromptEventsAnswered({
      userId: input.userId,
      sessionId,
      userMessageId: userMessage.id,
      userMessageText: input.text,
    });

    const promptContext = await deps.getPromptContext(
      input.userId,
      input.pregnancyWeek,
      sessionId,
    );
    const currentWeek = promptContext?.pregnancyWeek ?? input.pregnancyWeek;

    const { assistantMessage, workflowMemoryPayload } =
      await deps.resolveAssistantResponse({
        promptContext,
        currentWeek,
        normalizedSessionId: sessionId,
        text: input.text,
        imageDataUris: input.imageDataUris,
        hardGuardrailReason: input.hardGuardrailReason,
      });

    assistantMessage.parts = sanitizeChatParts(assistantMessage.parts);

    const assistantMessages: ChatMessage[] = [assistantMessage];

    await deps.saveAssistantMessages({
      sessionId,
      userId: input.userId,
      messages: assistantMessages,
    });

    const assistantMessageAt = new Date().toISOString();
    await deps.updateSessionMemory(
      sessionId,
      workflowMemoryPayload?.nextSessionMemory,
      assistantMessageAt,
    );
    if (workflowMemoryPayload?.nextProfileMemory) {
      await deps.updateProfileMemory(
        input.userId,
        promptContext?.onboardingPayload ?? null,
        promptContext?.profileMemory ?? null,
        workflowMemoryPayload.nextProfileMemory,
        assistantMessageAt,
      );
    }

    return {
      assistantMessage,
      assistantMessages,
      sessionId,
      workflowMemoryPayload,
      promptContext,
    };
  };
}
