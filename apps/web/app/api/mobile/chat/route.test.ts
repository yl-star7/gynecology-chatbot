jest.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: jest.fn(() => jest.fn()),
}));

jest.mock("ai", () => ({
  generateText: jest.fn(),
  tool: jest.fn((config: any) => config),
  stepCountIs: jest.fn((n: number) => n),
}));

jest.mock("@/lib/mobile/session-auth", () => ({
  requireMobileSession: jest.fn(),
  isMobileSessionError: jest.fn((error: unknown) => {
    return (
      error instanceof Error &&
      error.message === "mobile session token is required"
    );
  }),
}));

jest.mock("@/lib/mobile/supabase-rest", () => ({
  supabaseInsert: jest.fn(),
  supabaseSelect: jest.fn(),
  supabaseUpdate: jest.fn(),
}));

jest.mock("@/lib/mobile/user-action-log", () => ({
  recordUserAction: jest.fn(),
}));

jest.mock("@/lib/mobile/rag", () => ({
  retrievePregnancyContext: jest.fn(async () => []),
  formatRagContext: jest.fn(() => ""),
}));

jest.mock("@/lib/mobile/schift-client", () => ({
  getSchiftClient: jest.fn(() => null),
}));

import { requireMobileSession } from "@/lib/mobile/session-auth";
import {
  supabaseInsert,
  supabaseSelect,
  supabaseUpdate,
} from "@/lib/mobile/supabase-rest";
import { POST } from "./route";

const mockedRequireMobileSession = requireMobileSession as jest.MockedFunction<
  typeof requireMobileSession
>;
const mockedSupabaseSelect = supabaseSelect as jest.MockedFunction<
  typeof supabaseSelect
>;
const mockedSupabaseInsert = supabaseInsert as jest.MockedFunction<
  typeof supabaseInsert
>;
const mockedSupabaseUpdate = supabaseUpdate as jest.MockedFunction<
  typeof supabaseUpdate
>;

