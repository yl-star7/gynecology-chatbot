jest.mock("@/lib/supabase/admin-client", () => ({
  supabaseSelect: jest.fn(),
  supabaseInsert: jest.fn(),
  supabaseUpdate: jest.fn(),
}));

import {
  createPromptEvents,
  ensureChatSession,
  getAlreadyPromptedIds,
  getPromptContext,
  markOutstandingPromptEventsAnswered,
  saveAssistantChatMessages,
  saveUserChatMessage,
  touchChatSessionActivity,
  updateProfileMemory,
  updateSessionMemory,
} from "./chat-repository";
import {
  supabaseInsert,
  supabaseSelect,
  supabaseUpdate,
} from "@/lib/supabase/admin-client";

const mockedSupabaseSelect = supabaseSelect as jest.MockedFunction<
  typeof supabaseSelect
>;
const mockedSupabaseInsert = supabaseInsert as jest.MockedFunction<
  typeof supabaseInsert
>;
const mockedSupabaseUpdate = supabaseUpdate as jest.MockedFunction<
  typeof supabaseUpdate
>;

describe("chat repository", () => {
  beforeEach(() => {
    mockedSupabaseSelect.mockReset();
    mockedSupabaseInsert.mockReset();
    mockedSupabaseUpdate.mockReset();
  });

  it("loads prompt context with session/profile memory and missing fields", async () => {
    mockedSupabaseSelect.mockImplementation((path: string) => {
      if (path.startsWith("pregnancy_profiles?")) {
        return Promise.resolve([
          {
            pregnancy_day_count: 85,
            pregnancy_week: 13,
            pregnancy_day_in_week: 1,
            baby_nickname: null,
            display_name: "사용자",
            due_date: null,
            onboarding_payload: {
              tonePreference: "차분하게",
              profileMemory: { lastEmotionTone: "anxious" },
            },
          },
        ]);
      }

      if (path.startsWith("chat_sessions?")) {
        return Promise.resolve([
          {
            id: "session-1",
            title: "새 상담",
            memory_payload: {
              compactSummary: "최근 복통 상담",
              lastScenario: "symptom_counsel",
            },
          },
        ]);
      }

      if (path.startsWith("v_user_persona_profiles?")) {
        return Promise.resolve([
          {
            user_id: "user-1",
            persona_hint: "practical",
            confidence: "medium",
            evidence_summary: "최근 검사 기준과 태동 횟수를 질문함",
            weighted_score: 3.5,
            last_observed_at: "2026-04-17T09:00:00.000Z",
          },
        ]);
      }

      if (path.startsWith("content_pregnancy_week_data?")) {
        return Promise.resolve([
          {
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
        ]);
      }

      if (path.startsWith("content_pregnancy_day_contents?")) {
        return Promise.resolve([
          {
            id: "day-13-1",
            day_number: 1,
            title: "1일차",
            baby_development_payload: null,
            baby_message: "엄마 안녕",
            mother_changes_payload: null,
          },
        ]);
      }

      if (
        path.startsWith("content_week_checklists?") &&
        path.includes("day_number=eq.1")
      ) {
        return Promise.resolve([
          {
            id: "check-1",
            code: "drink-water",
            title: "수분 섭취 체크",
            description: null,
            checklist_payload: null,
            display_order: 1,
            is_required: true,
          },
        ]);
      }

      if (
        path.startsWith("content_week_checklists?") &&
        path.includes("day_number=is.null")
      ) {
        return Promise.resolve([
          {
            id: "check-generic",
            code: "rest-well",
            title: "오늘은 충분히 쉬어요",
            description: null,
            checklist_payload: null,
            display_order: 2,
            is_required: false,
          },
        ]);
      }

      if (
        path.startsWith("content_week_questions?") &&
        path.includes("day_number=eq.1")
      ) {
        return Promise.resolve([
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
        ]);
      }

      if (
        path.startsWith("content_week_questions?") &&
        path.includes("day_number=is.null")
      ) {
        return Promise.resolve([
          {
            id: "question-generic",
            code: "generic-concern",
            question_text: "오늘 아기에게 전하고 싶은 마음이 있나요?",
            question_type: "text",
            help_text: null,
            question_payload: {},
            display_order: 2,
            is_required: false,
          },
        ]);
      }

      return Promise.resolve([]);
    });

    const result = await getPromptContext("user-1", null, "session-1");

    expect(result).toEqual(
      expect.objectContaining({
        pregnancyWeek: 13,
        dayNumber: 1,
        questions: [expect.objectContaining({ id: "question-1" })],
        checklists: [
          expect.objectContaining({ id: "check-1" }),
          expect.objectContaining({ id: "check-generic" }),
        ],
        tonePreference: "차분하게",
        profileMemory: expect.objectContaining({
          lastEmotionTone: "anxious",
          personaHint: "practical",
          personaConfidence: "medium",
          personaEvidence: "최근 검사 기준과 태동 횟수를 질문함",
        }),
        sessionMemory: expect.objectContaining({
          compactSummary: "최근 복통 상담",
        }),
        missingFields: ["태명", "출산 예정일", "이름"],
      }),
    );
  });

  it("does not store persona hints in pregnancy profile memory", async () => {
    mockedSupabaseUpdate.mockResolvedValue([] as never);

    await updateProfileMemory({
      userId: "user-1",
      onboardingPayload: { tonePreference: "차분하게" },
      currentProfileMemory: { lastEmotionTone: "tired" },
      nextProfileMemory: {
        lastEmotionTone: "anxious",
        personaHint: "anxious",
        personaConfidence: "medium",
        personaEvidence: "아기가 잘 자라는지 반복해서 확인함",
      },
      timestamp: "2026-04-17T10:01:00.000Z",
    });

    expect(mockedSupabaseUpdate).toHaveBeenCalledWith(
      "pregnancy_profiles?user_id=eq.user-1",
      expect.objectContaining({
        onboarding_payload: expect.objectContaining({
          profileMemory: {
            lastEmotionTone: "anxious",
            updatedAt: "2026-04-17T10:01:00.000Z",
          },
        }),
      }),
    );
  });

  it("marks outstanding prompt events answered or completed", async () => {
    mockedSupabaseSelect.mockImplementation((path: string) => {
      if (path.startsWith("user_checklist_events?")) {
        return Promise.resolve([
          { id: "event-check-1", checklist_id: "check-1", status: "sent" },
        ]);
      }

      if (path.startsWith("user_question_events?")) {
        return Promise.resolve([
          { id: "event-question-1", question_id: "question-1", status: "sent" },
        ]);
      }

      return Promise.resolve([]);
    });
    mockedSupabaseUpdate.mockResolvedValue([] as never);

    await markOutstandingPromptEventsAnswered({
      userId: "user-1",
      sessionId: "session-1",
      userMessageId: "user-message-1",
      userMessageText: "오늘은 괜찮아요",
    });

    expect(mockedSupabaseUpdate).toHaveBeenCalledWith(
      "user_checklist_events?id=eq.event-check-1",
      expect.objectContaining({
        status: "completed",
        completion_message_id: "user-message-1",
        answer_text: "오늘은 괜찮아요",
      }),
    );
    expect(mockedSupabaseUpdate).toHaveBeenCalledWith(
      "user_question_events?id=eq.event-question-1",
      expect.objectContaining({
        status: "answered",
        answer_message_id: "user-message-1",
        answer_text: "오늘은 괜찮아요",
      }),
    );
  });

  it("records answered daily questions in today's calendar history", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-04-20T03:00:00.000Z"));
    mockedSupabaseSelect.mockImplementation((path: string) => {
      if (path.startsWith("user_checklist_events?")) {
        return Promise.resolve([]);
      }

      if (path.startsWith("user_question_events?")) {
        return Promise.resolve([
          { id: "event-question-1", question_id: "question-1", status: "sent" },
        ]);
      }

      if (path.startsWith("calendar_logs?")) {
        return Promise.resolve([]);
      }

      return Promise.resolve([]);
    });
    mockedSupabaseUpdate.mockResolvedValue([] as never);
    mockedSupabaseInsert.mockResolvedValue([] as never);

    try {
      await markOutstandingPromptEventsAnswered({
        userId: "user-1",
        sessionId: "session-1",
        userMessageId: "user-message-1",
        userMessageText: "아기에게 편지를 썼어요",
      });
    } finally {
      jest.useRealTimers();
    }

    expect(mockedSupabaseInsert).toHaveBeenCalledWith(
      "calendar_logs",
      expect.objectContaining({
        user_id: "user-1",
        session_id: "session-1",
        date: "2026-04-20",
        entry_type: "survey_response",
        title: "하루 질문 답변",
        summary: "아기에게 편지를 썼어요",
        payload: expect.objectContaining({
          source: "chat_question_answer",
          questionId: "question-1",
          answer: "아기에게 편지를 썼어요",
          answerMessageId: "user-message-1",
          eventId: "event-question-1",
        }),
      }),
    );
  });

  it("creates prompt events and returns already prompted ids", async () => {
    mockedSupabaseInsert.mockResolvedValue([] as never);
    mockedSupabaseSelect.mockImplementation((path: string) => {
      if (path.startsWith("user_checklist_events?")) {
        return Promise.resolve([
          { id: "event-check-1", checklist_id: "check-1", status: "sent" },
        ]);
      }

      if (path.startsWith("user_question_events?")) {
        return Promise.resolve([
          { id: "event-question-1", question_id: "question-1", status: "sent" },
        ]);
      }

      return Promise.resolve([]);
    });

    await createPromptEvents({
      userId: "user-1",
      sessionId: "session-1",
      assistantMessageId: "assistant-message-1",
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
    });

    expect(mockedSupabaseInsert).toHaveBeenCalledWith(
      "user_checklist_events",
      expect.objectContaining({
        user_id: "user-1",
        checklist_id: "check-1",
        prompt_message_id: "assistant-message-1",
      }),
    );
    expect(mockedSupabaseInsert).toHaveBeenCalledWith(
      "user_question_events",
      expect.objectContaining({
        user_id: "user-1",
        question_id: "question-1",
        prompt_message_id: "assistant-message-1",
      }),
    );

    const prompted = await getAlreadyPromptedIds({
      userId: "user-1",
    });

    expect([...prompted.checklistIds]).toEqual(["check-1"]);
    expect([...prompted.questionIds]).toEqual(["question-1"]);
  });

  it("ensures session, saves messages, and persists memory updates", async () => {
    mockedSupabaseSelect.mockResolvedValue([] as never);
    mockedSupabaseInsert
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([{ id: "user-message-1" }] as never)
      .mockResolvedValueOnce([{ id: "assistant-message-1" }] as never);
    mockedSupabaseUpdate.mockResolvedValue([] as never);

    await ensureChatSession({
      userId: "user-1",
      sessionId: "session-1",
      title: "새 상담",
    });
    const userMessage = await saveUserChatMessage({
      sessionId: "session-1",
      userId: "user-1",
      text: "배가 아파요",
      imageDataUris: ["data:image/png;base64,abc"],
    });
    await saveAssistantChatMessages({
      sessionId: "session-1",
      userId: "user-1",
      messages: [
        {
          parts: [{ type: "text", text: "안내드릴게요." }],
        },
      ],
    });
    await touchChatSessionActivity("session-1", "2026-04-07T10:00:00.000Z");
    await updateSessionMemory(
      "session-1",
      { compactSummary: "요약" },
      "2026-04-07T10:01:00.000Z",
    );
    await updateProfileMemory({
      userId: "user-1",
      onboardingPayload: { tonePreference: "차분하게" },
      currentProfileMemory: { lastEmotionTone: "tired" },
      nextProfileMemory: { lastEmotionTone: "anxious" },
      timestamp: "2026-04-07T10:01:00.000Z",
    });

    expect(userMessage.id).toBe("user-message-1");
    expect(mockedSupabaseInsert).toHaveBeenCalledWith(
      "chat_sessions",
      expect.objectContaining({ id: "session-1", user_id: "user-1" }),
    );
    expect(mockedSupabaseInsert).toHaveBeenCalledWith(
      "chat_messages",
      expect.objectContaining({ role: "user", session_id: "session-1" }),
    );
    expect(mockedSupabaseInsert).toHaveBeenCalledWith(
      "chat_messages",
      expect.arrayContaining([
        expect.objectContaining({
          role: "assistant",
          model_name: "gemini-2.5-flash-lite",
        }),
      ]),
    );
    expect(mockedSupabaseUpdate).toHaveBeenCalledWith(
      "chat_sessions?id=eq.session-1",
      expect.objectContaining({ last_message_at: "2026-04-07T10:00:00.000Z" }),
    );
    expect(mockedSupabaseUpdate).toHaveBeenCalledWith(
      "chat_sessions?id=eq.session-1",
      expect.objectContaining({
        memory_payload: expect.objectContaining({ compactSummary: "요약" }),
      }),
    );
    expect(mockedSupabaseUpdate).toHaveBeenCalledWith(
      "pregnancy_profiles?user_id=eq.user-1",
      expect.objectContaining({
        onboarding_payload: expect.objectContaining({
          tonePreference: "차분하게",
          profileMemory: expect.objectContaining({
            lastEmotionTone: "anxious",
          }),
        }),
      }),
    );
  });
});
