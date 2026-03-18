jest.mock("@/lib/mobile/supabase-rest", () => ({
  supabaseSelect: jest.fn(),
}));

jest.mock("@/lib/server-data-provider", () => ({
  resolveServerDataProvider: jest.fn(),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

import { scryptSync } from "crypto";
import { cookies } from "next/headers";
import { supabaseSelect } from "@/lib/mobile/supabase-rest";
import {
  authenticateAdmin,
  readAdminSessionUser,
  writeAdminSession,
} from "./auth";

const mockedSelect = supabaseSelect as jest.MockedFunction<
  typeof supabaseSelect
>;
const mockedCookies = cookies as jest.MockedFunction<typeof cookies>;

function buildPasswordHash(password: string) {
  const salt = "unit-test-salt";
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

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
    LOCAL_ADMIN_USER_ID: process.env.LOCAL_ADMIN_USER_ID,
    LOCAL_ADMIN_PHONE_NUMBER: process.env.LOCAL_ADMIN_PHONE_NUMBER,
    LOCAL_ADMIN_PASSWORD: process.env.LOCAL_ADMIN_PASSWORD,
    LOCAL_ADMIN_NAME: process.env.LOCAL_ADMIN_NAME,
  };

  beforeEach(() => {
    mockedSelect.mockReset();
    mockedCookies.mockReset();
    process.env.ADMIN_DATA_PROVIDER = originalEnv.ADMIN_DATA_PROVIDER;
    process.env.LOCAL_ADMIN_USER_ID = originalEnv.LOCAL_ADMIN_USER_ID;
    process.env.LOCAL_ADMIN_PHONE_NUMBER = originalEnv.LOCAL_ADMIN_PHONE_NUMBER;
    process.env.LOCAL_ADMIN_PASSWORD = originalEnv.LOCAL_ADMIN_PASSWORD;
    process.env.LOCAL_ADMIN_NAME = originalEnv.LOCAL_ADMIN_NAME;
  });

  afterAll(() => {
    process.env.ADMIN_DATA_PROVIDER = originalEnv.ADMIN_DATA_PROVIDER;
    process.env.LOCAL_ADMIN_USER_ID = originalEnv.LOCAL_ADMIN_USER_ID;
    process.env.LOCAL_ADMIN_PHONE_NUMBER = originalEnv.LOCAL_ADMIN_PHONE_NUMBER;
    process.env.LOCAL_ADMIN_PASSWORD = originalEnv.LOCAL_ADMIN_PASSWORD;
    process.env.LOCAL_ADMIN_NAME = originalEnv.LOCAL_ADMIN_NAME;
  });

  test("mock mode authenticates and restores the session without touching users table", async () => {
    process.env.ADMIN_DATA_PROVIDER = "mock";
    process.env.LOCAL_ADMIN_USER_ID = "local-admin-test";
    process.env.LOCAL_ADMIN_PHONE_NUMBER = "01011112222";
    process.env.LOCAL_ADMIN_PASSWORD = "mock-pass";
    process.env.LOCAL_ADMIN_NAME = "운영자";

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

    const passwordHash = buildPasswordHash("backend-pass");
    mockedSelect.mockResolvedValue([
      {
        id: "admin-backend",
        phone_number: "01033334444",
        display_name: "백엔드 운영자",
        role: "super_admin",
        password_hash: passwordHash,
      },
    ]);

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
    expect(mockedSelect).toHaveBeenCalledTimes(2);
    expect(mockedSelect.mock.calls[0]?.[0]).toContain(
      "users?select=id,phone_number,display_name,role,password_hash&phone_number=eq.01033334444&limit=1",
    );
    expect(mockedSelect.mock.calls[1]?.[0]).toContain(
      "users?select=id,phone_number,display_name,role,password_hash&id=eq.admin-backend&limit=1",
    );
  });
});
