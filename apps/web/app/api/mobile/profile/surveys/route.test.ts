jest.mock("@/lib/mobile/session-auth", () => ({
  requireMobileSession: jest.fn(),
  mobileRouteErrorResponse: jest.fn((error: unknown, fallbackMessage: string) =>
    Response.json(
      { error: error instanceof Error ? error.message : fallbackMessage },
      { status: 500 },
    ),
  ),
}));

jest.mock("@/lib/mobile/supabase-rest", () => ({
  supabaseInsert: jest.fn(),
  supabaseSelect: jest.fn(),
  supabaseUpdate: jest.fn(),
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

describe("POST /api/mobile/profile/surveys", () => {
  beforeEach(() => {
    mockedRequireMobileSession.mockReset();
    mockedSupabaseSelect.mockReset();
    mockedSupabaseInsert.mockReset();
    mockedSupabaseUpdate.mockReset();
  });

  it("stores a profile survey answer and marks the question event as answered", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      sessionId: "session-1",
      userId: "user-1",
    } as never);

    mockedSupabaseSelect.mockImplementation((path: string) => {
      if (path.startsWith("content.week_questions?")) {
        return Promise.resolve([
          {
            id: "question-1",
            code: "daily-checkin",
            question_text: "오늘 가장 불편한 점이 있었나요?",
            question_type: "yes_no",
            help_text: "프로필에서 바로 답할 수 있어요.",
            question_payload: {
              yesLabel: "네",
              noLabel: "아니요",
            },
            display_order: 1,
            is_required: true,
          },
        ] as never);
      }

      if (path.startsWith("user_question_events?")) {
        return Promise.resolve([
          {
            id: "event-1",
            question_id: "question-1",
            status: "sent",
          },
        ] as never);
      }

      return Promise.resolve([] as never);
    });

    mockedSupabaseInsert.mockResolvedValue([] as never);
    mockedSupabaseUpdate.mockResolvedValue([] as never);

    const response = await POST(
      new Request(
        "http://localhost:3000/api/mobile/profile/surveys?userId=user-1",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "user-1",
            questionId: "question-1",
            answer: "네",
          }),
        },
      ) as never,
    );

    expect(response.status).toBe(200);
    expect(mockedSupabaseInsert).toHaveBeenCalledWith(
      "calendar_logs",
      expect.objectContaining({
        user_id: "user-1",
        entry_type: "survey_response",
        title: "오늘 가장 불편한 점이 있었나요?",
        summary: "네",
      }),
    );
    expect(mockedSupabaseUpdate).toHaveBeenCalledWith(
      "user_question_events?id=eq.event-1",
      expect.objectContaining({
        status: "answered",
        answer_message_id: null,
      }),
    );
  });
});
