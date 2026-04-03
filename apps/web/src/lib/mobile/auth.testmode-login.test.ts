jest.mock("@/lib/supabase/admin-client", () => {
  const supabaseInsert = jest.fn();
  const supabaseSelect = jest.fn();
  const supabaseUpdate = jest.fn();
  const getSupabaseAdminClient = jest.fn(() => ({
    from: (table: string) => new QueryBuilder(table, "select"),
  }));

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

import type { SupabaseClient } from "@supabase/supabase-js";

import { completePhoneSignIn } from "@/lib/mobile/auth";
import {
  getSupabaseAdminClient,
  supabaseSelect,
  supabaseInsert,
  supabaseUpdate,
} from "@/lib/supabase/admin-client";
import { checkSmsVerification } from "@/lib/mobile/twilio-verify";

const mockedGetSupabaseAdminClient = jest.mocked(getSupabaseAdminClient);
const mockedSupabaseSelect = jest.mocked(supabaseSelect);
const mockedSupabaseInsert = jest.mocked(supabaseInsert);
const mockedSupabaseUpdate = jest.mocked(supabaseUpdate);
const mockedCheckSmsVerification = jest.mocked(checkSmsVerification);

describe("completePhoneSignIn test mode bypass", () => {
  const originalMode = process.env.MOBILE_AUTH_TEST_MODE;
  const originalBypassPhone = process.env.LOCAL_DEV_USER_PHONE_NUMBER;

  const existingUser = {
    id: "user-1",
    phone_number_encrypted: "enc:+821012345678",
    phone_number_last4: "5678",
    account_status: "active",
    phone_verified_at: "2026-03-19T00:00:00.000Z",
    last_login_at: "2026-03-19T00:00:00.000Z",
  };

  function queueSelectRows(...rows: unknown[][]) {
    mockedSupabaseSelect.mockReset();
    for (const result of rows) {
      mockedSupabaseSelect.mockResolvedValueOnce(result as never);
    }
  }

  beforeEach(() => {
    process.env.MOBILE_AUTH_TEST_MODE = "true";
    process.env.LOCAL_DEV_USER_PHONE_NUMBER = "01012345678";
    process.env.SERVER_DATA_PROVIDER = "docker";
    mockedGetSupabaseAdminClient.mockReset();
    mockedSupabaseSelect.mockReset();
    mockedSupabaseInsert.mockReset();
    mockedSupabaseUpdate.mockReset();
    mockedCheckSmsVerification.mockReset();
    mockedGetSupabaseAdminClient.mockImplementation(
      () => ({}) as SupabaseClient,
    );
    mockedSupabaseUpdate.mockResolvedValue([]);
    mockedSupabaseInsert.mockResolvedValue([]);
  });

  afterAll(() => {
    if (originalMode === undefined) {
      delete process.env.MOBILE_AUTH_TEST_MODE;
    } else {
      process.env.MOBILE_AUTH_TEST_MODE = originalMode;
    }

    if (originalBypassPhone === undefined) {
      delete process.env.LOCAL_DEV_USER_PHONE_NUMBER;
      return;
    }
    process.env.LOCAL_DEV_USER_PHONE_NUMBER = originalBypassPhone;
  });

  test("accepts any verification code for LOCAL_DEV_USER_PHONE_NUMBER without Twilio check in test mode", async () => {
    process.env.LOCAL_DEV_USER_PHONE_NUMBER = "01026784241";
    queueSelectRows([], [], [existingUser], [existingUser], []);

    const result = await completePhoneSignIn("01026784241", "123456");

    expect(result.user.id).toBe("user-1");
    expect(result.user.hasCompletedOnboarding).toBe(false);
    expect(mockedCheckSmsVerification).not.toHaveBeenCalled();
  });

  test("returns hasCompletedOnboarding false for bypass login when no pregnancy profile exists", async () => {
    queueSelectRows([], [existingUser], [existingUser], []);

    const result = await completePhoneSignIn("01012345678", "000000");

    expect(result.user.hasCompletedOnboarding).toBe(false);
    expect(mockedCheckSmsVerification).not.toHaveBeenCalled();
  });

  test("uses wrapper-backed queries in docker mode instead of bypassing to direct admin client", async () => {
    mockedGetSupabaseAdminClient.mockImplementation(() => {
      throw new Error("direct admin client should not be used in docker mode");
    });
    queueSelectRows([], [existingUser], [existingUser], []);

    await expect(
      completePhoneSignIn("01012345678", "000000"),
    ).resolves.toMatchObject({
      user: expect.objectContaining({
        id: "user-1",
        hasCompletedOnboarding: false,
      }),
    });
  });

  test("returns hasCompletedOnboarding true for bypass login when pregnancy profile exists", async () => {
    queueSelectRows(
      [],
      [existingUser],
      [existingUser],
      [
        {
          user_id: "user-1",
          due_date: "2026-10-01",
          onboarding_payload: {
            tonePreference: "차분하게",
            pregnancyWeekOrDueDate: "2026-10-01",
          },
        },
      ],
    );

    const result = await completePhoneSignIn("01012345678", "000000");

    expect(result.user.hasCompletedOnboarding).toBe(true);
    expect(mockedCheckSmsVerification).not.toHaveBeenCalled();
  });
});
