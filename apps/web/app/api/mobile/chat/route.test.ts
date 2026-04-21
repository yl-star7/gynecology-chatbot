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
  mobileNoStoreJson: jest.fn((payload: unknown, init?: ResponseInit) =>
    Response.json(payload, {
      ...init,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        ...(init?.headers as Record<string, string> | undefined),
      },
    }),
  ),
  isMobileSessionError: jest.fn((error) => {
    return (
      error instanceof Error &&
      error.message === "mobile session token is required"
    );
  }),
}));

jest.mock("@/lib/db/admin-client", () => ({
  dbInsert: jest.fn(),
  dbSelect: jest.fn(),
  dbUpdate: jest.fn(),
}));

var adminSupabaseSelectMock: jest.Mock;
var adminSupabaseInsertMock: jest.Mock;
var adminSupabaseUpdateMock: jest.Mock;
var getSupabaseAdminClientMock: jest.Mock;

jest.mock("@/lib/db/admin-client", () => {
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
    dbSelect: adminSupabaseSelectMock,
    dbInsert: adminSupabaseInsertMock,
    dbUpdate: adminSupabaseUpdateMock,
    getSupabaseAdminClient: getSupabaseAdminClientMock,
  };
});

jest.mock("@gynecology-chatbot/mobile-api/db/admin-client", () => {
  if (!adminSupabaseSelectMock) {
    adminSupabaseSelectMock = jest.fn();
  }
  if (!adminSupabaseInsertMock) {
    adminSupabaseInsertMock = jest.fn();
  }
  if (!adminSupabaseUpdateMock) {
    adminSupabaseUpdateMock = jest.fn();
  }

  return {
    dbSelect: adminSupabaseSelectMock,
    dbInsert: adminSupabaseInsertMock,
    dbUpdate: adminSupabaseUpdateMock,
  };
});

jest.mock("@gynecology-chatbot/db/prisma", () => {
  const modelNames = [
    "calendar_logs",
    "chat_messages",
    "chat_sessions",
    "content_pregnancy_day_contents",
    "content_pregnancy_week_data",
    "content_week_checklists",
    "content_week_questions",
    "pregnancy_profiles",
    "system_config",
    "user_checklist_events",
    "user_question_events",
    "v_user_persona_profiles",
  ];

  function selectedColumns(select: Record<string, unknown> | undefined) {
    if (!select) return "*";

    const columns = Object.entries(select)
      .filter(([, included]) => Boolean(included))
      .map(([column]) => column);

    if (
      columns.includes("id") &&
      columns.includes("title") &&
      columns.includes("last_message_at")
    ) {
      return "id,title";
    }

    return columns.length > 0 ? columns.join(",") : "*";
  }

  function filterParams(where: Record<string, unknown> | undefined) {
    if (!where) return [];

    return Object.entries(where).flatMap(([column, value]) => {
      if (value === null) return [`${column}=is.null`];
      if (Array.isArray(value)) return [`${column}=in.(${value.join(",")})`];
      if (
        value &&
        typeof value === "object" &&
        "in" in (value as Record<string, unknown>) &&
        Array.isArray((value as { in: unknown[] }).in)
      ) {
        return [`${column}=in.${(value as { in: unknown[] }).in.join(",")}`];
      }
      return [`${column}=eq.${String(value)}`];
    });
  }

  function orderParams(
    orderBy:
      | Record<string, "asc" | "desc">
      | Array<Record<string, "asc" | "desc">>
      | undefined,
  ) {
    if (!orderBy) return [];

    const orders = (Array.isArray(orderBy) ? orderBy : [orderBy]).flatMap(
      (entry) =>
        Object.entries(entry).map(([column, direction]) =>
          direction === "desc" ? `${column}.desc` : `${column}.asc`,
        ),
    );

    return orders.length > 0 ? [`order=${orders.join(",")}`] : [];
  }

  function pathFor(
    model: string,
    args: {
      select?: Record<string, unknown>;
      where?: Record<string, unknown>;
      orderBy?:
        | Record<string, "asc" | "desc">
        | Array<Record<string, "asc" | "desc">>;
      take?: number;
    } = {},
  ) {
    const params = [
      `select=${selectedColumns(args.select)}`,
      ...filterParams(args.where),
      ...orderParams(args.orderBy),
      ...(typeof args.take === "number" ? [`limit=${args.take}`] : []),
    ];

    return `${model}?${params.join("&")}`;
  }

  function firstRow<T>(rows: T[] | null | undefined) {
    return Array.isArray(rows) ? (rows[0] ?? null) : null;
  }

  function createDelegate(model: string) {
    return {
      findFirst: jest.fn(async (args = {}) =>
        firstRow(await adminSupabaseSelectMock(pathFor(model, args))),
      ),
      findUnique: jest.fn(async (args = {}) =>
        firstRow(await adminSupabaseSelectMock(pathFor(model, args))),
      ),
      findMany: jest.fn(
        async (args = {}) => await adminSupabaseSelectMock(pathFor(model, args)),
      ),
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const inserted = await adminSupabaseInsertMock(model, data);
        return firstRow(inserted) ?? data;
      }),
      update: jest.fn(
        async ({
          where,
          data,
        }: {
          where?: Record<string, unknown>;
          data: Record<string, unknown>;
        }) => {
          const updated = await adminSupabaseUpdateMock(
            pathFor(model, { where }),
            data,
          );
          return firstRow(updated) ?? data;
        },
      ),
      updateMany: jest.fn(
        async ({
          where,
          data,
        }: {
          where?: Record<string, unknown>;
          data: Record<string, unknown>;
        }) => {
          await adminSupabaseUpdateMock(pathFor(model, { where }), data);
          return { count: 1 };
        },
      ),
    };
  }

  const prisma = Object.fromEntries(
    modelNames.map((model) => [model, createDelegate(model)]),
  );

  return {
    prisma: {
      ...prisma,
      $transaction: jest.fn((items: Array<Promise<unknown>>) =>
        Promise.all(items),
      ),
    },
  };
});

