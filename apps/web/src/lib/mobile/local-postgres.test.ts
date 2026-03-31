describe("ensureLocalPostgresReady", () => {
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

  test("inserts chat sessions before seed data that references them", async () => {
    const queryMock = jest.fn().mockResolvedValue({ rows: [] });

    jest.doMock("pg", () => ({
      Pool: jest.fn().mockImplementation(() => ({
        query: queryMock,
      })),
      types: {
        setTypeParser: jest.fn(),
      },
    }));

    const { ensureLocalPostgresReady } = await import("./local-postgres");

    await ensureLocalPostgresReady();

    const queries = queryMock.mock.calls.map(([sql]) => String(sql));
    const chatSessionInsertIndex = queries.findIndex((sql) =>
      sql.includes('INSERT INTO "gynecology_local"."chat_sessions"'),
    );
    const calendarLogInsertIndex = queries.findIndex((sql) =>
      sql.includes('INSERT INTO "gynecology_local"."calendar_logs"'),
    );

    expect(chatSessionInsertIndex).toBeGreaterThanOrEqual(0);
    expect(calendarLogInsertIndex).toBeGreaterThanOrEqual(0);
    expect(chatSessionInsertIndex).toBeLessThan(calendarLogInsertIndex);
  });

  test("throws when required local bootstrap env is missing", async () => {
    const queryMock = jest.fn().mockResolvedValue({ rows: [] });

    delete process.env.NEXT_PUBLIC_DEV_USER_ID;
    delete process.env.EXPO_PUBLIC_DEV_USER_ID;

    jest.doMock("pg", () => ({
      Pool: jest.fn().mockImplementation(() => ({
        query: queryMock,
      })),
      types: {
        setTypeParser: jest.fn(),
      },
    }));

    const { ensureLocalPostgresReady } = await import("./local-postgres");

    await expect(ensureLocalPostgresReady()).rejects.toThrow(
      "NEXT_PUBLIC_DEV_USER_ID or EXPO_PUBLIC_DEV_USER_ID is required",
    );
  });

  test("seeds fruit-based baby size comparisons for pregnancy week data", async () => {
    const queryMock = jest.fn().mockResolvedValue({ rows: [] });

    jest.doMock("pg", () => ({
      Pool: jest.fn().mockImplementation(() => ({
        query: queryMock,
      })),
      types: {
        setTypeParser: jest.fn(),
      },
    }));

    const { ensureLocalPostgresReady } = await import("./local-postgres");

    await ensureLocalPostgresReady();

    const pregnancyWeekDataCalls = queryMock.mock.calls.filter(([sql]) =>
      String(sql).includes(
        'INSERT INTO "gynecology_local"."content_pregnancy_week_data"',
      ),
    );
    const week5Params = pregnancyWeekDataCalls.find(
      ([, params]) => Array.isArray(params) && params[1] === 5,
    )?.[1];
    const week25Params = pregnancyWeekDataCalls.find(
      ([, params]) => Array.isArray(params) && params[1] === 25,
    )?.[1];

    expect(week5Params).toEqual(expect.arrayContaining(["참깨알", "참깨알"]));
    expect(week25Params).toEqual(expect.arrayContaining(["단호박", "단호박"]));
  });
});
