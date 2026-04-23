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
    jest.useFakeTimers({
      now: new Date("2026-04-15T00:00:00+09:00"),
    });
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
    jest.useRealTimers();
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

  test("seeds local onboarding defaults without marking onboarding complete", async () => {
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

    const pregnancyProfileParams = queryMock.mock.calls.find(([sql]) =>
      String(sql).includes('INSERT INTO "gynecology_local"."pregnancy_profiles"'),
    )?.[1];

    expect(pregnancyProfileParams).toBeDefined();
    expect(JSON.parse(String(pregnancyProfileParams?.[7]))).toEqual({
      pregnancyWeekOrDueDate: "29",
      tonePreference: "차분하게",
      babyNickname: "튼튼이",
      notificationTime: "08:30",
      themeKey: "default",
    });
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

  test("seeds published content_pregnancy_week_data rows for mobile APIs", async () => {
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
    const week1Params = pregnancyWeekDataCalls.find(
      ([, params]) => Array.isArray(params) && params[1] === 1,
    )?.[1];

    expect(week1Params).toBeDefined();
    expect(week1Params?.[7]).toBe("published");
  });

  test("updates existing content_pregnancy_week_data rows to published during reseed", async () => {
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

    const weekUpsertSql = queryMock.mock.calls.find(([sql]) =>
      String(sql).includes('INSERT INTO "gynecology_local"."content_pregnancy_week_data"'),
    )?.[0];

    expect(String(weekUpsertSql)).toContain("status = EXCLUDED.status");
  });

  test("seeds today tab content rows for the default local pregnancy week", async () => {
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

    const weekDataParams = queryMock.mock.calls.find(
      ([sql, params]) =>
        String(sql).includes('INSERT INTO "gynecology_local"."content_pregnancy_week_data"') &&
        Array.isArray(params) &&
        params[1] === 29,
    )?.[1];
    const dayContentParams = queryMock.mock.calls.find(
      ([sql, params]) =>
        String(sql).includes('INSERT INTO "gynecology_local"."content_pregnancy_day_contents"') &&
        Array.isArray(params) &&
        params[1] === "pregnancy-week-data-29" &&
        params[2] === 4,
    )?.[1];
    const checklistParams = queryMock.mock.calls.find(
      ([sql, params]) =>
        String(sql).includes('INSERT INTO "gynecology_local"."content_week_checklists"') &&
        Array.isArray(params) &&
        params[1] === "pregnancy-week-data-29",
    )?.[1];

    expect(weekDataParams?.[5]).toBe("29주 아기는 하루하루 힘을 키우며 바깥 세상을 만날 준비를 하고 있어요.");
    expect(weekDataParams?.[6]).toBe("엄마 몸은 배뭉침과 피로를 더 자주 느낄 수 있어 쉬는 시간을 더 의식적으로 챙기는 게 좋아요.");
    expect(dayContentParams?.[4]).toBe(
      JSON.stringify({
        items: ["29주 4일 아기는 감각을 더 또렷하게 느끼고, 잠과 깸의 리듬을 만들어가요."],
      }),
    );
    expect(dayContentParams?.[5]).toBe("아기의 움직임이 규칙적으로 느껴지는지 편안한 자세에서 천천히 살펴보세요.");
    expect(dayContentParams?.[6]).toBe(
      JSON.stringify({
        items: ["엄마는 허리와 골반이 쉽게 뻐근할 수 있어 자세를 자주 바꿔주는 것이 도움이 돼요."],
      }),
    );
    expect(checklistParams).toEqual(
      expect.arrayContaining([
        "pregnancy-week-data-29",
        "hydration-rest",
        "물 자주 마시고 쉬는 시간 챙기기",
      ]),
    );
  });

  test("uses idempotent upsert SQL for reseeding today tab day contents and checklists", async () => {
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

    const dayContentUpsertSql = queryMock.mock.calls.find(([sql]) =>
      String(sql).includes('INSERT INTO "gynecology_local"."content_pregnancy_day_contents"'),
    )?.[0];
    const checklistUpsertSql = queryMock.mock.calls.find(([sql]) =>
      String(sql).includes('INSERT INTO "gynecology_local"."content_week_checklists"'),
    )?.[0];

    expect(String(dayContentUpsertSql)).toContain("ON CONFLICT (week_data_id, day_number) DO UPDATE");
    expect(String(dayContentUpsertSql)).toContain("id = EXCLUDED.id");
    expect(String(checklistUpsertSql)).toContain("ON CONFLICT (id) DO UPDATE");
    expect(String(checklistUpsertSql)).toContain("code = EXCLUDED.code");
  });

  test("uses id-based upsert SQL for generic checklist rows with null day_number", async () => {
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

    const genericChecklistUpsertSql = queryMock.mock.calls.find(
      ([sql, params]) =>
        String(sql).includes('INSERT INTO "gynecology_local"."content_week_checklists"') &&
        Array.isArray(params) &&
        params[0] === "week-checklist-29-general-symptom-log",
    )?.[0];

    expect(String(genericChecklistUpsertSql)).toContain("ON CONFLICT (id) DO UPDATE");
  });
});
