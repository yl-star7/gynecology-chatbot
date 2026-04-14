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
      buildFollowUps: jest.fn().mockReturnValue({
        messages: [],
        selectedChecklists: [],
        selectedQuestions: [],
      }),
      createPromptEvents: jest.fn().mockResolvedValue(undefined),
      getAlreadyPromptedIds: jest.fn().mockResolvedValue({
        checklistIds: new Set(),
        questionIds: new Set(),
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
  });
});
