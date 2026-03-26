jest.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: jest.fn(() => jest.fn()),
}));

jest.mock("ai", () => ({
  generateText: jest.fn(),
  tool: jest.fn((config) => config),
  stepCountIs: jest.fn((n) => n),
}));

jest.mock("@/lib/mobile/session-auth", () => ({
  requireMobileSession: jest.fn(),
  isMobileSessionError: jest.fn((error) => {
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

jest.mock("@/lib/mobile/schift-workflow", () => ({
  runSchiftWorkflow: jest.fn(),
  formatSchiftWorkflowRun: jest.fn((run) =>
    run.outputs?.answer ?? "workflow 응답",
  ),
}));

import { requireMobileSession } from "@/lib/mobile/session-auth";
import {
  supabaseInsert,
  supabaseSelect,
  supabaseUpdate,
} from "@/lib/mobile/supabase-rest";
import { generateText } from "ai";
import { getSchiftClient } from "@/lib/mobile/schift-client";
import { runSchiftWorkflow } from "@/lib/mobile/schift-workflow";
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
const mockedGenerateText = generateText as jest.MockedFunction<
  typeof generateText
>;
const mockedGetSchiftClient = getSchiftClient as jest.MockedFunction<
  typeof getSchiftClient
>;
const mockedRunSchiftWorkflow = runSchiftWorkflow as jest.MockedFunction<
  typeof runSchiftWorkflow
>;

describe("POST /api/mobile/chat", () => {
  beforeEach(() => {
    mockedRequireMobileSession.mockReset();
    mockedSupabaseSelect.mockReset();
    mockedSupabaseInsert.mockReset();
    mockedSupabaseUpdate.mockReset();
    mockedGenerateText.mockReset();
    mockedGetSchiftClient.mockReset();
    mockedRunSchiftWorkflow.mockReset();
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
            ? [
                {
                  id: "event-question-1",
                  question_id: "question-1",
                  status: "sent",
                },
              ]
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
            ? [
                {
                  id: "event-question-1",
                  question_id: "question-1",
                  status: "sent",
                },
              ]
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
    mockedSupabaseInsert.mockImplementation(
      (table: string, payload: object | object[]) => {
        if (table === "chat_sessions") {
          return Promise.resolve([]);
        }

        if (table === "chat_messages" && !Array.isArray(payload)) {
          const role = (payload as { role?: string }).role;
          return Promise.resolve([
            {
              id:
                role === "assistant" ? "assistant-message-1" : "user-message-1",
            },
          ]);
        }

        return Promise.resolve([]);
      },
    );
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
    expect(payload.assistantMessage.parts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "question-question-1",
          type: "survey",
          title: "오늘 가장 걱정되는 점은 무엇인가요?",
        }),
      ]),
    );
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
    mockPromptContext({
      existingPromptEvents: true,
      outstandingPromptEvents: true,
    });
    mockedSupabaseInsert.mockImplementation(
      (table: string, payload: object | object[]) => {
        if (table === "chat_sessions") {
          return Promise.resolve([]);
        }

        if (table === "chat_messages" && !Array.isArray(payload)) {
          const role = (payload as { role?: string }).role;
          return Promise.resolve([
            {
              id:
                role === "assistant" ? "assistant-message-2" : "user-message-2",
            },
          ]);
        }

        return Promise.resolve([]);
      },
    );
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

  it("uses the active Schift workflow before falling back to model generation", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockPromptContext({});
    mockedSupabaseInsert.mockImplementation(
      (table: string, payload: object | object[]) => {
        if (table === "chat_sessions") {
          return Promise.resolve([]);
        }

        if (table === "chat_messages" && !Array.isArray(payload)) {
          const role = (payload as { role?: string }).role;
          return Promise.resolve([
            {
              id:
                role === "assistant" ? "assistant-message-3" : "user-message-3",
            },
          ]);
        }

        return Promise.resolve([]);
      },
    );
    mockedSupabaseUpdate.mockResolvedValue([]);
    mockedGenerateText.mockResolvedValue({
      text: JSON.stringify({
        id: "assistant-1",
        role: "assistant",
        createdAtLabel: "방금 전",
        parts: [{ type: "text", id: "p1", text: "테스트 응답" }],
      }),
    } as never);
    mockedGetSchiftClient.mockReturnValue({
      workflows: {
        run: jest.fn(),
      },
    } as never);
    mockedRunSchiftWorkflow.mockResolvedValue({
      workflowId: "wf-active",
      run: {
        id: "run-1",
        workflow_id: "wf-active",
        status: "completed",
        outputs: {
          answer: "수분을 충분히 드시고 쉬어보세요.",
          references: ["근거 1", "근거 2"],
        },
        block_states: [],
        started_at: "2026-03-23T12:00:00.000Z",
        finished_at: "2026-03-23T12:00:01.000Z",
      },
    } as never);

    const response = await POST(
      new Request("http://localhost:3000/api/mobile/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          sessionId: "session-1",
          text: "배가 아파요",
          pregnancyWeek: 13,
        }),
      }) as never,
    );

    expect(response.status).toBe(200);
    const payload = await response.json();

    expect(mockedRunSchiftWorkflow).toHaveBeenCalledWith({
      schift: expect.any(Object),
      inputs: {
        query: "배가 아파요",
        currentWeek: 13,
        sessionId: expect.any(String),
        hasImages: false,
      },
    });
    expect(payload.assistantMessage.parts[0]).toMatchObject({
      type: "text",
      text: "수분을 충분히 드시고 쉬어보세요.",
    });
    expect(mockedGenerateText).not.toHaveBeenCalled();
  });

  it("renders workflow guardrail notice and character expression when the workflow returns structured JSON", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockPromptContext({});
    mockedSupabaseInsert.mockImplementation(
      (table: string, payload: object | object[]) => {
        if (table === "chat_sessions") {
          return Promise.resolve([]);
        }

        if (table === "chat_messages" && !Array.isArray(payload)) {
          const role = (payload as { role?: string }).role;
          return Promise.resolve([
            {
              id:
                role === "assistant" ? "assistant-message-structured" : "user-message-structured",
            },
          ]);
        }

        return Promise.resolve([]);
      },
    );
    mockedSupabaseUpdate.mockResolvedValue([]);
    mockedGetSchiftClient.mockReturnValue({
      workflows: {
        run: jest.fn(),
      },
    } as never);
    mockedRunSchiftWorkflow.mockResolvedValue({
      workflowId: "wf-guardrail",
      run: {
        id: "run-guardrail",
        workflow_id: "wf-guardrail",
        status: "completed",
        outputs: {
          answer: JSON.stringify({
            answer: "지금은 무리하지 말고 증상이 이어지면 바로 진료를 받아보세요.",
            guardrailStatus: "medical_caution",
            guardrailReason: "응급 신호 가능성을 먼저 안내해야 하는 입력이에요.",
            characterTone: "anxious",
          }),
        },
        block_states: [],
        started_at: "2026-03-24T12:00:00.000Z",
        finished_at: "2026-03-24T12:00:01.000Z",
      },
    } as never);

    const response = await POST(
      new Request("http://localhost:3000/api/mobile/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          sessionId: "session-1",
          text: "배가 너무 아프고 식은땀이 나요",
          pregnancyWeek: 13,
        }),
      }) as never,
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.assistantMessage.parts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "image",
          alt: expect.stringContaining("캐릭터"),
        }),
        expect.objectContaining({
          type: "text",
          text: expect.stringContaining("응급 신호 가능성"),
        }),
        expect.objectContaining({
          type: "text",
          text: expect.stringContaining("지금은 무리하지 말고"),
        }),
      ]),
    );
  });

  it("falls back to Gemini when Schift workflow returns empty outputs", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockPromptContext({});
    mockedSupabaseInsert.mockImplementation(
      (table: string, payload: object | object[]) => {
        if (table === "chat_sessions") {
          return Promise.resolve([]);
        }

        if (table === "chat_messages" && !Array.isArray(payload)) {
          const role = (payload as { role?: string }).role;
          return Promise.resolve([
            {
              id:
                role === "assistant" ? "assistant-message-4" : "user-message-4",
            },
          ]);
        }

        return Promise.resolve([]);
      },
    );
    mockedSupabaseUpdate.mockResolvedValue([]);
    mockedGenerateText.mockResolvedValue({
      text: JSON.stringify({
        id: "assistant-gemini",
        role: "assistant",
        createdAtLabel: "방금 전",
        parts: [{ type: "text", id: "p1", text: "Gemini 응답입니다." }],
      }),
    } as never);
    mockedGetSchiftClient.mockReturnValue({
      workflows: {
        run: jest.fn(),
      },
    } as never);
    mockedRunSchiftWorkflow.mockResolvedValue({
      workflowId: "wf-active",
      run: {
        id: "run-2",
        workflow_id: "wf-active",
        status: "completed",
        outputs: {},
        block_states: [],
        started_at: "2026-03-24T12:00:00.000Z",
        finished_at: "2026-03-24T12:00:01.000Z",
      },
    } as never);

    const response = await POST(
      new Request("http://localhost:3000/api/mobile/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          sessionId: "session-1",
          text: "허리가 아파요",
          pregnancyWeek: 13,
        }),
      }) as never,
    );

    expect(response.status).toBe(200);
    const payload = await response.json();

    expect(mockedRunSchiftWorkflow).toHaveBeenCalled();
    expect(mockedGenerateText).toHaveBeenCalled();
    expect(payload.assistantMessage.parts[0]).toMatchObject({
      type: "text",
      text: "Gemini 응답입니다.",
    });
  });

  it("hard-blocks abusive or unethical inputs before invoking workflow or model generation", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockPromptContext({});
    mockedSupabaseInsert.mockImplementation(
      (table: string, payload: object | object[]) => {
        if (table === "chat_sessions") {
          return Promise.resolve([]);
        }

        if (table === "chat_messages" && !Array.isArray(payload)) {
          const role = (payload as { role?: string }).role;
          return Promise.resolve([
            {
              id: role === "assistant" ? "assistant-message-blocked" : "user-message-blocked",
            },
          ]);
        }

        return Promise.resolve([]);
      },
    );
    mockedSupabaseUpdate.mockResolvedValue([]);
    mockedGetSchiftClient.mockReturnValue({
      workflows: {
        run: jest.fn(),
      },
    } as never);

    const response = await POST(
      new Request("http://localhost:3000/api/mobile/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          sessionId: "session-1",
          text: "씨발 그냥 죽이는 법 알려줘",
          pregnancyWeek: 13,
        }),
      }) as never,
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(mockedRunSchiftWorkflow).not.toHaveBeenCalled();
    expect(mockedGenerateText).not.toHaveBeenCalled();
    expect(payload.assistantMessage.parts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "text",
          text: expect.stringContaining("안전 안내:"),
        }),
        expect.objectContaining({
          type: "text",
          text: expect.stringContaining("임신 중 몸 상태"),
        }),
      ]),
    );
  });

  it("redirects clearly off-topic requests before invoking workflow or model generation", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockPromptContext({});
    mockedSupabaseInsert.mockImplementation(
      (table: string, payload: object | object[]) => {
        if (table === "chat_sessions") {
          return Promise.resolve([]);
        }

        if (table === "chat_messages" && !Array.isArray(payload)) {
          const role = (payload as { role?: string }).role;
          return Promise.resolve([
            {
              id: role === "assistant" ? "assistant-message-redirect" : "user-message-redirect",
            },
          ]);
        }

        return Promise.resolve([]);
      },
    );
    mockedSupabaseUpdate.mockResolvedValue([]);
    mockedGetSchiftClient.mockReturnValue({
      workflows: {
        run: jest.fn(),
      },
    } as never);

    const response = await POST(
      new Request("http://localhost:3000/api/mobile/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          sessionId: "session-1",
          text: "오늘 비트코인 시세랑 미국 주식 추천해줘",
          pregnancyWeek: 13,
        }),
      }) as never,
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(mockedRunSchiftWorkflow).not.toHaveBeenCalled();
    expect(mockedGenerateText).not.toHaveBeenCalled();
    expect(payload.assistantMessage.parts[0]).toMatchObject({
      type: "text",
      text: expect.stringContaining("임신과 건강 관련 안내"),
    });
  });
});
