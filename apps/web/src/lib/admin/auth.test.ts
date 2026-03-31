jest.mock("@/lib/supabase/admin-client", () => ({
  supabaseSelect: jest.fn(),
}));

jest.mock("@/lib/server-data-provider", () => ({
  resolveServerDataProvider: jest.fn(),
  hasDockerConfig: jest.fn(() => false),
  hasSupabaseConfig: jest.fn(() => true),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/lib/privacy/phone-crypto", () => ({
  computePhoneNumberBlindIndex: jest.fn(
    (phoneNumber: string) => `idx:${phoneNumber}`,
  ),
  decryptPhoneNumber: jest.fn((value: string) => value.replace(/^enc:/, "")),
}));

import { cookies } from "next/headers";
import { supabaseSelect } from "@/lib/supabase/admin-client";
import {
  authenticateAdmin,
  readAdminSessionUser,
  writeAdminSession,
} from "./auth";

const mockedSelect = supabaseSelect as jest.MockedFunction<
  typeof supabaseSelect
>;
const mockedCookies = cookies as jest.MockedFunction<typeof cookies>;

function createCookieStore() {
  let value: string | undefined;

  return {
    get: jest.fn(() => (value ? { value } : undefined)),
    set: jest.fn((_name: string, nextValue: string) => {
      value = nextValue;
    }),
    delete: jest.fn(() => {
      value = undefined;
    }),
  };
}

