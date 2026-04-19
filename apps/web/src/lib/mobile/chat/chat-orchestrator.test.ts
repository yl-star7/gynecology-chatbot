import type { ChatMessage } from "@gynecology-chatbot/app-core";

import { buildChatOrchestrator } from "./chat-orchestrator";
import type { PromptContext } from "./chat-repository";

describe("chat orchestrator", () => {
  it("creates follow-up messages and persists prompt events for selected questions", async () => {
    const promptContext: PromptContext = {
      pregnancyWeek: 13,
      dayNumber: 1,
      week: {
        id: "week-13",
        week_number: 13,
        title: "13주차",
        baby_summary: null,
        mother_summary: null,
        warning_signs: null,
        recommended_actions: null,
        checklist_intro: "오늘 할 일",
        question_intro: "생각해볼 질문",
        status: "published",
      },
      dayContent: null,
      checklists: [
        {
          id: "check-1",
          code: "drink-water",
          title: "수분 섭취 체크",
          description: null,
          checklist_payload: null,
          display_order: 1,
          is_required: true,
        },
      ],
      questions: [
        {
          id: "question-1",
          code: "main-concern",
          question_text: "오늘 가장 걱정되는 점은 무엇인가요?",
          question_type: "text",
          help_text: null,
          question_payload: {},
          display_order: 1,
          is_required: true,
        },
      ],
      tonePreference: null,
      profileMemory: null,
      sessionMemory: null,
      onboardingPayload: null,
      missingFields: [],
    };

    const saveAssistantMessages = jest
      .fn()
      .mockResolvedValue([
        { id: "assistant-main" },
        { id: "assistant-followup" },
      ]);
    const updateSession = jest.fn().mockResolvedValue(undefined);
    const updateProfile = jest.fn().mockResolvedValue(undefined);
    const dispatchPersonaSignalWebhook = jest
      .fn()
      .mockResolvedValue(undefined);

    const orchestrator = buildChatOrchestrator({
      ensureSession: jest.fn().mockResolvedValue({ sessionId: "session-1" }),
      saveUserMessage: jest.fn().mockResolvedValue({ id: "user-message-1" }),
      touchSessionActivity: jest.fn().mockResolvedValue(undefined),
      recordUserAction: jest.fn().mockResolvedValue(undefined),
      markOutstandingPromptEventsAnswered: jest
        .fn()
        .mockResolvedValue({ answeredCount: 0 }),
      getPromptContext: jest.fn().mockResolvedValue(promptContext),
      resolveAssistantResponse: jest.fn().mockResolvedValue({
        assistantMessage: {
          id: "assistant-1",
          role: "assistant",
          createdAtLabel: "방금 전",
          parts: [
            {
              type: "text",
              id: "text-1",
              text: "오늘 가장 걱정되는 점은 무엇인가요? 일단 휴식하세요.",
            },
          ],
        } as ChatMessage,
        workflowMemoryPayload: {
          nextSessionMemory: { compactSummary: "요약" },
        },
      }),
      saveAssistantMessages,
      updateSessionMemory: updateSession,
      updateProfileMemory: updateProfile,
      dispatchPersonaSignalWebhook,
      buildFollowUps: jest.fn().mockReturnValue({
        messages: [],
        selectedChecklists: [],
        selectedQuestions: [],
      }),
      createPromptEvents: jest.fn().mockResolvedValue(undefined),
      getAlreadyPromptedIds: jest.fn().mockResolvedValue({
        checklistIds: new Set<string>(),
        questionIds: new Set<string>(),
      }),
    });

    const result = await orchestrator({
      userId: "user-1",
      text: "배가 아파요",
      sessionId: "session-1",
      pregnancyWeek: 13,
      imageDataUris: [],
      hardGuardrailReason: null,
    });

    expect(result.assistantMessages).toHaveLength(1);
    expect(saveAssistantMessages).toHaveBeenCalled();
    expect(updateSession).toHaveBeenCalledWith(
      "session-1",
      expect.objectContaining({ compactSummary: "요약" }),
      expect.any(String),
    );
    expect(updateProfile).not.toHaveBeenCalled();
    expect(dispatchPersonaSignalWebhook).not.toHaveBeenCalled();
  });

  it("dispatches persona memory through the webhook hook after assistant save", async () => {
    const promptContext = {
      pregnancyWeek: 13,
      dayNumber: 1,
      week: {
        id: "week-13",
        week_number: 13,
        title: "13주차",
        baby_summary: null,
        mother_summary: null,
        warning_signs: null,
        recommended_actions: null,
        checklist_intro: null,
        question_intro: null,
        status: "published",
      },
      dayContent: null,
      checklists: [],
      questions: [],
      tonePreference: null,
      profileMemory: null,
      sessionMemory: null,
      onboardingPayload: null,
      missingFields: [],
    } satisfies PromptContext;
    const updateProfile = jest.fn().mockResolvedValue(undefined);
    const dispatchPersonaSignalWebhook = jest
      .fn()
      .mockResolvedValue(undefined);

    const orchestrator = buildChatOrchestrator({
      ensureSession: jest.fn().mockResolvedValue({ sessionId: "session-1" }),
      saveUserMessage: jest.fn().mockResolvedValue({ id: "user-message-1" }),
      touchSessionActivity: jest.fn().mockResolvedValue(undefined),
      recordUserAction: jest.fn().mockResolvedValue(undefined),
      markOutstandingPromptEventsAnswered: jest
        .fn()
        .mockResolvedValue({ answeredCount: 1 }),
      getPromptContext: jest.fn().mockResolvedValue(promptContext),
      resolveAssistantResponse: jest.fn().mockResolvedValue({
        assistantMessage: {
          id: "assistant-1",
          role: "assistant",
          createdAtLabel: "방금 전",
          parts: [{ type: "text", id: "text-1", text: "기준을 볼게요." }],
        } as ChatMessage,
        workflowMemoryPayload: {
          nextProfileMemory: {
            personaHint: "practical",
            personaConfidence: "medium",
            personaEvidence: "태동 기준을 구체적으로 질문함",
          },
        },
      }),
      saveAssistantMessages: jest
        .fn()
        .mockResolvedValue([{ id: "assistant-main" }]),
      updateSessionMemory: jest.fn().mockResolvedValue(undefined),
      updateProfileMemory: updateProfile,
      dispatchPersonaSignalWebhook,
      buildFollowUps: jest.fn().mockReturnValue({
        messages: [],
        selectedChecklists: [],
        selectedQuestions: [],
      }),
      createPromptEvents: jest.fn().mockResolvedValue(undefined),
      getAlreadyPromptedIds: jest.fn().mockResolvedValue({
        checklistIds: new Set<string>(),
        questionIds: new Set<string>(),
      }),
    });

    await orchestrator({
      userId: "user-1",
      text: "태동 기준 알려줘",
      sessionId: "session-1",
      pregnancyWeek: 13,
      imageDataUris: [],
      hardGuardrailReason: null,
    });

    expect(updateProfile).toHaveBeenCalled();
    expect(dispatchPersonaSignalWebhook).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        sessionId: "session-1",
        sourceMessageId: "assistant-main",
        nextProfileMemory: expect.objectContaining({
          personaHint: "practical",
        }),
      }),
    );
  });
});