jest.mock("@/lib/mobile/user-action-log", () => ({
  recordUserAction: jest.fn(),
}));

jest.mock("@/lib/mobile/rag", () => ({
  retrievePregnancyContext: jest.fn(async () => []),
  formatRagContext: jest.fn(() => ""),
  searchFileRag: jest.fn(async () => ({ context: "", sources: [] })),
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
  dbInsert,
  dbSelect,
  dbUpdate,
} from "@/lib/db/admin-client";
import { generateText } from "ai";
import { getSchiftClient } from "@/lib/mobile/schift-client";
import { runSchiftWorkflow } from "@/lib/mobile/schift-workflow";
import { POST } from "./route";

import {
  buildPromptFollowUpMessages,
  stripFollowUpContentFromAnswer,
} from "@/lib/mobile/chat/follow-ups";
import { detectHardGuardrailReason } from "@/lib/mobile/chat/guardrails";
import { parseWorkflowAssistantPayload } from "@/lib/mobile/chat/workflow-payload";
import { sanitizeInlineCitationMarkers } from "@/lib/mobile/chat/sanitizers";

const mockedRequireMobileSession = requireMobileSession as jest.MockedFunction<
  typeof requireMobileSession
>;
const mockedSupabaseSelect = dbSelect as jest.MockedFunction<
  typeof dbSelect
>;
const mockedSupabaseInsert = dbInsert as jest.MockedFunction<
  typeof dbInsert
>;
const mockedSupabaseUpdate = dbUpdate as jest.MockedFunction<
  typeof dbUpdate
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

describe("chat pure helpers", () => {
  it("detects abusive and off-topic guardrail reasons", () => {
    expect(detectHardGuardrailReason("씨발 진짜 짜증나")).toContain(
      "상처를 주는 표현에는 답변하지 않고 있어요",
    );
    expect(detectHardGuardrailReason("오늘 비트코인 시세 알려줘")).toContain(
      "임신과 건강 관련 안내",
    );
  });

  it("sanitizes inline citation markers", () => {
    expect(
      sanitizeInlineCitationMarkers("안정을 취해 보세요 (3)(5) [91]"),
    ).toBe("안정을 취해 보세요");
  });

  it("parses workflow memory payload from structured answer json", () => {
    expect(
      parseWorkflowAssistantPayload({
        answer: JSON.stringify({
          answer: "답변",
          scenario: "symptom_counsel",
          nextSessionMemory: {
            compactSummary: "요약",
          },
          nextProfileMemory: {
            lastEmotionTone: "anxious",
          },
        }),
      }),
    ).toEqual(
      expect.objectContaining({
        answer: "답변",
        scenario: "symptom_counsel",
        nextSessionMemory: expect.objectContaining({ compactSummary: "요약" }),
        nextProfileMemory: expect.objectContaining({
          lastEmotionTone: "anxious",
        }),
      }),
    );
  });

  it("prefers question follow-up over checklist and strips duplicate text", async () => {
    const followUp = await buildPromptFollowUpMessages({
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
    });

    expect(followUp.selectedQuestions).toHaveLength(1);
    expect(followUp.selectedChecklists).toHaveLength(0);

    const stripped = stripFollowUpContentFromAnswer(
      [
        {
          type: "text",
          id: "t1",
          text: "오늘 가장 걱정되는 점은 무엇인가요?\n수분 섭취 체크\n일단 휴식하세요.",
        },
      ],
      {
        checklists: [{ title: "수분 섭취 체크" }],
        questions: [{ question_text: "오늘 가장 걱정되는 점은 무엇인가요?" }],
      },
    );

    expect(stripped[0]).toEqual(
      expect.objectContaining({
        text: "일단 휴식하세요.",
      }),
    );
  });

  it("uses short quick reply labels and full checklist messages", async () => {
    const followUp = await buildPromptFollowUpMessages({
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
          code: "lie-down-left",
          title: "왼쪽으로 누워서 10분 쉬기",
          description: null,
          checklist_payload: null,
          display_order: 1,
          is_required: true,
        },
      ],
      questions: [],
    });

    expect(followUp.selectedQuestions).toHaveLength(0);
    expect(followUp.selectedChecklists).toHaveLength(1);
    expect(followUp.messages[0]?.parts[1]).toEqual(
      expect.objectContaining({
        type: "quickReplies",
        choices: [
          expect.objectContaining({
            label: "했어요",
            message: "했어요",
          }),
          expect.objectContaining({
            label: "안 했어요",
            message: "안 했어요",
          }),
          expect.objectContaining({
            label: "왜 해야 하나요?",
            message: "왜 해야 하나요?",
          }),
        ],
      }),
    );
  });
});

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
    questions,
    sessionMemory,
    profileMemory,
    tonePreference = null,
  }: {
    existingPromptEvents?: boolean;
    outstandingPromptEvents?: boolean;
    questions?: Array<{
      id: string;
      code: string;
      question_text: string;
      question_type: string;
      help_text: string;
      question_payload: Record<string, unknown>;
      display_order: number;
      is_required: boolean;
    }>;
    sessionMemory?: Record<string, unknown> | null;
    profileMemory?: Record<string, unknown> | null;
    tonePreference?: string | null;
  }) {
    mockedSupabaseSelect.mockImplementation((path: string) => {
      if (path.startsWith("chat_sessions?")) {
        if (path.includes("select=id,title&")) {
          return Promise.resolve([]);
        }

        return Promise.resolve(
          sessionMemory
            ? [
                {
                  id: "session-1",
                  title: "새 상담",
                  memory_payload: sessionMemory,
                },
              ]
            : [],
        );
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
            pregnancy_day_in_week: 1,
            onboarding_payload: {
              tonePreference,
              ...(profileMemory ? { profileMemory } : {}),
            },
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
        return Promise.resolve(
          questions ?? [
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
          ],
        );
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

  it("appends today's question first and creates only question sent events once per session", async () => {
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

    const originalMathRandom = Math.random;
    Math.random = jest.fn(() => 0.1);

    try {
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
      const followUps = payload.assistantMessages.slice(1);
      const hasQuestion = followUps.some(
        (m: { parts: Array<{ id: string }> }) =>
          m.parts.some((p) => p.id === "question-text-question-1"),
      );
      const hasChecklist = followUps.some(
        (m: { parts: Array<{ id: string }> }) =>
          m.parts.some((p) => p.id === "checklist-check-1"),
      );

      expect(hasQuestion).toBe(true);
      expect(hasChecklist).toBe(false);
      const questionMessage = followUps.find(
        (m: {
          parts: Array<{
            id: string;
            tag?: string;
            contentId?: string;
            contentCode?: string;
          }>;
        }) => m.parts.some((p) => p.id === "question-text-question-1"),
      );
      const questionTextPart = questionMessage?.parts.find(
        (p: { id: string }) => p.id === "question-text-question-1",
      );
      const questionQuickRepliesPart = questionMessage?.parts.find(
        (p: { id: string }) => p.id === "quick-replies-question-question-1",
      );

      expect(questionTextPart).toEqual(
        expect.objectContaining({
          tag: "question",
          contentId: "question-1",
          contentCode: "main-concern",
        }),
      );
      expect(questionQuickRepliesPart).toEqual(
        expect.objectContaining({
          tag: "question",
          contentId: "question-1",
          contentCode: "main-concern",
        }),
      );
      expect(mockedSupabaseInsert).toHaveBeenCalledWith(
        "user_question_events",
        expect.objectContaining({
          user_id: "user-1",
          question_id: "question-1",
          status: "sent",
        }),
      );
      expect(
        mockedSupabaseInsert.mock.calls.some(
          ([table]) => table === "user_checklist_events",
        ),
      ).toBe(false);
      expect(mockedSupabaseSelect).toHaveBeenCalledWith(
        expect.stringContaining("calendar_logs?select=id"),
      );
      expect(mockedSupabaseInsert).toHaveBeenCalledWith(
        "calendar_logs",
        expect.objectContaining({
          user_id: "user-1",
          entry_type: "chat_saved",
          summary: expect.any(String),
          payload: expect.objectContaining({
            assistantSummary: expect.any(String),
          }),
        }),
      );
    } finally {
      Math.random = originalMathRandom;
    }
  });

  it("includes explicit checklist metadata on checklist follow-up parts", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockPromptContext({
      questions: [],
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
    const followUps = payload.assistantMessages.slice(1);
    const checklistMessage = followUps.find(
      (m: {
        parts: Array<{
          id: string;
          tag?: string;
          contentId?: string;
          contentCode?: string;
        }>;
      }) => m.parts.some((p) => p.id === "checklist-check-1"),
    );
    const checklistTextPart = checklistMessage?.parts.find(
      (p: { id: string }) => p.id === "checklist-check-1",
    );
    const checklistQuickRepliesPart = checklistMessage?.parts.find(
      (p: { id: string }) => p.id === "quick-replies-checklist-check-1",
    );

    expect(checklistTextPart).toEqual(
      expect.objectContaining({
        tag: "checklist",
        contentId: "check-1",
        contentCode: "drink-water",
      }),
    );
    expect(checklistQuickRepliesPart).toEqual(
      expect.objectContaining({
        tag: "checklist",
        contentId: "check-1",
        contentCode: "drink-water",
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
          sessionId: "11111111-1111-4111-8111-111111111111",
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
    expect(mockedSupabaseInsert).toHaveBeenCalledWith(
      "calendar_logs",
      expect.objectContaining({
        user_id: "user-1",
        session_id: "11111111-1111-4111-8111-111111111111",
        entry_type: "survey_response",
        title: "하루 질문 답변",
        summary: "오늘은 괜찮아요",
        payload: expect.objectContaining({
          source: "chat_question_answer",
          questionId: "question-1",
          answer: "오늘은 괜찮아요",
          answerMessageId: "user-message-2",
          eventId: "event-question-1",
        }),
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
      inputs: expect.objectContaining({
        query: "배가 아파요",
        currentWeek: 13,
        sessionId: expect.any(String),
        hasImages: false,
      }),
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

  it("renders workflow guardrail notice when the workflow returns structured JSON", async () => {
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
          type: "text",
          text: expect.stringContaining("응급 신호 가능성"),
        }),
        expect.objectContaining({
          type: "text",
          text: expect.stringContaining("지금은 무리하지 말고"),
        }),
      ]),
    );
    expect(payload.assistantMessage.parts).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "image",
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
          parts: [
            { type: "text", id: "p-retry", text: "재시도 후 정상 JSON 응답" },
          ],
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
      text: expect.stringContaining("13주차 기준"),
    });
    expect(payload.assistantMessage.parts).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "deepLink" })]),
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

  it("loads session/profile memory into Schift workflow inputs", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockPromptContext({
      sessionMemory: {
        compactSummary: "최근 복통과 수분 부족 이야기를 나눴어요.",
        lastScenario: "symptom_counsel",
        lastCharacterTone: "anxious",
      },
      profileMemory: {
        lastEmotionTone: "tired",
      },
      tonePreference: "차분하게",
    });
    mockedSupabaseInsert.mockImplementation(
      (table: string, payload: object | object[]) => {
        if (table === "chat_sessions") {
          return Promise.resolve([]);
        }

        if (table === "chat_messages") {
          if (Array.isArray(payload)) {
            return Promise.resolve([{ id: "assistant-message-memory" }]);
          }

          return Promise.resolve([{ id: "user-message-memory" }]);
        }

        return Promise.resolve([]);
      },
    );
    mockedSupabaseUpdate.mockResolvedValue([]);
    mockedGetSchiftClient.mockReturnValue({
      workflows: { run: jest.fn() },
    } as never);
    mockedRunSchiftWorkflow.mockResolvedValue({
      workflowId: "wf-memory",
      run: {
        id: "run-memory",
        workflow_id: "wf-memory",
        status: "completed",
        outputs: { answer: "이전 맥락을 이어서 안내할게요." },
        block_states: [],
      },
    } as never);

    const response = await POST(
      new Request("http://localhost:3000/api/mobile/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          sessionId: "session-1",
          text: "그럼 지금은 어떻게 해야 해?",
          pregnancyWeek: 13,
        }),
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(mockedRunSchiftWorkflow).toHaveBeenCalledWith({
      schift: expect.any(Object),
      inputs: expect.objectContaining({
        query: "그럼 지금은 어떻게 해야 해?",
        currentWeek: 13,
        compactSummary: "최근 복통과 수분 부족 이야기를 나눴어요.",
        lastScenario: "symptom_counsel",
        lastCharacterTone: "anxious",
        lastEmotionTone: "tired",
        tonePreference: "차분하게",
      }),
    });
  });

  it("injects session/profile memory into fallback model prompt", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockPromptContext({
      sessionMemory: {
        compactSummary: "최근 복통과 수분 부족 이야기를 나눴어요.",
        lastScenario: "symptom_counsel",
        lastCharacterTone: "anxious",
      },
      profileMemory: {
        lastEmotionTone: "tired",
      },
      tonePreference: "차분하게",
    });
    mockedSupabaseInsert.mockImplementation(
      (table: string, payload: object | object[]) => {
        if (table === "chat_sessions") {
          return Promise.resolve([]);
        }

        if (table === "chat_messages") {
          if (Array.isArray(payload)) {
            return Promise.resolve([
              { id: "assistant-message-fallback-memory" },
            ]);
          }

          return Promise.resolve([{ id: "user-message-fallback-memory" }]);
        }

        return Promise.resolve([]);
      },
    );
    mockedSupabaseUpdate.mockResolvedValue([]);
    mockedGetSchiftClient.mockReturnValue(null);

    await POST(
      new Request("http://localhost:3000/api/mobile/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          sessionId: "session-1",
          text: "계속 배가 묵직해",
          pregnancyWeek: 13,
        }),
      }) as never,
    );

    expect(mockedGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining(
          "최근 세션 요약: 최근 복통과 수분 부족 이야기를 나눴어요.",
        ),
        prompt: expect.stringContaining("최근 감정 톤: tired"),
      }),
    );
    expect(mockedGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining(
          "아기 정보와 엄마 정보를 한 answer에 섞지 마세요",
        ),
      }),
    );
    expect(mockedGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("주간 질문은 answer 안에 합쳐 쓰지 마세요"),
      }),
    );
  });

  it("stores workflow-provided nextSessionMemory after assistant response", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockPromptContext({
      profileMemory: {
        lastEmotionTone: "tired",
      },
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
                role === "assistant"
                  ? "assistant-message-memory-store"
                  : "user-message-memory-store",
            },
          ]);
        }

        return Promise.resolve([]);
      },
    );
    mockedSupabaseUpdate.mockResolvedValue([]);
    mockedGetSchiftClient.mockReturnValue({
      workflows: { run: jest.fn() },
    } as never);
    mockedRunSchiftWorkflow.mockResolvedValue({
      workflowId: "wf-memory-store",
      run: {
        id: "run-memory-store",
        workflow_id: "wf-memory-store",
        status: "completed",
        outputs: {
          answer: JSON.stringify({
            answer: "수분을 챙기고 쉬면서 증상 변화를 봐주세요.",
            scenario: "symptom_counsel",
            characterTone: "calm",
            nextSessionMemory: {
              compactSummary:
                "배가 뭉치는 느낌을 상담했고 수분과 휴식을 먼저 권했어요.",
              lastScenario: "symptom_counsel",
              lastCharacterTone: "calm",
              lastEmotionTone: "tired",
            },
          }),
        },
        block_states: [],
      },
    } as never);

    await POST(
      new Request("http://localhost:3000/api/mobile/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          sessionId: "session-1",
          text: "배가 뭉치는 느낌이 있어",
          pregnancyWeek: 13,
        }),
      }) as never,
    );

    expect(mockedSupabaseUpdate).toHaveBeenCalledWith(
      expect.stringContaining("chat_sessions?id=eq."),
      expect.objectContaining({
        memory_payload: expect.objectContaining({
          compactSummary:
            "배가 뭉치는 느낌을 상담했고 수분과 휴식을 먼저 권했어요.",
          lastScenario: "symptom_counsel",
          lastCharacterTone: "calm",
          lastEmotionTone: "tired",
        }),
      }),
    );
  });

  it("stores workflow-provided nextProfileMemory by merging onboarding payload", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockPromptContext({
      profileMemory: {
        lastEmotionTone: "tired",
      },
      tonePreference: "차분하게",
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
                role === "assistant"
                  ? "assistant-message-profile-memory"
                  : "user-message-profile-memory",
            },
          ]);
        }

        return Promise.resolve([]);
      },
    );
    mockedSupabaseUpdate.mockResolvedValue([]);
    mockedGetSchiftClient.mockReturnValue({
      workflows: { run: jest.fn() },
    } as never);
    mockedRunSchiftWorkflow.mockResolvedValue({
      workflowId: "wf-profile-memory",
      run: {
        id: "run-profile-memory",
        workflow_id: "wf-profile-memory",
        status: "completed",
        outputs: {
          answer: JSON.stringify({
            answer:
              "오늘은 조금 불안한 마음이 느껴졌어요. 천천히 숨을 고르고 쉬어보세요.",
            nextProfileMemory: {
              lastEmotionTone: "anxious",
            },
          }),
        },
        block_states: [],
      },
    } as never);

    await POST(
      new Request("http://localhost:3000/api/mobile/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          sessionId: "session-1",
          text: "계속 마음이 불안해",
          pregnancyWeek: 13,
        }),
      }) as never,
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

  it("dispatches workflow persona memory through the internal webhook", async () => {
    const originalFetch = global.fetch;
    process.env.CRON_SECRET = "test-cron-secret";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "",
    });
    global.fetch = fetchMock as never;
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockPromptContext({
      tonePreference: "차분하게",
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
                role === "assistant"
                  ? "assistant-message-persona"
                  : "user-message-persona",
            },
          ]);
        }

        return Promise.resolve([]);
      },
    );
    mockedSupabaseUpdate.mockResolvedValue([]);
    mockedGetSchiftClient.mockReturnValue({
      workflows: { run: jest.fn() },
    } as never);
    mockedRunSchiftWorkflow.mockResolvedValue({
      workflowId: "wf-persona",
      run: {
        id: "run-persona",
        workflow_id: "wf-persona",
        status: "completed",
        outputs: {
          answer: JSON.stringify({
            answer: "기준을 차분히 같이 볼게요.",
            nextProfileMemory: {
              personaHint: "practical",
              personaConfidence: "medium",
              personaEvidence: "태동 기준을 구체적으로 질문함",
            },
          }),
        },
        block_states: [],
      },
    } as never);

    try {
      await POST(
        new Request("http://localhost:3000/api/mobile/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "user-1",
            sessionId: "session-1",
            text: "태동 기준 알려줘",
            pregnancyWeek: 13,
          }),
        }) as never,
      );

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/api/internal/persona-signals",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-cron-secret",
            "Content-Type": "application/json",
          }),
          body: expect.stringContaining('"personaHint":"practical"'),
        }),
      );
      expect(mockedSupabaseInsert).not.toHaveBeenCalledWith(
        "user_persona_signals",
        expect.anything(),
      );
    } finally {
      global.fetch = originalFetch;
      delete process.env.CRON_SECRET;
      delete process.env.NEXT_PUBLIC_APP_URL;
    }
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
            return Promise.resolve([
              { id: "assistant-message-provider-aware" },
            ]);
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
