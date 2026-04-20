describe("localSupabaseSelect filter support", () => {
  const originalEnv = {
    DATABASE_URL: process.env.DATABASE_URL,
    LOCAL_DB_SCHEMA: process.env.LOCAL_DB_SCHEMA,
    PHONE_DATA_SECRET: process.env.PHONE_DATA_SECRET,
    NEXT_PUBLIC_DEV_USER_ID: process.env.NEXT_PUBLIC_DEV_USER_ID,
    EXPO_PUBLIC_DEV_USER_ID: process.env.EXPO_PUBLIC_DEV_USER_ID,
    LOCAL_DEV_USER_PHONE_NUMBER: process.env.LOCAL_DEV_USER_PHONE_NUMBER,
    LOCAL_DEV_USER_NAME: process.env.LOCAL_DEV_USER_NAME,
    LOCAL_ADMIN_USER_ID: process.env.LOCAL_ADMIN_USER_ID,
    LOCAL_ADMIN_PHONE_NUMBER: process.env.LOCAL_ADMIN_PHONE_NUMBER,
    LOCAL_ADMIN_NAME: process.env.LOCAL_ADMIN_NAME,
    LOCAL_DEV_DUE_DATE: process.env.LOCAL_DEV_DUE_DATE,
  };

  beforeEach(() => {
    jest.resetModules();
    process.env.DATABASE_URL = "postgresql://test";
    process.env.LOCAL_DB_SCHEMA = "gynecology_local";
    process.env.PHONE_DATA_SECRET = "test-secret-key-must-be-32bytes!";
    process.env.NEXT_PUBLIC_DEV_USER_ID = "local-user-demo";
    process.env.LOCAL_DEV_USER_PHONE_NUMBER = "01012345678";
    process.env.LOCAL_DEV_USER_NAME = "김수아";
    process.env.LOCAL_ADMIN_USER_ID = "local-admin-1";
    process.env.LOCAL_ADMIN_PHONE_NUMBER = "01099998888";
    process.env.LOCAL_ADMIN_NAME = "운영자";
    process.env.LOCAL_DEV_DUE_DATE = "2026-07-01";
  });

  afterEach(() => {
    Object.entries(originalEnv).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key as keyof NodeJS.ProcessEnv];
      } else {
        process.env[key as keyof NodeJS.ProcessEnv] = value;
      }
    });
  });

  test("supports lte filters used by mobile home calendar range queries", async () => {
    const queryMock = jest.fn().mockResolvedValue({ rows: [] });

    jest.doMock("pg", () => ({
      Pool: jest.fn().mockImplementation(() => ({
        query: queryMock,
      })),
      types: {
        setTypeParser: jest.fn(),
      },
    }));

    const { localSupabaseSelect } = await import("./local-postgres");

    await localSupabaseSelect(
      "calendar_logs?select=date,summary,entry_type&user_id=eq.local-user-demo&date=gte.2026-04-01&date=lte.2026-04-31",
    );

    const executedSql = queryMock.mock.calls.at(-1)?.[0];
    expect(String(executedSql)).toContain('"date" <= $3');
  });

  test("supports is.null filters used by today checklist fallback queries", async () => {
    const queryMock = jest.fn().mockResolvedValue({ rows: [] });

    jest.doMock("pg", () => ({
      Pool: jest.fn().mockImplementation(() => ({
        query: queryMock,
      })),
      types: {
        setTypeParser: jest.fn(),
      },
    }));

    const { localSupabaseSelect } = await import("./local-postgres");

    await localSupabaseSelect(
      "content_week_checklists?select=id,title&week_data_id=eq.week-29&day_number=is.null&is_active=eq.true&order=display_order.asc",
    );

    const executedSql = queryMock.mock.calls.at(-1)?.[0];
    expect(String(executedSql)).toContain('"day_number" IS NULL');
  });

  test("supports in filters used by today checklist event queries", async () => {
    const queryMock = jest.fn().mockResolvedValue({ rows: [] });

    jest.doMock("pg", () => ({
      Pool: jest.fn().mockImplementation(() => ({
        query: queryMock,
      })),
      types: {
        setTypeParser: jest.fn(),
      },
    }));

    const { localSupabaseSelect } = await import("./local-postgres");

    await localSupabaseSelect(
      "user_checklist_events?select=checklist_id,status&user_id=eq.local-user-demo&checklist_id=in.(week-checklist-29-4-hydration-rest,week-checklist-29-general-symptom-log)",
    );

    const executedSql = queryMock.mock.calls.at(-1)?.[0];
    const executedParams = queryMock.mock.calls.at(-1)?.[1];
    expect(String(executedSql)).toContain('"checklist_id" = ANY');
    expect(executedParams?.[1]).toEqual([
      "week-checklist-29-4-hydration-rest",
      "week-checklist-29-general-symptom-log",
    ]);
  });
});