describe("POST /api/mobile/chat", () => {
  beforeEach(() => {
    mockedRequireMobileSession.mockReset();
    mockedSupabaseSelect.mockReset();
    mockedSupabaseInsert.mockReset();
    mockedSupabaseUpdate.mockReset();
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  });

  function mockPromptContext({
    existingPromptEvents = false,
    outstandingPromptEvents = false,
  }: {
    existingPromptEvents?: boolean;
    outstandingPromptEvents?: boolean;
  }) {
    mockedSupabaseSelect.mockImplementation((path: string) => {
      if (path.startsWith("chat_sessions?")) {
        return Promise.resolve([]);
      }

      if (
        path.startsWith("user_checklist_events?") &&
        path.includes("status=eq.sent")
      ) {
        return Promise.resolve(
          outstandingPromptEvents
            ? [{ id: "event-check-1", checklist_id: "check-1", status: "sent" }]
            : [],
        );
      }

      if (
        path.startsWith("user_question_events?") &&
        path.includes("status=eq.sent")
      ) {
        return Promise.resolve(
          outstandingPromptEvents
            ? [{ id: "event-question-1", question_id: "question-1", status: "sent" }]
            : [],
        );
      }

      if (path.startsWith("pregnancy_profiles?")) {
        return Promise.resolve([
          {
            pregnancy_week: 13,
            pregnancy_day_in_week: 0,
            tone_preference: null,
            baby_nickname: null,
            display_name: null,
            due_date: null,
          },
        ]);
      }

      if (path.startsWith("v_pregnancy_week_data?")) {
        return Promise.resolve([
          {
            id: "week-13",
            week_number: 13,
            title: "13주차 몸 상태 점검",
            baby_summary: "아기 요약",
            mother_summary: "엄마 요약",
            warning_signs: null,
            recommended_actions: null,
            checklist_intro: "오늘 체크리스트입니다.",
            question_intro: "오늘 질문입니다.",
            status: "published",
          },
        ]);
      }

      if (path.startsWith("v_pregnancy_day_contents?")) {
        return Promise.resolve([
          {
            id: "day-13-1",
            day_number: 1,
            title: "Day 1",
            baby_development_payload: { items: ["아기가 자라고 있어요."] },
            baby_message: "엄마, 오늘도 잘 부탁해요.",
            mother_changes_payload: { items: ["몸이 조금 더 안정돼요."] },
          },
        ]);
      }

      if (path.startsWith("v_week_checklists?")) {
        return Promise.resolve([
          {
            id: "check-1",
            code: "drink-water",
            title: "수분 섭취 체크",
            description: "물을 충분히 마셨는지 확인해 주세요.",
            checklist_payload: {
              items: [{ id: "water", label: "오늘 물 충분히 마시기" }],
            },
            display_order: 1,
            is_required: true,
          },
        ]);
      }

      if (path.startsWith("v_week_questions?")) {
        return Promise.resolve([
          {
            id: "question-1",
            code: "main-concern",
            question_text: "오늘 가장 걱정되는 점은 무엇인가요?",
            question_type: "text",
            help_text: "편하게 적어 주세요.",
            question_payload: {},
            display_order: 1,
            is_required: true,
          },
        ]);
      }

      if (path.startsWith("user_checklist_events?")) {
        return Promise.resolve(
          existingPromptEvents
            ? [{ id: "event-check-1", checklist_id: "check-1", status: "sent" }]
            : [],
        );
      }

      if (path.startsWith("user_question_events?")) {
        return Promise.resolve(
          existingPromptEvents
            ? [{ id: "event-question-1", question_id: "question-1", status: "sent" }]
            : [],
        );
      }

      return Promise.resolve([]);
    });
  }

  it("appends week prompt parts and creates sent events once per session", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockPromptContext({});
    mockedSupabaseInsert.mockImplementation((table: string, payload: object | object[]) => {
      if (table === "chat_sessions") {
        return Promise.resolve([]);
      }

      if (table === "chat_messages" && !Array.isArray(payload)) {
        const role = (payload as { role?: string }).role;
        return Promise.resolve([
          {
            id: role === "assistant" ? "assistant-message-1" : "user-message-1",
          },
        ]);
      }

      return Promise.resolve([]);
    });
    mockedSupabaseUpdate.mockResolvedValue([]);

    const response = await POST(
      new Request("http://localhost:3000/api/mobile/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          sessionId: "session-1",
          text: "오늘 두통이 있어요",
          pregnancyWeek: 13,
        }),
      }) as never,
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(
      payload.assistantMessage.parts.some(
        (part: { id?: string }) => part.id === "checklist-check-1",
      ),
    ).toBe(true);
    expect(
      payload.assistantMessage.parts.some(
        (part: { id?: string }) => part.id === "question-question-1",
      ),
    ).toBe(true);
    expect(mockedSupabaseInsert).toHaveBeenCalledWith(
      "user_checklist_events",
      expect.objectContaining({
        user_id: "user-1",
        checklist_id: "check-1",
        prompt_message_id: "assistant-message-1",
        status: "sent",
      }),
    );
    expect(mockedSupabaseInsert).toHaveBeenCalledWith(
      "user_question_events",
      expect.objectContaining({
        user_id: "user-1",
        question_id: "question-1",
        prompt_message_id: "assistant-message-1",
        status: "sent",
      }),
    );
  });

  it("marks outstanding prompt events as completed or answered on the next user message", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockPromptContext({ existingPromptEvents: true, outstandingPromptEvents: true });
    mockedSupabaseInsert.mockImplementation((table: string, payload: object | object[]) => {
      if (table === "chat_sessions") {
        return Promise.resolve([]);
      }

      if (table === "chat_messages" && !Array.isArray(payload)) {
        const role = (payload as { role?: string }).role;
        return Promise.resolve([
          {
            id: role === "assistant" ? "assistant-message-2" : "user-message-2",
          },
        ]);
      }

      return Promise.resolve([]);
    });
    mockedSupabaseUpdate.mockResolvedValue([]);

    const response = await POST(
      new Request("http://localhost:3000/api/mobile/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          sessionId: "session-1",
          text: "오늘은 괜찮아요",
          pregnancyWeek: 13,
        }),
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(mockedSupabaseUpdate).toHaveBeenCalledWith(
      "user_checklist_events?id=eq.event-check-1",
      expect.objectContaining({
        status: "completed",
        completion_message_id: "user-message-2",
      }),
    );
    expect(mockedSupabaseUpdate).toHaveBeenCalledWith(
      "user_question_events?id=eq.event-question-1",
      expect.objectContaining({
        status: "answered",
        answer_message_id: "user-message-2",
      }),
    );
    expect(
      mockedSupabaseInsert.mock.calls.some(
        ([table]) =>
          table === "user_checklist_events" || table === "user_question_events",
      ),
    ).toBe(false);
  });
});
