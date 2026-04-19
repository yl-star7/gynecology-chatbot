import type { ChatMessage } from "@gynecology-chatbot/app-core";

import type {
  ChecklistRow,
  PromptContext,
  QuestionRow,
} from "./chat-repository";
import type { PromptFollowUpResult } from "./follow-ups";
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
  }) => Promise<{ answeredCount: number }>;
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
  decorateAssistantMessage?: (message: ChatMessage) => ChatMessage;
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
  dispatchPersonaSignalWebhook?: (input: {
    userId: string;
    sessionId: string;
    sourceMessageId: string | null;
    nextProfileMemory: ProfileMemoryPayload | null | undefined;
    idempotencyKey: string;
  }) => Promise<void>;
  buildFollowUps: (input: {
    week: PromptContext["week"];
    dayContent: PromptContext["dayContent"];
    checklists: PromptContext["checklists"];
    questions: PromptContext["questions"];
    excludeChecklistIds?: Set<string>;
    excludeQuestionIds?: Set<string>;
  }) => PromptFollowUpResult | Promise<PromptFollowUpResult>;
  createPromptEvents: (input: {
    userId: string;
    sessionId: string;
    assistantMessageId: string | null;
    checklists: ChecklistRow[];
    questions: QuestionRow[];
  }) => Promise<void>;
  getAlreadyPromptedIds: (input: {
    userId: string;
  }) => Promise<{ checklistIds: Set<string>; questionIds: Set<string> }>;
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
    const { answeredCount } = await deps.markOutstandingPromptEventsAnswered({
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

    if (deps.decorateAssistantMessage) {
      const decoratedMessage = deps.decorateAssistantMessage(assistantMessage);
      assistantMessage.parts = decoratedMessage.parts;
    }
    assistantMessage.parts = sanitizeChatParts(assistantMessage.parts);

    const assistantMessages: ChatMessage[] = [assistantMessage];

    let followUpChecklists: ChecklistRow[] = [];
    let followUpQuestions: QuestionRow[] = [];

    if (promptContext && answeredCount === 0) {
      const alreadyPrompted = await deps.getAlreadyPromptedIds({
        userId: input.userId,
      });
      const followUpResult = await deps.buildFollowUps({
        week: promptContext.week,
        dayContent: promptContext.dayContent,
        checklists: promptContext.checklists,
        questions: promptContext.questions,
        excludeChecklistIds: alreadyPrompted.checklistIds,
        excludeQuestionIds: alreadyPrompted.questionIds,
      });
      for (const msg of followUpResult.messages) {
        assistantMessages.push(msg as ChatMessage);
      }
      followUpChecklists = followUpResult.selectedChecklists;
      followUpQuestions = followUpResult.selectedQuestions;
    }

    const savedIds = await deps.saveAssistantMessages({
      sessionId,
      userId: input.userId,
      messages: assistantMessages,
    });

    if (followUpChecklists.length > 0 || followUpQuestions.length > 0) {
      const followUpMessageId =
        savedIds.length > 1 ? savedIds[savedIds.length - 1].id : null;
      await deps.createPromptEvents({
        userId: input.userId,
        sessionId,
        assistantMessageId: followUpMessageId,
        checklists: followUpChecklists,
        questions: followUpQuestions,
      });
    }

    const assistantMessageAt = new Date().toISOString();
    await deps.updateSessionMemory(
      sessionId,
      workflowMemoryPayload?.nextSessionMemory,
      assistantMessageAt,
    );
    if (workflowMemoryPayload?.nextProfileMemory) {
      const sourceMessageId = savedIds[0]?.id ?? null;
      await deps.updateProfileMemory(
        input.userId,
        promptContext?.onboardingPayload ?? null,
        promptContext?.profileMemory ?? null,
        workflowMemoryPayload.nextProfileMemory,
        assistantMessageAt,
      );
      await deps.dispatchPersonaSignalWebhook?.({
        userId: input.userId,
        sessionId,
        sourceMessageId,
        nextProfileMemory: workflowMemoryPayload.nextProfileMemory,
        idempotencyKey: [
          sessionId,
          sourceMessageId ?? "",
          workflowMemoryPayload.nextProfileMemory.personaHint ?? "",
          workflowMemoryPayload.nextProfileMemory.personaConfidence ?? "",
        ].join(":"),
      });
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
