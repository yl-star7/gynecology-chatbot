import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseSelect } from "@/lib/supabase/admin-client";
import { normalizePhoneNumberToE164 } from "@/lib/mobile/twilio-verify";
import {
  computePhoneNumberBlindIndex,
  decryptPhoneNumber,
} from "@/lib/privacy/phone-crypto";
import {
  hasDockerConfig,
  hasSupabaseConfig,
  resolveServerDataProvider,
} from "@/lib/server-data-provider";

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

function createAdminPhoneCandidates(phoneNumber: string) {
  const trimmed = phoneNumber.trim();
  const digitsOnly = trimmed.replace(/\D/g, "");
  const candidates = new Set<string>();
  if (trimmed) candidates.add(trimmed);
  if (digitsOnly) candidates.add(digitsOnly);

  const normalizedCandidate = (() => {
    try {
      return normalizePhoneNumberToE164(trimmed);
    } catch {
      return null;
    }
  })();
  if (normalizedCandidate) {
    candidates.add(normalizedCandidate);
  }

  return Array.from(candidates);
}

function getAdminSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is required");
  }

  return secret;
}

function getAdminAuthProvider(): AdminAuthProvider {
  if (process.env.ADMIN_DATA_PROVIDER === "mock") {
    return "mock";
  }

  const provider = resolveServerDataProvider();
  const hasBackendConfig =
    provider === "docker" ? hasDockerConfig() : hasSupabaseConfig();

  return hasBackendConfig ? "backend" : "mock";
}

function getAdminLoginPassword() {
  const password =
    process.env.ADMIN_LOGIN_PASSWORD ?? process.env.LOCAL_ADMIN_PASSWORD;
  if (!password?.trim()) {
    throw new Error("ADMIN_LOGIN_PASSWORD or LOCAL_ADMIN_PASSWORD is required");
  }

  return password;
}

function getRequiredMockAdminEnv(name: keyof NodeJS.ProcessEnv) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required when ADMIN_DATA_PROVIDER=mock`);
  }

  return value;
}

function getLocalAdminCredentials() {
  return {
    id: getRequiredMockAdminEnv("LOCAL_ADMIN_USER_ID"),
    phoneNumber: getRequiredMockAdminEnv("LOCAL_ADMIN_PHONE_NUMBER"),
    password: getAdminLoginPassword(),
    displayName: getRequiredMockAdminEnv("LOCAL_ADMIN_NAME"),
  };
}

function signValue(value: string) {
  return createHmac("sha256", getAdminSessionSecret())
    .update(value)
    .digest("hex");
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

  for (const candidate of createAdminPhoneCandidates(phoneNumber)) {
    const users = await supabaseSelect<AdminUserRow[]>(
      `users?select=id,phone_number_encrypted,role&phone_number_blind_index=eq.${encodeURIComponent(computePhoneNumberBlindIndex(candidate))}&limit=1`,
    );
    const user = users[0];
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      continue;
    }

    return {
      ...user,
      phone_number: decryptPhoneNumber(user.phone_number_encrypted),
      displayName: (await findAdminProfileDisplayName(user.id)) ?? "운영자",
    };
  }

  return null;
}

export async function authenticateAdmin(input: {
  phoneNumber: string;
  password: string;
}) {
  const user = await findAdminUserByPhoneNumber(input.phoneNumber);
  if (!user || input.password !== getAdminLoginPassword()) {
    throw new Error("입력한 정보를 다시 확인해주세요.");
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
  const userId = decodeAdminSession(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
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
