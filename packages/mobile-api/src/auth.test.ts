jest.mock("@/lib/db/admin-client", () => ({
  dbInsert: jest.fn(),
  dbSelect: jest.fn(),
  dbUpdate: jest.fn(),
}));

jest.mock("@gynecology-chatbot/db/prisma", () => {
  function getDbMocks() {
    return jest.requireMock("@/lib/db/admin-client") as {
      dbInsert: jest.Mock;
      dbSelect: jest.Mock;
      dbUpdate: jest.Mock;
    };
  }

  function selectedColumns(select: Record<string, unknown> | undefined) {
    if (!select) return "*";
    const columns = Object.entries(select)
      .filter(([, included]) => Boolean(included))
      .map(([column]) => column);
    return columns.length > 0 ? columns.join(",") : "*";
  }

  function filterParams(where: Record<string, unknown> | undefined) {
    if (!where) return [];
    return Object.entries(where).map(([column, value]) => {
      if (value === null) return `${column}=is.null`;
      return `${column}=eq.${String(value)}`;
    });
  }

  function pathFor(
    model: string,
    args: {
      select?: Record<string, unknown>;
      where?: Record<string, unknown>;
    } = {},
  ) {
    return `${model}?${[
      `select=${selectedColumns(args.select)}`,
      ...filterParams(args.where),
      "limit=1",
    ].join("&")}`;
  }

  function toDate(value: unknown) {
    if (!value || value instanceof Date) return value;
    if (typeof value !== "string") return value;
    return new Date(value.includes("T") ? value : `${value}T00:00:00`);
  }

  function normalizeRow(model: string, row: Record<string, unknown> | null) {
    if (!row) return null;
    if (model === "users") {
      return {
        ...row,
        phone_verified_at: toDate(row.phone_verified_at),
        last_login_at: toDate(row.last_login_at),
      };
    }
    if (model === "pregnancy_profiles") {
      return {
        ...row,
        due_date: toDate(row.due_date),
        notification_time: row.notification_time
          ? toDate(`1970-01-01T${row.notification_time}`)
          : row.notification_time,
      };
    }
    return row;
  }

  async function firstRow(model: string, args = {}) {
    const { dbSelect } = getDbMocks();
    const rows = await dbSelect(pathFor(model, args));
    return normalizeRow(model, Array.isArray(rows) ? (rows[0] ?? null) : null);
  }

  function createDelegate(model: string) {
    return {
      findUnique: jest.fn((args = {}) => firstRow(model, args)),
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const { dbInsert } = getDbMocks();
        const rows = await dbInsert(model, data);
        return Array.isArray(rows) ? (rows[0] ?? data) : data;
      }),
      update: jest.fn(
        async ({
          where,
          data,
        }: {
          where?: Record<string, unknown>;
          data: Record<string, unknown>;
        }) => {
          const { dbUpdate } = getDbMocks();
          const rows = await dbUpdate(pathFor(model, { where }), data);
          return Array.isArray(rows) ? (rows[0] ?? data) : data;
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
          const { dbUpdate } = getDbMocks();
          await dbUpdate(pathFor(model, { where }), data);
          return { count: 1 };
        },
      ),
    };
  }

  return {
    Prisma: {},
    prisma: {
      auth_sessions: createDelegate("auth_sessions"),
      blocked_phone_numbers: createDelegate("blocked_phone_numbers"),
      phone_verification_requests: createDelegate("phone_verification_requests"),
      pregnancy_profiles: createDelegate("pregnancy_profiles"),
      users: createDelegate("users"),
    },
  };
});

jest.mock("@/lib/mobile/solapi-sms", () => {
  const actual = jest.requireActual("@/lib/mobile/solapi-sms");

  return {
    ...actual,
    checkSmsVerification: jest.fn(),
    sendSmsVerification: jest.fn(),
  };
});

jest.mock("@/lib/privacy/phone-crypto", () => ({
  computePhoneNumberBlindIndex: jest.fn(
    (phoneNumber: string) => `idx:${phoneNumber}`,
  ),
  createPhoneNumberStorage: jest.fn((phoneNumber: string) => ({
    phoneNumberEncrypted: `enc:${phoneNumber}`,
    phoneNumberBlindIndex: `idx:${phoneNumber}`,
    phoneNumberLast4: phoneNumber.slice(-4),
  })),
  decryptPhoneNumber: jest.fn((value: string) => value.replace(/^enc:/, "")),
}));

import {
  buildPregnancyProfilePayload,
  completePhoneSignIn,
  completeUserOnboarding,
} from "@/lib/mobile/auth";
import {
  dbInsert,
  dbSelect,
  dbUpdate,
} from "@/lib/db/admin-client";
import { checkSmsVerification } from "@/lib/mobile/solapi-sms";

const mockedSupabaseInsert = jest.mocked(dbInsert);
const mockedSupabaseSelect = jest.mocked(dbSelect);
const mockedSupabaseUpdate = jest.mocked(dbUpdate);
const mockedCheckSmsVerification = jest.mocked(checkSmsVerification);