describe("admin auth provider awareness", () => {
  const originalEnv = {
    ADMIN_DATA_PROVIDER: process.env.ADMIN_DATA_PROVIDER,
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
    ADMIN_LOGIN_PASSWORD: process.env.ADMIN_LOGIN_PASSWORD,
    LOCAL_ADMIN_USER_ID: process.env.LOCAL_ADMIN_USER_ID,
    LOCAL_ADMIN_PHONE_NUMBER: process.env.LOCAL_ADMIN_PHONE_NUMBER,
    LOCAL_ADMIN_PASSWORD: process.env.LOCAL_ADMIN_PASSWORD,
    LOCAL_ADMIN_NAME: process.env.LOCAL_ADMIN_NAME,
  };

  beforeEach(() => {
    mockedSelect.mockReset();
    mockedCookies.mockReset();
    process.env.ADMIN_DATA_PROVIDER = originalEnv.ADMIN_DATA_PROVIDER;
    process.env.ADMIN_SESSION_SECRET = originalEnv.ADMIN_SESSION_SECRET;
    process.env.ADMIN_LOGIN_PASSWORD = originalEnv.ADMIN_LOGIN_PASSWORD;
    process.env.LOCAL_ADMIN_USER_ID = originalEnv.LOCAL_ADMIN_USER_ID;
    process.env.LOCAL_ADMIN_PHONE_NUMBER = originalEnv.LOCAL_ADMIN_PHONE_NUMBER;
    process.env.LOCAL_ADMIN_PASSWORD = originalEnv.LOCAL_ADMIN_PASSWORD;
    process.env.LOCAL_ADMIN_NAME = originalEnv.LOCAL_ADMIN_NAME;
  });

  afterAll(() => {
    process.env.ADMIN_DATA_PROVIDER = originalEnv.ADMIN_DATA_PROVIDER;
    process.env.ADMIN_SESSION_SECRET = originalEnv.ADMIN_SESSION_SECRET;
    process.env.ADMIN_LOGIN_PASSWORD = originalEnv.ADMIN_LOGIN_PASSWORD;
    process.env.LOCAL_ADMIN_USER_ID = originalEnv.LOCAL_ADMIN_USER_ID;
    process.env.LOCAL_ADMIN_PHONE_NUMBER = originalEnv.LOCAL_ADMIN_PHONE_NUMBER;
    process.env.LOCAL_ADMIN_PASSWORD = originalEnv.LOCAL_ADMIN_PASSWORD;
    process.env.LOCAL_ADMIN_NAME = originalEnv.LOCAL_ADMIN_NAME;
  });

  test("mock mode authenticates and restores the session without touching users table", async () => {
    process.env.ADMIN_DATA_PROVIDER = "mock";
    process.env.ADMIN_LOGIN_PASSWORD = "mock-pass";
    process.env.LOCAL_ADMIN_USER_ID = "local-admin-test";
    process.env.LOCAL_ADMIN_PHONE_NUMBER = "01011112222";
    process.env.LOCAL_ADMIN_PASSWORD = "mock-pass";
    process.env.LOCAL_ADMIN_NAME = "운영자";
    process.env.ADMIN_SESSION_SECRET = "session-secret";

    const cookieStore = createCookieStore();
    mockedCookies.mockImplementation(async () => cookieStore as never);

    const admin = await authenticateAdmin({
      phoneNumber: "01011112222",
      password: "mock-pass",
    });

    expect(admin).toEqual({
      id: "local-admin-test",
      phoneNumber: "01011112222",
      displayName: "운영자",
      role: "admin",
    });
    expect(mockedSelect).not.toHaveBeenCalled();

    await writeAdminSession(admin.id);
    const sessionUser = await readAdminSessionUser();

    expect(sessionUser).toEqual(admin);
    expect(mockedSelect).not.toHaveBeenCalled();
  });

  test("backend mode still authenticates and restores the session from users table", async () => {
    process.env.ADMIN_DATA_PROVIDER = "backend";
    mockedSelect.mockImplementation((path: string) => {
      if (path.startsWith("users?")) {
        return Promise.resolve([
          {
            id: "admin-backend",
            phone_number_encrypted: "enc:01033334444",
            role: "super_admin",
          },
        ]);
      }

      if (path.startsWith("pregnancy_profiles?")) {
        return Promise.resolve([
          {
            display_name: "백엔드 운영자",
          },
        ]);
      }

      return Promise.resolve([]);
    });
    process.env.ADMIN_LOGIN_PASSWORD = "backend-pass";
    process.env.ADMIN_SESSION_SECRET = "session-secret";

    const cookieStore = createCookieStore();
    mockedCookies.mockImplementation(async () => cookieStore as never);

    const admin = await authenticateAdmin({
      phoneNumber: "01033334444",
      password: "backend-pass",
    });

    expect(admin).toEqual({
      id: "admin-backend",
      phoneNumber: "01033334444",
      displayName: "백엔드 운영자",
      role: "super_admin",
    });

    await writeAdminSession(admin.id);
    const sessionUser = await readAdminSessionUser();

    expect(sessionUser).toEqual(admin);
    expect(mockedSelect).toHaveBeenCalledTimes(4);
    expect(mockedSelect.mock.calls[0]?.[0]).toContain(
      "users?select=id,phone_number_encrypted,role&phone_number_blind_index=eq.idx%3A01033334444&limit=1",
    );
    expect(mockedSelect.mock.calls[1]?.[0]).toContain(
      "pregnancy_profiles?select=display_name&user_id=eq.admin-backend&limit=1",
    );
  });

  test("requires explicit local admin profile configuration in mock mode", async () => {
    process.env.ADMIN_DATA_PROVIDER = "mock";
    process.env.ADMIN_LOGIN_PASSWORD = "mock-pass";
    delete process.env.LOCAL_ADMIN_USER_ID;

    await expect(
      authenticateAdmin({
        phoneNumber: "01011112222",
        password: "mock-pass",
      }),
    ).rejects.toThrow(
      "LOCAL_ADMIN_USER_ID is required when ADMIN_DATA_PROVIDER=mock",
    );
  });

  test("requires explicit admin credentials and session secret configuration", async () => {
    process.env.ADMIN_DATA_PROVIDER = "mock";
    delete process.env.ADMIN_LOGIN_PASSWORD;
    delete process.env.LOCAL_ADMIN_PASSWORD;
    delete process.env.ADMIN_SESSION_SECRET;

    await expect(
      authenticateAdmin({
        phoneNumber: "01011112222",
        password: "mock-pass",
      }),
    ).rejects.toThrow(
      "ADMIN_LOGIN_PASSWORD or LOCAL_ADMIN_PASSWORD is required",
    );

    process.env.LOCAL_ADMIN_PASSWORD = "mock-pass";

    const cookieStore = createCookieStore();
    mockedCookies.mockImplementation(async () => cookieStore as never);

    await expect(writeAdminSession("admin-1")).rejects.toThrow(
      "ADMIN_SESSION_SECRET is required",
    );
  });
});
