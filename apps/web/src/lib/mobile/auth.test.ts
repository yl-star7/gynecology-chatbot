jest.mock("@/lib/supabase/admin-client", () => {
  const supabaseInsert = jest.fn();
  const supabaseSelect = jest.fn();
  const supabaseUpdate = jest.fn();

  class QueryBuilder {
    constructor(
      private readonly table: string,
      private readonly mode: "select" | "insert" | "update",
      private readonly payload?: unknown,
      private readonly columns?: string,
      private readonly filters: string[] = [],
      private readonly limitValue?: number,
    ) {}

    eq(column: string, value: string | number | boolean) {
      return new QueryBuilder(
        this.table,
        this.mode,
        this.payload,
        this.columns,
        [...this.filters, `${column}=eq.${value}`],
        this.limitValue,
      );
    }

    limit(value: number) {
      return new QueryBuilder(
        this.table,
        this.mode,
        this.payload,
        this.columns,
        this.filters,
        value,
      );
    }

    select(columns?: string) {
      if (this.mode === "insert" || this.mode === "update") {
        return new QueryBuilder(
          this.table,
          this.mode,
          this.payload,
          columns,
          this.filters,
          this.limitValue,
        );
      }

      return new QueryBuilder(
        this.table,
        "select",
        undefined,
        columns,
        this.filters,
        this.limitValue,
      );
    }

    insert(payload: unknown) {
      return new QueryBuilder(this.table, "insert", payload);
    }

    update(payload: unknown) {
      return new QueryBuilder(this.table, "update", payload);
    }

    then(
      resolve: (value: { data: unknown; error: null }) => unknown,
      reject?: (reason: unknown) => unknown,
    ) {
      const query = [
        this.columns ? `select=${this.columns}` : null,
        ...this.filters,
        this.limitValue ? `limit=${this.limitValue}` : null,
      ]
        .filter(Boolean)
        .join("&");
      const path = query ? `${this.table}?${query}` : this.table;
      const source =
        this.mode === "select"
          ? supabaseSelect(path)
          : this.mode === "insert"
            ? supabaseInsert(this.table, this.payload)
            : supabaseUpdate(path, this.payload);

      return Promise.resolve(source).then(
        (data) => resolve({ data, error: null }),
        reject,
      );
    }
  }

  const getSupabaseAdminClient = jest.fn(() => ({
    from: (table: string) => new QueryBuilder(table, "select"),
  }));

  return {
    getSupabaseAdminClient,
    supabaseInsert,
    supabaseSelect,
    supabaseUpdate,
  };
});

jest.mock("@/lib/mobile/twilio-verify", () => {
  const actual = jest.requireActual("@/lib/mobile/twilio-verify");

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
  getSupabaseAdminClient,
  supabaseInsert,
  supabaseSelect,
  supabaseUpdate,
} from "@/lib/supabase/admin-client";
import { checkSmsVerification } from "@/lib/mobile/twilio-verify";

const mockedGetSupabaseAdminClient = jest.mocked(getSupabaseAdminClient);
const mockedSupabaseInsert = jest.mocked(supabaseInsert);
const mockedSupabaseSelect = jest.mocked(supabaseSelect);
const mockedSupabaseUpdate = jest.mocked(supabaseUpdate);
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
    mockedGetSupabaseAdminClient.mockReset();
    mockedSupabaseInsert.mockReset();
    mockedSupabaseSelect.mockReset();
    mockedSupabaseUpdate.mockReset();
    mockedCheckSmsVerification.mockReset();
  });

  test("uses wrapper-backed profile queries in docker mode", async () => {
    process.env.SERVER_DATA_PROVIDER = "docker";
    mockedGetSupabaseAdminClient.mockImplementation(() => {
      throw new Error("direct admin client should not be used in docker mode");
    });

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