describe("completePhoneSignIn", () => {
  beforeEach(() => {
    mockedSupabaseInsert.mockReset();
    mockedSupabaseSelect.mockReset();
    mockedSupabaseUpdate.mockReset();
    mockedCheckSmsVerification.mockReset();
    mockedSupabaseSelect.mockResolvedValue([]);
    mockedSupabaseInsert.mockResolvedValue([]);
    mockedSupabaseUpdate.mockResolvedValue([]);
  });

  test('creates a new user and falls back to "사용자" display name', async () => {
    mockedCheckSmsVerification.mockResolvedValue({
      sid: "check-1",
      status: "approved",
      to: "+821012345678",
    });
    mockedSupabaseSelect
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "user-1",
          phone_number_encrypted: "enc:+821012345678",
          phone_number_last4: "5678",
          account_status: "active",
          phone_verified_at: "2026-03-19T00:00:00.000Z",
          last_login_at: "2026-03-19T00:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "user-1",
          phone_number_encrypted: "enc:+821012345678",
          phone_number_last4: "5678",
          account_status: "active",
          phone_verified_at: "2026-03-19T00:00:00.000Z",
          last_login_at: "2026-03-19T00:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    mockedSupabaseInsert.mockResolvedValue([]);

    const result = await completePhoneSignIn("01012345678", "1234");

    expect(result.user.displayName).toBe("사용자");
  });

  test("creates a second new user with the same default display-name fallback", async () => {
    mockedCheckSmsVerification.mockResolvedValue({
      sid: "check-2",
      status: "approved",
      to: "+821055566677",
    });
    mockedSupabaseSelect
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "user-2",
          phone_number_encrypted: "enc:+821055566677",
          phone_number_last4: "6677",
          account_status: "active",
          phone_verified_at: "2026-03-19T00:00:00.000Z",
          last_login_at: "2026-03-19T00:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "user-2",
          phone_number_encrypted: "enc:+821055566677",
          phone_number_last4: "6677",
          account_status: "active",
          phone_verified_at: "2026-03-19T00:00:00.000Z",
          last_login_at: "2026-03-19T00:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    mockedSupabaseInsert.mockResolvedValue([]);

    const result = await completePhoneSignIn("01055566677", "1234");

    expect(result.user.displayName).toBe("사용자");
  });

  test("queries blocked numbers and users by blind index instead of plaintext phone number", async () => {
    mockedCheckSmsVerification.mockResolvedValue({
      sid: "check-3",
      status: "approved",
      to: "+821099998888",
    });
    mockedSupabaseSelect
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "user-3",
          phone_number_encrypted: "enc:+821099998888",
          phone_number_last4: "8888",
          account_status: "active",
          phone_verified_at: "2026-03-19T00:00:00.000Z",
          last_login_at: "2026-03-19T00:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "user-3",
          phone_number_encrypted: "enc:+821099998888",
          phone_number_last4: "8888",
          account_status: "active",
          phone_verified_at: "2026-03-19T00:00:00.000Z",
          last_login_at: "2026-03-19T00:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    mockedSupabaseInsert.mockResolvedValue([]);

    await completePhoneSignIn("01099998888", "1234");

    expect(mockedSupabaseSelect).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("phone_number_blind_index=eq.idx:+821099998888"),
    );
    expect(mockedSupabaseSelect).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("phone_number_blind_index=eq.idx:+821099998888"),
    );
  });
});

