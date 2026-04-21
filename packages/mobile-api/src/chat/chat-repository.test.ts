jest.mock("@/lib/db/admin-client", () => ({
  dbSelect: jest.fn(),
  dbInsert: jest.fn(),
  dbUpdate: jest.fn(),
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
import { dbInsert, dbSelect, dbUpdate } from "@/lib/db/admin-client";

const mockedSupabaseSelect = dbSelect as jest.MockedFunction<typeof dbSelect>;
const mockedSupabaseInsert = dbInsert as jest.MockedFunction<typeof dbInsert>;
const mockedSupabaseUpdate = dbUpdate as jest.MockedFunction<typeof dbUpdate>;

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
            pregnancy_day_count: 91,
            pregnancy_week: 13,
            pregnancy_day_in_week: 0,
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
        checklists: [],
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

  it("uses day 1 content for week-only profiles stored with dayInWeek zero", async () => {
    const selectedPaths: string[] = [];
    mockedSupabaseSelect.mockImplementation((path: string) => {
      selectedPaths.push(path);

      if (path.startsWith("pregnancy_profiles?")) {
        return Promise.resolve([
          {
            pregnancy_day_count: 168,
            pregnancy_week: 24,
            pregnancy_day_in_week: 0,
            baby_nickname: "콩이",
            display_name: "김수아",
            due_date: null,
            onboarding_payload: {
              tonePreference: "차분하게",
            },
          },
        ]);
      }

      if (path.startsWith("v_user_persona_profiles?")) {
        return Promise.resolve([]);
      }

      if (path.startsWith("content_pregnancy_week_data?")) {
        return Promise.resolve([
          {
            id: "week-24",
            week_number: 24,
            title: "24주차",
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

      if (
        path.startsWith("content_pregnancy_day_contents?") &&
        path.includes("day_number=eq.1")
      ) {
        return Promise.resolve([
          {
            id: "day-24-1",
            day_number: 1,
            title: "1일차",
            baby_development_payload: null,
            baby_message: "24주 1일차 메시지",
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
            id: "check-24-1",
            code: "day-one-check",
            title: "24주 1일차 체크",
            description: null,
            checklist_payload: null,
            display_order: 1,
            is_required: true,
          },
        ]);
      }

      if (
        path.startsWith("content_week_questions?") &&
        path.includes("day_number=eq.1")
      ) {
        return Promise.resolve([
          {
            id: "question-24-1",
            code: "day-one-question",
            question_text: "오늘 아기에게 전하고 싶은 말이 있나요?",
            question_type: "text",
            help_text: null,
            question_payload: {},
            display_order: 1,
            is_required: true,
          },
        ]);
      }

      return Promise.resolve([]);
    });

    const result = await getPromptContext("user-1", null, null);

    expect(result).toEqual(
      expect.objectContaining({
        pregnancyWeek: 24,
        dayNumber: 1,
        checklists: [],
        questions: [expect.objectContaining({ id: "question-24-1" })],
      }),
    );
    expect(
      selectedPaths.some((path) => path.startsWith("content_week_checklists?")),
    ).toBe(false);
    expect(selectedPaths.some((path) => path.includes("day_number=eq.7"))).toBe(
      false,
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
      if (path.startsWith("user_question_events?")) {
        return Promise.resolve([
          { id: "event-question-1", question_id: "question-1", status: "sent" },
        ]);
      }

      if (path.startsWith("content_week_questions?")) {
        return Promise.resolve([
          {
            id: "question-1",
            question_text: "오늘 가장 걱정되는 점은 무엇인가요?",
          },
        ]);
      }

      return Promise.resolve([]);
    });
    mockedSupabaseUpdate.mockResolvedValue([] as never);

    await markOutstandingPromptEventsAnswered({
      userId: "user-1",
      sessionId: "session-1",
      userMessageId: "user-message-1",
      userMessageText: "오늘 가장 걱정되는 점은 무엇인가요?",
    });

    expect(mockedSupabaseSelect).not.toHaveBeenCalledWith(
      expect.stringContaining("user_checklist_events?"),
    );
    expect(mockedSupabaseUpdate).not.toHaveBeenCalledWith(
      expect.stringContaining("user_checklist_events"),
      expect.anything(),
    );
    expect(mockedSupabaseUpdate).toHaveBeenCalledWith(
      "user_question_events?id=eq.event-question-1",
      expect.objectContaining({
        status: "opened",
        answer_text: "오늘 가장 걱정되는 점은 무엇인가요?",
      }),
    );
  });

  it("answers the opened daily question with free text", async () => {
    mockedSupabaseSelect.mockImplementation((path: string) => {
      if (path.startsWith("user_checklist_events?")) {
        return Promise.resolve([]);
      }

      if (path.startsWith("user_question_events?")) {
        return Promise.resolve([
          {
            id: "event-question-1",
            question_id: "question-1",
            status: "opened",
          },
        ]);
      }

      if (path.startsWith("content_week_questions?")) {
        return Promise.resolve([
          {
            id: "question-1",
            question_text: "아기에게 물려주고 싶은 가치는 무엇인가요?",
          },
        ]);
      }

      if (path.startsWith("calendar_logs?")) {
        return Promise.resolve([]);
      }

      return Promise.resolve([]);
    });
    mockedSupabaseUpdate.mockResolvedValue([] as never);
    mockedSupabaseInsert.mockResolvedValue([] as never);

    await markOutstandingPromptEventsAnswered({
      userId: "user-1",
      sessionId: "session-1",
      userMessageId: "user-message-1",
      userMessageText: "성실함이요.",
    });

    expect(mockedSupabaseUpdate).toHaveBeenCalledWith(
      "user_question_events?id=eq.event-question-1",
      expect.objectContaining({
        status: "answered",
        answer_message_id: "user-message-1",
        answer_text: "성실함이요.",
      }),
    );
  });

  it("matches a free text answer to the closest sent question", async () => {
    mockedSupabaseSelect.mockImplementation((path: string) => {
      if (path.startsWith("user_checklist_events?")) {
        return Promise.resolve([]);
      }

      if (path.startsWith("user_question_events?")) {
        return Promise.resolve([
          {
            id: "event-question-1",
            question_id: "question-1",
            status: "sent",
          },
          {
            id: "event-question-2",
            question_id: "question-2",
            status: "sent",
          },
        ]);
      }

      if (path.startsWith("content_week_questions?")) {
        return Promise.resolve([
          {
            id: "question-1",
            question_text: "아기에게 물려주고 싶은 가치나 삶의 태도가 있나요?",
          },
          {
            id: "question-2",
            question_text:
              "아기가 태어난 후 가장 먼저 가르쳐주고 싶은 것이 있다면 무엇인가요?",
          },
        ]);
      }

      if (path.startsWith("calendar_logs?")) {
        return Promise.resolve([]);
      }

      return Promise.resolve([]);
    });
    mockedSupabaseUpdate.mockResolvedValue([] as never);
    mockedSupabaseInsert.mockResolvedValue([] as never);

    await markOutstandingPromptEventsAnswered({
      userId: "user-1",
      sessionId: "session-1",
      userMessageId: "user-message-1",
      userMessageText: "성실함이요.",
    });

    expect(mockedSupabaseUpdate).toHaveBeenCalledWith(
      "user_question_events?id=eq.event-question-1",
      expect.objectContaining({
        status: "answered",
        answer_text: "성실함이요.",
      }),
    );
    expect(mockedSupabaseUpdate).not.toHaveBeenCalledWith(
      "user_question_events?id=eq.event-question-2",
      expect.objectContaining({ status: "answered" }),
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
          {
            id: "event-question-1",
            question_id: "question-1",
            status: "opened",
          },
        ]);
      }

      if (path.startsWith("content_week_questions?")) {
        return Promise.resolve([
          {
            id: "question-1",
            question_text: "아기에게 편지를 써볼까요?",
          },
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

    expect(mockedSupabaseInsert).not.toHaveBeenCalledWith(
      "user_checklist_events",
      expect.anything(),
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

    expect([...prompted.checklistIds]).toEqual([]);
    expect([...prompted.questionIds]).toEqual(["question-1"]);
    expect(mockedSupabaseSelect).not.toHaveBeenCalledWith(
      expect.stringContaining("user_checklist_events?"),
    );
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
