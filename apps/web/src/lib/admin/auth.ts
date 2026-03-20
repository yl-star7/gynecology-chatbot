import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseSelect } from "@/lib/mobile/supabase-rest";
import {
  computePhoneNumberBlindIndex,
  decryptPhoneNumber,
} from "@/lib/privacy/phone-crypto";

const ADMIN_SESSION_COOKIE = "gc_admin_session";

type AdminUserRow = {
  id: string;
  phone_number_encrypted: string;
  role: "user" | "admin" | "super_admin";
};

type AdminProfileRow = {
  display_name: string | null;
};

type AdminAuthProvider = "backend" | "mock";

function getAdminSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || "local-admin-session-secret";
}

function getAdminAuthProvider(): AdminAuthProvider {
  return process.env.ADMIN_DATA_PROVIDER === "backend" ? "backend" : "mock";
}

function getAdminLoginPassword() {
  return (
    process.env.ADMIN_LOGIN_PASSWORD ??
    process.env.LOCAL_ADMIN_PASSWORD ??
    "admin1234"
  );
}

function getLocalAdminCredentials() {
  return {
    id: process.env.LOCAL_ADMIN_USER_ID ?? "local-admin-1",
    phoneNumber: process.env.LOCAL_ADMIN_PHONE_NUMBER ?? "01099998888",
    password: getAdminLoginPassword(),
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

async function findAdminProfileDisplayName(userId: string) {
  const profiles = await supabaseSelect<AdminProfileRow[]>(
    `pregnancy_profiles?select=display_name&user_id=eq.${userId}&limit=1`,
  );

  return profiles[0]?.display_name?.trim() || null;
}

export async function findAdminUserByPhoneNumber(phoneNumber: string) {
  if (getAdminAuthProvider() === "mock") {
    const localAdmin = getLocalAdminCredentials();
    if (phoneNumber !== localAdmin.phoneNumber) {
      return null;
    }

    return {
      id: localAdmin.id,
      phone_number: localAdmin.phoneNumber,
      role: "admin" as const,
      displayName: localAdmin.displayName,
    };
  }

  const users = await supabaseSelect<AdminUserRow[]>(
    `users?select=id,phone_number_encrypted,role&phone_number_blind_index=eq.${encodeURIComponent(computePhoneNumberBlindIndex(phoneNumber))}&limit=1`,
  );
  const user = users[0];
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return null;
  }

  return {
    ...user,
    phone_number: decryptPhoneNumber(user.phone_number_encrypted),
    displayName: (await findAdminProfileDisplayName(user.id)) ?? "운영자",
  };
}

export async function authenticateAdmin(input: { phoneNumber: string; password: string }) {
  const user = await findAdminUserByPhoneNumber(input.phoneNumber);
  if (!user || input.password !== getAdminLoginPassword()) {
    throw new Error("관리자 전화번호 또는 비밀번호가 맞지 않습니다.");
  }

  return {
    id: user.id,
    phoneNumber: user.phone_number,
    displayName: user.displayName,
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
    `users?select=id,phone_number_encrypted,role&id=eq.${userId}&limit=1`,
  );
  const user = users[0];
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return null;
  }

  return {
    id: user.id,
    phoneNumber: decryptPhoneNumber(user.phone_number_encrypted),
    displayName: (await findAdminProfileDisplayName(user.id)) ?? "운영자",
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
