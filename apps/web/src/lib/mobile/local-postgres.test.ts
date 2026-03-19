describe("ensureLocalPostgresReady", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.DATABASE_URL = "postgresql://test";
    process.env.LOCAL_DB_SCHEMA = "gynecology_local";
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

    const pregnancyWeekDataCalls = queryMock.mock.calls.filter(
      ([sql]) =>
        String(sql).includes('INSERT INTO "gynecology_local"."pregnancy_week_data"'),
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
