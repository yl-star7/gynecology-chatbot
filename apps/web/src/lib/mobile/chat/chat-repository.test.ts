jest.mock("@/lib/supabase/admin-client", () => ({
  supabaseSelect: jest.fn(),
  supabaseInsert: jest.fn(),
  supabaseUpdate: jest.fn(),
}));

import {
  createPromptEvents,
  getAlreadyPromptedIds,
  getPromptContext,
  markOutstandingPromptEventsAnswered,
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

      if (path.startsWith("content_week_checklists?")) {
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

      if (path.startsWith("content_week_questions?")) {
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

      return Promise.resolve([]);
    });

    const result = await getPromptContext("user-1", null, "session-1");

    expect(result).toEqual(
      expect.objectContaining({
        pregnancyWeek: 13,
        dayNumber: 1,
        tonePreference: "차분하게",
        profileMemory: expect.objectContaining({ lastEmotionTone: "anxious" }),
        sessionMemory: expect.objectContaining({ compactSummary: "최근 복통 상담" }),
        missingFields: ["태명", "출산 예정일", "이름"],
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
      sessionId: "session-1",
    });

    expect([...prompted.checklistIds]).toEqual(["check-1"]);
    expect([...prompted.questionIds]).toEqual(["question-1"]);
  });
});
