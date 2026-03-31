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

jest.mock("@/lib/supabase/admin-client", () => {
  const { supabaseInsert, supabaseSelect, supabaseUpdate } = jest.requireMock(
    "@/lib/mobile/supabase-rest",
  ) as {
    supabaseInsert: jest.Mock;
    supabaseSelect: jest.Mock;
    supabaseUpdate: jest.Mock;
  };

  class QueryBuilder {
    private readonly schema?: string;
    private readonly table: string;
    private readonly mode: "select" | "insert" | "update";
    private readonly columns?: string;
    private readonly payload?: unknown;
    private readonly filters: string[] = [];
    private readonly orders: string[] = [];
    private limitValue?: number;

    constructor(input: {
      schema?: string;
      table: string;
      mode: "select" | "insert" | "update";
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

    order(column: string, options: { ascending?: boolean } = {}) {
      this.orders.push(
        `${column}.${options.ascending === false ? "desc" : "asc"}`,
      );
      return this;
    }

    limit(value: number) {
      this.limitValue = value;
      return this;
    }

    select(columns?: string) {
      if (this.mode === "insert" || this.mode === "update") {
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

    then(resolve: (value: { data: unknown; error: null }) => unknown) {
      const relation = this.schema
        ? `${this.schema}.${this.table}`
        : this.table;
      const params: string[] = [];
      if (this.mode === "select") params.push(`select=${this.columns ?? "*"}`);
      params.push(...this.filters);
      if (this.orders.length > 0) params.push(`order=${this.orders.join(",")}`);
      if (typeof this.limitValue === "number")
        params.push(`limit=${this.limitValue}`);
      const path =
        params.length > 0 ? `${relation}?${params.join("&")}` : relation;
      const source =
        this.mode === "select"
          ? supabaseSelect(path)
          : this.mode === "insert"
            ? supabaseInsert(relation, this.payload)
            : supabaseUpdate(path, this.payload);
      return Promise.resolve(source).then((data) =>
        resolve({ data, error: null }),
      );
    }
  }

  return {
    getSupabaseAdminClient: () => ({
      from: (table: string) =>
        new QueryBuilder({ table, mode: "select", schema: undefined }),
      schema: (schema: string) => ({
        from: (table: string) =>
          new QueryBuilder({ table, mode: "select", schema }),
      }),
    }),
  };
});

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
