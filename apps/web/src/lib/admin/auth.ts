import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseSelect } from "@/lib/mobile/supabase-rest";

const ADMIN_SESSION_COOKIE = "gc_admin_session";

type AdminUserRow = {
  id: string;
  phone_number: string;
  display_name: string;
  role: "user" | "admin" | "super_admin";
  password_hash: string | null;
};

type AdminAuthProvider = "backend" | "mock";

function getAdminSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || "local-admin-session-secret";
}

function getAdminAuthProvider(): AdminAuthProvider {
  return process.env.ADMIN_DATA_PROVIDER === "backend" ? "backend" : "mock";
}

function getLocalAdminCredentials() {
  return {
    id: process.env.LOCAL_ADMIN_USER_ID ?? "local-admin-1",
    phoneNumber: process.env.LOCAL_ADMIN_PHONE_NUMBER ?? "01099998888",
    password: process.env.LOCAL_ADMIN_PASSWORD ?? "admin1234",
    displayName: process.env.LOCAL_ADMIN_NAME ?? "운영자",
  };
}

function signValue(value: string) {
  return createHmac("sha256", getAdminSessionSecret()).update(value).digest("hex");
}

function encodeAdminSession(userId: string) {
  return `${userId}.${signValue(userId)}`;
}

function decodeAdminSession(cookieValue: string | undefined) {
  if (!cookieValue) {
    return null;
  }

  const [userId, signature] = cookieValue.split(".");
  if (!userId || !signature) {
    return null;
  }

  const expectedSignature = signValue(userId);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }

  return userId;
}

function verifyPasswordHash(password: string, passwordHash: string | null) {
  if (!passwordHash) {
    return false;
  }

  const [algorithm, salt, storedHash] = passwordHash.split(":");
  if (algorithm !== "scrypt" || !salt || !storedHash) {
    return false;
  }

  const actualHash = scryptSync(password, salt, 64);
  const expectedHash = Buffer.from(storedHash, "hex");
  return expectedHash.length === actualHash.length && timingSafeEqual(expectedHash, actualHash);
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function buildLocalAdminRow(): AdminUserRow {
  const localAdmin = getLocalAdminCredentials();
  return {
    id: localAdmin.id,
    phone_number: localAdmin.phoneNumber,
    display_name: localAdmin.displayName,
    role: "admin",
    password_hash: hashPassword(localAdmin.password),
  };
}

export async function findAdminUserByPhoneNumber(phoneNumber: string) {
  if (getAdminAuthProvider() === "mock") {
    const localAdmin = getLocalAdminCredentials();
    if (phoneNumber !== localAdmin.phoneNumber) {
      return null;
    }

    return buildLocalAdminRow();
  }

  const users = await supabaseSelect<AdminUserRow[]>(
    `users?select=id,phone_number,display_name,role,password_hash&phone_number=eq.${encodeURIComponent(phoneNumber)}&limit=1`,
  );
  const user = users[0];
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return null;
  }

  return user;
}

export async function authenticateAdmin(input: { phoneNumber: string; password: string }) {
  const user = await findAdminUserByPhoneNumber(input.phoneNumber);
  if (!user || !verifyPasswordHash(input.password, user.password_hash)) {
    throw new Error("관리자 전화번호 또는 비밀번호가 맞지 않습니다.");
  }

  return {
    id: user.id,
    phoneNumber: user.phone_number,
    displayName: user.display_name,
    role: user.role,
  };
}

export async function writeAdminSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, encodeAdminSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function readAdminSessionUser() {
  const cookieStore = await cookies();
  const userId = decodeAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!userId) {
    return null;
  }

  if (getAdminAuthProvider() === "mock") {
    const localAdmin = getLocalAdminCredentials();
    if (userId !== localAdmin.id) {
      return null;
    }

    return {
      id: localAdmin.id,
      phoneNumber: localAdmin.phoneNumber,
      displayName: localAdmin.displayName,
      role: "admin",
    };
  }

  const users = await supabaseSelect<AdminUserRow[]>(
    `users?select=id,phone_number,display_name,role,password_hash&id=eq.${userId}&limit=1`,
  );
  const user = users[0];
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return null;
  }

  return {
    id: user.id,
    phoneNumber: user.phone_number,
    displayName: user.display_name,
    role: user.role,
  };
}

export async function requireAdminSession() {
  const user = await readAdminSessionUser();
  if (!user) {
    redirect("/admin/login");
  }

  return user;
}
