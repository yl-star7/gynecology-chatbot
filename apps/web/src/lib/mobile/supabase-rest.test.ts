jest.mock("./local-postgres", () => ({
  localSupabaseDelete: jest.fn(),
  localSupabaseInsert: jest.fn(),
  localSupabaseRpc: jest.fn(),
  localSupabaseSelect: jest.fn(),
  localSupabaseUpdate: jest.fn(),
}));

type Operation =
  | { type: "schema"; value: string }
  | { type: "from"; value: string }
  | { type: "select"; value: string }
  | { type: "eq"; column: string; value: string }
  | { type: "is"; column: string; value: boolean | null }
  | { type: "not"; column: string; operator: string; value: string }
  | { type: "in"; column: string; value: string[] }
  | { type: "gte"; column: string; value: string }
  | {
      type: "order";
      column: string;
      options: { ascending?: boolean; nullsFirst?: boolean };
    }
  | { type: "limit"; value: number };

const operations: Operation[] = [];

class MockQueryBuilder {
  eq(column: string, value: string) {
    operations.push({ type: "eq", column, value });
    return this;
  }

  is(column: string, value: boolean | null) {
    operations.push({ type: "is", column, value });
    return this;
  }

  not(column: string, operator: string, value: string) {
    operations.push({ type: "not", column, operator, value });
    return this;
  }

  in(column: string, value: string[]) {
    operations.push({ type: "in", column, value });
    return this;
  }

  gte(column: string, value: string) {
    operations.push({ type: "gte", column, value });
    return this;
  }

  lte() {
    return this;
  }

  lt() {
    return this;
  }

  gt() {
    return this;
  }

  order(
    column: string,
    options: { ascending?: boolean; nullsFirst?: boolean } = {},
  ) {
    operations.push({ type: "order", column, options });
    return this;
  }

  limit(value: number) {
    operations.push({ type: "limit", value });
    return this;
  }

  then(resolve: (value: { data: unknown[]; error: null }) => unknown) {
    return Promise.resolve(resolve({ data: [], error: null }));
  }
}

class MockTableBuilder {
  select(value: string) {
    operations.push({ type: "select", value });
    return new MockQueryBuilder();
  }

  insert() {
    return new MockQueryBuilder();
  }

  update() {
    return new MockQueryBuilder();
  }

  delete() {
    return new MockQueryBuilder();
  }
}

const createClient = jest.fn(() => ({
  schema: (schema: string) => {
    operations.push({ type: "schema", value: schema });
    return {
      from: (relation: string) => {
        operations.push({ type: "from", value: relation });
        return new MockTableBuilder();
      },
    };
  },
  rpc: jest.fn(),
}));

jest.mock("@supabase/supabase-js", () => ({
  createClient,
}));

describe("supabase admin client helpers", () => {
  beforeEach(() => {
    operations.length = 0;
    createClient.mockClear();
    process.env.SERVER_DATA_PROVIDER = "supabase";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  });

  it("routes content schema reads through supabase-js with current filter semantics", async () => {
    const { supabaseSelect } = await import("@/lib/supabase/admin-client");

    await supabaseSelect(
      "content.week_questions?select=id&phone_number_blind_index=eq.idx%3A%2B8210&push_token=not.is.null&question_id=in.(q1,q2)&created_at=gte.2026-03-01T00:00:00Z&order=day_number.asc.nullslast,display_order.desc.nullsfirst&limit=1",
    );

    expect(operations).toEqual(
      expect.arrayContaining([
        { type: "schema", value: "content" },
        { type: "from", value: "week_questions" },
        { type: "select", value: "id" },
        {
          type: "eq",
          column: "phone_number_blind_index",
          value: "idx:+8210",
        },
        { type: "not", column: "push_token", operator: "is", value: "null" },
        { type: "in", column: "question_id", value: ["q1", "q2"] },
        {
          type: "gte",
          column: "created_at",
          value: "2026-03-01T00:00:00Z",
        },
        {
          type: "order",
          column: "day_number",
          options: { ascending: true, nullsFirst: false },
        },
        {
          type: "order",
          column: "display_order",
          options: { ascending: false, nullsFirst: true },
        },
        { type: "limit", value: 1 },
      ]),
    );
  });

  it("uses public schema by default", async () => {
    const { supabaseSelect } = await import("@/lib/supabase/admin-client");

    await supabaseSelect(
      "published_weeks?select=week_number&week_number=eq.5&limit=1",
    );

    expect(operations).toEqual(
      expect.arrayContaining([
        { type: "schema", value: "public" },
        { type: "from", value: "published_weeks" },
        { type: "select", value: "week_number" },
        { type: "eq", column: "week_number", value: "5" },
        { type: "limit", value: 1 },
      ]),
    );
  });
});
