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
});