describe("completeUserOnboarding", () => {
  beforeEach(() => {
    mockedSupabaseInsert.mockReset();
    mockedSupabaseSelect.mockReset();
    mockedSupabaseUpdate.mockReset();
    mockedCheckSmsVerification.mockReset();
  });

  test("uses wrapper-backed profile queries in docker mode", async () => {
    process.env.SERVER_DATA_PROVIDER = "docker";
    mockedSupabaseSelect
      .mockResolvedValueOnce([
        {
          id: "user-onboarding-1",
          phone_number_encrypted: "enc:+821026784241",
          phone_number_last4: "4241",
          account_status: "active",
          phone_verified_at: "2026-03-31T00:00:00.000Z",
          last_login_at: "2026-03-31T00:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "user-onboarding-1",
          phone_number_encrypted: "enc:+821026784241",
          phone_number_last4: "4241",
          account_status: "active",
          phone_verified_at: "2026-03-31T00:00:00.000Z",
          last_login_at: "2026-03-31T00:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "profile-1",
          user_id: "user-onboarding-1",
          display_name: null,
          due_date: "2026-10-01",
          onboarding_payload: {
            pregnancyWeekOrDueDate: "임신 20주",
            tonePreference: "차분하게",
            babyNickname: "콩이",
          },
          baby_nickname: "콩이",
          notification_time: "08:30",
          theme_key: "rose-sand",
        },
      ] as never);

    mockedSupabaseInsert.mockResolvedValue([]);
    mockedSupabaseUpdate.mockResolvedValue([]);

    await expect(
      completeUserOnboarding({
        userId: "user-onboarding-1",
        pregnancyWeekOrDueDate: "임신 20주",
        tonePreference: "차분하게",
        dueDate: "2026-10-01",
        babyNickname: "콩이",
      }),
    ).resolves.toMatchObject({
      id: "user-onboarding-1",
      hasCompletedOnboarding: true,
    });
  });

  test("stores babyNickname in first-class column and onboarding_payload", async () => {
    mockedSupabaseSelect
      .mockResolvedValueOnce([
        {
          id: "user-onboarding-1",
          phone_number_encrypted: "enc:+821026784241",
          phone_number_last4: "4241",
          account_status: "active",
          phone_verified_at: "2026-03-31T00:00:00.000Z",
          last_login_at: "2026-03-31T00:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "user-onboarding-1",
          phone_number_encrypted: "enc:+821026784241",
          phone_number_last4: "4241",
          account_status: "active",
          phone_verified_at: "2026-03-31T00:00:00.000Z",
          last_login_at: "2026-03-31T00:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "profile-1",
          user_id: "user-onboarding-1",
          display_name: null,
          due_date: "2026-10-01",
          onboarding_payload: {
            pregnancyWeekOrDueDate: "임신 20주",
            tonePreference: "차분하게",
            babyNickname: "콩이",
          },
          baby_nickname: "콩이",
          notification_time: "08:30",
          theme_key: "rose-sand",
        },
      ] as never);

    mockedSupabaseUpdate.mockResolvedValue([]);
    mockedSupabaseInsert.mockResolvedValue([]);

    await completeUserOnboarding({
      userId: "user-onboarding-1",
      pregnancyWeekOrDueDate: "임신 20주",
      tonePreference: "차분하게",
      dueDate: "2026-10-01",
      babyNickname: "콩이",
    });

    expect(mockedSupabaseInsert).toHaveBeenCalledWith(
      "pregnancy_profiles",
      expect.objectContaining({
        user_id: "user-onboarding-1",
        baby_nickname: "콩이",
        onboarding_payload: expect.objectContaining({
          babyNickname: "콩이",
        }),
      }),
    );
  });
});

describe("buildPregnancyProfilePayload", () => {
  const baseMetrics = {
    pregnancyDayCount: 120,
    pregnancyWeek: 17,
    pregnancyDayInWeek: 1,
    dueDate: "2025-09-01",
  };

  test("prefers first-class columns over onboarding payload values", () => {
    const payload = buildPregnancyProfilePayload({
      pregnancyMetrics: baseMetrics,
      dueDate: baseMetrics.dueDate,
      pregnancyWeekOrDueDate: "2025-09-01",
      tonePreference: "calm",
      inputBabyNickname: undefined,
      inputNotificationTime: undefined,
      existingFirstClass: {
        babyNickname: "꾸미",
        notificationTime: "09:15",
        themeKey: "mint-neutral",
      },
      existingOnboardingPayload: {
        pregnancyWeekOrDueDate: "legacy",
        tonePreference: "bold",
        babyNickname: "other",
        hospitalName: "Old Hospital",
        notificationTime: "07:00",
        themeKey: "soft-peach",
      },
    });

    expect(payload.baby_nickname).toBe("꾸미");
    expect(payload.notification_time).toBe("09:15");
    expect(payload.theme_key).toBe("mint-neutral");
    expect(payload.onboarding_payload?.babyNickname).toBe("꾸미");
    expect(payload.onboarding_payload?.notificationTime).toBe("09:15");
    expect(payload.onboarding_payload?.themeKey).toBe("mint-neutral");
  });

  test("falls back to onboarding payload when first-class columns are empty", () => {
    const payload = buildPregnancyProfilePayload({
      pregnancyMetrics: baseMetrics,
      dueDate: null,
      pregnancyWeekOrDueDate: "legacy-week",
      tonePreference: "calm",
      inputBabyNickname: undefined,
      inputNotificationTime: undefined,
      existingFirstClass: {
        babyNickname: null,
        notificationTime: null,
      },
      existingOnboardingPayload: {
        pregnancyWeekOrDueDate: "legacy-week",
        tonePreference: "calm",
        babyNickname: "legacy-nickname",
        hospitalName: "Legacy Hospital",
        notificationTime: "07:20",
        themeKey: "soft-peach",
      },
    });

    expect(payload.baby_nickname).toBe("legacy-nickname");
    expect(payload.notification_time).toBe("07:20");
    expect(payload.theme_key).toBe("soft-peach");
    expect(payload.onboarding_payload?.hospitalName).toBe("Legacy Hospital");
  });

  test("defaults notificationTime to 08:30 when nothing is provided", () => {
    const payload = buildPregnancyProfilePayload({
      pregnancyMetrics: baseMetrics,
      dueDate: null,
      pregnancyWeekOrDueDate: null,
      tonePreference: "calm",
      existingOnboardingPayload: {},
    });

    expect(payload.notification_time).toBe("08:30");
    expect(payload.onboarding_payload?.notificationTime).toBe("08:30");
    expect(payload.theme_key).toBe("rose-sand");
  });
});
