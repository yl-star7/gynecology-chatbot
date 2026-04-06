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

jest.mock("@/lib/supabase/admin-client", () => ({
  supabaseInsert: jest.fn(),
  supabaseSelect: jest.fn(),
  supabaseUpdate: jest.fn(),
}));

var adminSupabaseSelectMock: jest.Mock;
var adminSupabaseInsertMock: jest.Mock;
var adminSupabaseUpdateMock: jest.Mock;
var getSupabaseAdminClientMock: jest.Mock;

jest.mock("@/lib/supabase/admin-client", () => {
  adminSupabaseSelectMock = jest.fn();
  adminSupabaseInsertMock = jest.fn();
  adminSupabaseUpdateMock = jest.fn();
  getSupabaseAdminClientMock = jest.fn(() => ({
    from: (table: string) =>
      new QueryBuilder({ table, mode: "select", schema: undefined }),
    schema: (schema: string) => ({
      from: (table: string) =>
        new QueryBuilder({ table, mode: "select", schema }),
    }),
  }));
  class QueryBuilder {
    private readonly schema?: string;
    private readonly table: string;
    private readonly mode: "select" | "insert" | "update" | "delete";
    private readonly columns?: string;
    private readonly payload?: unknown;
    private readonly filters: string[] = [];
    private readonly orders: string[] = [];
    private limitValue?: number;

    constructor(input: {
      schema?: string;
      table: string;
      mode: "select" | "insert" | "update" | "delete";
      columns?: string;
      payload?: unknown;
    }) {
      this.schema = input.schema;
      this.table = input.table;
      this.mode = input.mode;
      this.columns = input.columns;
      this.payload = input.payload;
    }

    eq(column: string, value: string | number | boolean) {
      this.filters.push(`${column}=eq.${value}`);
      return this;
    }

    is(column: string, value: boolean | null) {
      this.filters.push(`${column}=is.${value === null ? "null" : value}`);
      return this;
    }

    not(column: string, operator: string, value: string | null) {
      this.filters.push(`${column}=not.${operator}.${value ?? "null"}`);
      return this;
    }

    in(column: string, values: Array<string | number>) {
      this.filters.push(`${column}=in.(${values.join(",")})`);
      return this;
    }

    gte(column: string, value: string) {
      this.filters.push(`${column}=gte.${value}`);
      return this;
    }

    order(
      column: string,
      options: { ascending?: boolean; nullsFirst?: boolean } = {},
    ) {
      const direction = options.ascending === false ? "desc" : "asc";
      const nulls =
        options.nullsFirst === true
          ? ".nullsfirst"
          : options.nullsFirst === false
            ? ".nullslast"
            : "";
      this.orders.push(`${column}.${direction}${nulls}`);
      return this;
    }

    limit(value: number) {
      this.limitValue = value;
      return this;
    }

    select(columns?: string) {
      if (
        this.mode === "insert" ||
        this.mode === "update" ||
        this.mode === "delete"
      ) {
        return new QueryBuilder({
          schema: this.schema,
          table: this.table,
          mode: this.mode,
          columns,
          payload: this.payload,
        });
      }

      return new QueryBuilder({
        schema: this.schema,
        table: this.table,
        mode: "select",
        columns,
      });
    }

    insert(payload: unknown) {
      return new QueryBuilder({
        schema: this.schema,
        table: this.table,
        mode: "insert",
        payload,
      });
    }

    update(payload: unknown) {
      return new QueryBuilder({
        schema: this.schema,
        table: this.table,
        mode: "update",
        payload,
      });
    }

    delete() {
      return new QueryBuilder({
        schema: this.schema,
        table: this.table,
        mode: "delete",
      });
    }

    then(resolve: (value: { data: unknown; error: null }) => unknown) {
      const relation = this.schema
        ? `${this.schema}.${this.table}`
        : this.table;
      const params: string[] = [];
      if (this.mode === "select") {
        params.push(`select=${this.columns ?? "*"}`);
      }
      params.push(...this.filters);
      if (this.orders.length > 0) {
        params.push(`order=${this.orders.join(",")}`);
      }
      if (typeof this.limitValue === "number") {
        params.push(`limit=${this.limitValue}`);
      }
      const path =
        params.length > 0 ? `${relation}?${params.join("&")}` : relation;

      const source =
        this.mode === "select"
          ? adminSupabaseSelectMock(path)
          : this.mode === "insert"
            ? adminSupabaseInsertMock(relation, this.payload)
            : adminSupabaseUpdateMock(path, this.payload);

      return Promise.resolve(source).then((data) =>
        resolve({ data, error: null }),
      );
    }
  }

  return {
    supabaseSelect: adminSupabaseSelectMock,
    supabaseInsert: adminSupabaseInsertMock,
    supabaseUpdate: adminSupabaseUpdateMock,
    getSupabaseAdminClient: getSupabaseAdminClientMock,
  };
});

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
  formatSchiftWorkflowRun: jest.fn(
    (run) => run.outputs?.answer ?? "workflow 응답",
  ),
  extractSchiftWorkflowOutputs: jest.fn((run) => run.outputs),
}));

import { requireMobileSession } from "@/lib/mobile/session-auth";
import {
  supabaseInsert,
  supabaseSelect,
  supabaseUpdate,
} from "@/lib/supabase/admin-client";
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
    adminSupabaseSelectMock.mockImplementation((path: string) =>
      mockedSupabaseSelect(path),
    );
    adminSupabaseInsertMock.mockImplementation(
      (table: string, payload: unknown) =>
        mockedSupabaseInsert(table, payload as never),
    );
    adminSupabaseUpdateMock.mockImplementation(
      (path: string, payload: unknown) =>
        mockedSupabaseUpdate(path, payload as never),
    );
    mockedGenerateText.mockReset();
    mockedGetSchiftClient.mockReset();
    mockedRunSchiftWorkflow.mockReset();
    process.env.GEMINI_API_KEY = "test-key";
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    mockedGetSchiftClient.mockReturnValue(null as never);
    mockedGenerateText.mockResolvedValue({
      text: JSON.stringify({
        id: "assistant-default",
        role: "assistant",
        createdAtLabel: "방금 전",
        parts: [{ type: "text", id: "p-default", text: "테스트 응답" }],
      }),
    } as never);
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

      if (path.startsWith("content_pregnancy_week_data?")) {
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

      if (path.startsWith("content_pregnancy_day_contents?")) {
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

      if (path.startsWith("content_week_checklists?")) {
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

      if (path.startsWith("content_week_questions?")) {
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

        if (table === "chat_messages") {
          if (Array.isArray(payload)) {
            return Promise.resolve(
              payload.map((_, index) => ({
                id: `assistant-message-${index + 1}`,
              })),
            );
          }

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
    // 체크리스트 OR 질문 중 하나만 은근슬쩍 보냄 (랜덤)
    const followUps = payload.assistantMessages.slice(1);
    const hasChecklist = followUps.some((m: { parts: Array<{ id: string }> }) =>
      m.parts.some((p) => p.id === "checklist-check-1"),
    );
    const hasQuestion = followUps.some((m: { parts: Array<{ id: string }> }) =>
      m.parts.some((p) => p.id === "question-text-question-1"),
    );
    // 둘 중 적어도 하나는 있어야 함
    expect(hasChecklist || hasQuestion).toBe(true);
    // 둘 다 동시에는 안 나옴
    expect(hasChecklist && hasQuestion).toBe(false);

    // 선택된 것만 이벤트 생성
    if (hasChecklist) {
      expect(mockedSupabaseInsert).toHaveBeenCalledWith(
        "user_checklist_events",
        expect.objectContaining({
          user_id: "user-1",
          checklist_id: "check-1",
          status: "sent",
        }),
      );
    }
    if (hasQuestion) {
      expect(mockedSupabaseInsert).toHaveBeenCalledWith(
        "user_question_events",
        expect.objectContaining({
          user_id: "user-1",
          question_id: "question-1",
          status: "sent",
        }),
      );
    }
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

        if (table === "chat_messages") {
          if (Array.isArray(payload)) {
            return Promise.resolve(
              payload.map((_, index) => ({
                id: `assistant-message-${index + 1}`,
              })),
            );
          }

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

        if (table === "chat_messages") {
          if (Array.isArray(payload)) {
            return Promise.resolve(
              payload.map((_, index) => ({
                id: `assistant-message-${index + 1}`,
              })),
            );
          }

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

  it("removes inline citation markers from workflow responses", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockPromptContext({ existingPromptEvents: true });
    mockedSupabaseInsert.mockImplementation(
      (table: string, payload: object | object[]) => {
        if (table === "chat_sessions") {
          return Promise.resolve([]);
        }

        if (table === "chat_messages") {
          if (Array.isArray(payload)) {
            return Promise.resolve([{ id: "assistant-message-1" }]);
          }

          return Promise.resolve([{ id: "user-message-1" }]);
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
      workflowId: "wf-citation",
      run: {
        id: "run-citation",
        workflow_id: "wf-citation",
        status: "completed",
        outputs: {
          answer: "안정을 취해 보세요 (3)(5) [91]",
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
          text: "복통이 있어요",
          pregnancyWeek: 13,
        }),
      }) as never,
    );

    const payload = await response.json();
    expect(payload.assistantMessage.parts[0].text).toBe("안정을 취해 보세요");
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
                role === "assistant"
                  ? "assistant-message-structured"
                  : "user-message-structured",
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
            answer:
              "지금은 무리하지 말고 증상이 이어지면 바로 진료를 받아보세요.",
            guardrailStatus: "medical_caution",
            guardrailReason:
              "응급 신호 가능성을 먼저 안내해야 하는 입력이에요.",
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
          alt: expect.stringContaining("안내"),
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

  it("retries once when model output is not valid chat JSON before falling back", async () => {
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

        if (table === "chat_messages") {
          if (Array.isArray(payload)) {
            return Promise.resolve([{ id: "assistant-message-invalid-json" }]);
          }

          return Promise.resolve([{ id: "user-message-invalid-json" }]);
        }

        return Promise.resolve([]);
      },
    );
    mockedSupabaseUpdate.mockResolvedValue([]);
    mockedGenerateText
      .mockResolvedValueOnce({
        text: "그냥 일반 텍스트 응답",
      } as never)
      .mockResolvedValueOnce({
        text: JSON.stringify({
          id: "assistant-retry-success",
          role: "assistant",
          createdAtLabel: "방금 전",
          parts: [{ type: "text", id: "p-retry", text: "재시도 후 정상 JSON 응답" }],
        }),
      } as never);
    mockedGetSchiftClient.mockReturnValue(null as never);

    const response = await POST(
      new Request("http://localhost:3000/api/mobile/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          sessionId: "session-1",
          text: "태동이 적게 느껴져요",
          pregnancyWeek: 29,
        }),
      }) as never,
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(mockedGenerateText).toHaveBeenCalledTimes(2);
    expect(payload.assistantMessage.parts[0]).toMatchObject({
      type: "text",
      text: "재시도 후 정상 JSON 응답",
    });
  });

  it("returns a safe fallback reply when model output is still not valid chat JSON after one retry", async () => {
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

        if (table === "chat_messages") {
          if (Array.isArray(payload)) {
            return Promise.resolve([{ id: "assistant-message-invalid-json" }]);
          }

          return Promise.resolve([{ id: "user-message-invalid-json" }]);
        }

        return Promise.resolve([]);
      },
    );
    mockedSupabaseUpdate.mockResolvedValue([]);
    mockedGenerateText
      .mockResolvedValueOnce({ text: "그냥 일반 텍스트 응답" } as never)
      .mockResolvedValueOnce({ text: "두번째도 일반 텍스트" } as never);
    mockedGetSchiftClient.mockReturnValue(null as never);

    const response = await POST(
      new Request("http://localhost:3000/api/mobile/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          sessionId: "session-1",
          text: "태동이 적게 느껴져요",
          pregnancyWeek: 29,
        }),
      }) as never,
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(mockedGenerateText).toHaveBeenCalledTimes(2);
    expect(payload.assistantMessage.parts[0]).toMatchObject({
      type: "text",
      text: expect.stringContaining("29주차 기준"),
    });
    expect(payload.assistantMessage.parts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "deepLink",
          target: "notebook",
        }),
      ]),
    );
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
              id:
                role === "assistant"
                  ? "assistant-message-blocked"
                  : "user-message-blocked",
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

  it("3000자 초과 텍스트 전송 시 400 반환 및 에러 메시지에 '3,000자 이내' 포함", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);

    const longText = "가".repeat(3001);
    const response = await POST(
      new Request("http://localhost:3000/api/mobile/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          sessionId: "session-1",
          text: longText,
          pregnancyWeek: 13,
        }),
      }) as never,
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toContain("3,000자 이내");
    expect(mockedRunSchiftWorkflow).not.toHaveBeenCalled();
    expect(mockedGenerateText).not.toHaveBeenCalled();
  });

  it("3000자 이내 텍스트는 정상 처리됨", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockPromptContext({});
    mockedSupabaseInsert.mockImplementation(
      (table: string, payload: object | object[]) => {
        if (table === "chat_sessions") return Promise.resolve([]);
        if (table === "chat_messages") {
          if (Array.isArray(payload)) {
            return Promise.resolve(payload.map((_, i) => ({ id: `msg-${i}` })));
          }
          const role = (payload as { role?: string }).role;
          return Promise.resolve([
            { id: role === "assistant" ? "assistant-msg-1" : "user-msg-1" },
          ]);
        }
        return Promise.resolve([]);
      },
    );
    mockedSupabaseUpdate.mockResolvedValue([]);
    mockedGetSchiftClient.mockReturnValue(null as never);

    const boundaryText = "가".repeat(3000);
    const response = await POST(
      new Request("http://localhost:3000/api/mobile/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          sessionId: "session-1",
          text: boundaryText,
          pregnancyWeek: 13,
        }),
      }) as never,
    );

    expect(response.status).toBe(200);
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
              id:
                role === "assistant"
                  ? "assistant-message-redirect"
                  : "user-message-redirect",
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

  it("does not use direct admin client for prompt context queries", async () => {
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

        if (table === "chat_messages") {
          if (Array.isArray(payload)) {
            return Promise.resolve([{ id: "assistant-message-provider-aware" }]);
          }

          return Promise.resolve([{ id: "user-message-provider-aware" }]);
        }

        return Promise.resolve([]);
      },
    );
    mockedSupabaseUpdate.mockResolvedValue([]);
    getSupabaseAdminClientMock.mockImplementation(() => {
      throw new Error("direct admin client should not be used in chat route");
    });

    const response = await POST(
      new Request("http://localhost:3000/api/mobile/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          sessionId: "session-1",
          text: "태동이 적게 느껴져요",
          pregnancyWeek: 13,
        }),
      }) as never,
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.assistantMessage.parts[0]).toMatchObject({
      type: "text",
      text: expect.any(String),
    });
  });
});
