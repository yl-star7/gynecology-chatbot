import type { AuthenticatedUser } from "@gynecology-chatbot/app-core";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { supabaseInsert, supabaseSelect, supabaseUpdate } from "./supabase-rest";

type UserRow = {
  id: string;
  display_name: string;
  phone_number: string;
  account_status: "active" | "paused" | "deleted" | "pending_recovery";
  password_hash: string | null;
  password_set_at: string | null;
  phone_verified_at: string | null;
};

type PregnancyProfileRow = {
  user_id: string;
};

function calculatePregnancyMetrics(input: { pregnancyWeekOrDueDate?: string; dueDate?: string | null }) {
  if (input.dueDate) {
    const dueDate = new Date(`${input.dueDate}T00:00:00`);
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffDays = Math.round((dueDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));
    const pregnancyDayCount = Math.max(0, Math.min(280, 280 - diffDays));

    return {
      dueDate: input.dueDate,
      pregnancyDayCount,
      pregnancyWeek: Math.max(1, Math.floor(pregnancyDayCount / 7)),
      pregnancyDayInWeek: pregnancyDayCount % 7,
    };
  }

  const weekMatch = input.pregnancyWeekOrDueDate?.match(/(\d{1,2})/);
  const pregnancyWeek = weekMatch ? Number(weekMatch[1]) : null;
  const pregnancyDayCount = pregnancyWeek ? pregnancyWeek * 7 : 0;

  return {
    dueDate: null,
    pregnancyDayCount,
    pregnancyWeek,
    pregnancyDayInWeek: 0,
  };
}

function toAuthenticatedUser(user: UserRow, hasCompletedOnboarding: boolean): AuthenticatedUser {
  return {
    id: user.id,
    phoneNumber: user.phone_number,
    displayName: user.display_name,
    hasCompletedOnboarding,
  };
}

function encodeVerificationToken(phoneNumber: string) {
  return Buffer.from(JSON.stringify({ phoneNumber }), "utf8").toString("base64url");
}

function decodeVerificationToken(token: string): { phoneNumber: string } {
  const decoded = Buffer.from(token, "base64url").toString("utf8");
  return JSON.parse(decoded) as { phoneNumber: string };
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password: string, passwordHash: string | null) {
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

export async function findUserByPhoneNumber(phoneNumber: string) {
  const users = await supabaseSelect<UserRow[]>(
    `users?select=id,display_name,phone_number,account_status,password_hash,password_set_at,phone_verified_at&phone_number=eq.${encodeURIComponent(phoneNumber)}&limit=1`,
  );
  return users[0] ?? null;
}

export async function getAuthenticatedUser(userId: string) {
  const [users, profiles] = await Promise.all([
    supabaseSelect<UserRow[]>(`users?select=id,display_name,phone_number,account_status,password_hash,password_set_at,phone_verified_at&id=eq.${userId}&limit=1`),
    supabaseSelect<PregnancyProfileRow[]>(`pregnancy_profiles?select=user_id&user_id=eq.${userId}&limit=1`),
  ]);

  if (!users[0]) {
    return null;
  }

  return toAuthenticatedUser(users[0], Boolean(profiles[0]));
}

export async function signInUserByPhoneNumber(phoneNumber: string, password: string) {
  const user = await findUserByPhoneNumber(phoneNumber);
  if (!user) {
    throw new Error("등록된 전화번호를 찾을 수 없습니다.");
  }

  if (user.account_status === "pending_recovery") {
    throw new Error("비밀번호 재설정 대기 중입니다. 새 비밀번호를 먼저 설정해 주세요.");
  }

  if (user.account_status === "paused" || user.account_status === "deleted") {
    throw new Error("현재 로그인할 수 없는 계정 상태입니다. 관리자에게 문의해 주세요.");
  }

  if (!verifyPassword(password, user.password_hash)) {
    throw new Error("전화번호 또는 비밀번호가 맞지 않습니다.");
  }

  await supabaseUpdate(`users?id=eq.${user.id}`, {
    last_login_at: new Date().toISOString(),
  });

  const nextUser = await getAuthenticatedUser(user.id);
  if (!nextUser) {
    throw new Error("로그인 사용자 정보를 확인하지 못했습니다.");
  }

  return nextUser;
}

export async function verifyPhoneNumber(phoneNumber: string, verificationCode: string) {
  const user = await findUserByPhoneNumber(phoneNumber);
  if (!user) {
    throw new Error("등록된 전화번호를 찾을 수 없습니다.");
  }

  if (verificationCode.trim().length < 4) {
    throw new Error("인증 코드를 확인해 주세요.");
  }

  return {
    verificationToken: encodeVerificationToken(phoneNumber),
  };
}

export async function setUserPassword(verificationToken: string, password: string) {
  const { phoneNumber } = decodeVerificationToken(verificationToken);
  const user = await findUserByPhoneNumber(phoneNumber);
  if (!user) {
    throw new Error("인증 대상 사용자를 찾지 못했습니다.");
  }

  await supabaseUpdate(`users?id=eq.${user.id}`, {
    account_status: "active",
    password_hash: hashPassword(password),
    password_set_at: new Date().toISOString(),
    phone_verified_at: new Date().toISOString(),
  });

  const nextUser = await getAuthenticatedUser(user.id);
  if (!nextUser) {
    throw new Error("비밀번호 설정 후 사용자 정보를 확인하지 못했습니다.");
  }

  return nextUser;
}

export async function createPasswordResetAudit(phoneNumber: string) {
  const user = await findUserByPhoneNumber(phoneNumber);
  if (!user) {
    throw new Error("등록된 전화번호를 찾을 수 없습니다.");
  }

  await supabaseUpdate(`users?id=eq.${user.id}`, {
    account_status: "pending_recovery",
  });

  const adminUserId = process.env.ADMIN_ACTOR_USER_ID;
  if (adminUserId) {
    await supabaseInsert("admin_audit_logs", {
      admin_user_id: adminUserId,
      target_user_id: user.id,
      action_type: "password_reset",
      entity_type: "user",
      reason: "mobile_password_reset_request",
      before_payload: { accountStatus: "active" },
      after_payload: { accountStatus: "pending_recovery" },
    });
  }

  return { ok: true as const };
}

export async function completeUserOnboarding(input: {
  userId: string;
  pregnancyWeekOrDueDate: string;
  tonePreference: string;
  dueDate?: string | null;
}) {
  const user = await getAuthenticatedUser(input.userId);
  if (!user) {
    throw new Error("사용자를 찾지 못했습니다.");
  }

  const metrics = calculatePregnancyMetrics({
    pregnancyWeekOrDueDate: input.pregnancyWeekOrDueDate,
    dueDate: input.dueDate,
  });

  const existingProfiles = await supabaseSelect<Array<{ id: string }>>(
    `pregnancy_profiles?select=id&user_id=eq.${input.userId}&limit=1`,
  );

  const payload = {
    pregnancy_status: "pregnant",
    pregnancy_day_count: metrics.pregnancyDayCount,
    pregnancy_week: metrics.pregnancyWeek,
    pregnancy_day_in_week: metrics.pregnancyDayInWeek,
    due_date: metrics.dueDate,
    onboarding_payload: {
      pregnancyWeekOrDueDate: input.pregnancyWeekOrDueDate,
      tonePreference: input.tonePreference,
      babyNickname: null,
      hospitalName: null,
      notificationTime: "08:30",
    },
  };

  if (existingProfiles[0]) {
    await supabaseUpdate(`pregnancy_profiles?user_id=eq.${input.userId}`, payload);
  } else {
    await supabaseInsert("pregnancy_profiles", {
      user_id: input.userId,
      ...payload,
    });
  }

  const nextUser = await getAuthenticatedUser(input.userId);
  if (!nextUser) {
    throw new Error("온보딩 저장 후 사용자 정보를 확인하지 못했습니다.");
  }

  return nextUser;
}

export async function updateMobileProfile(input: {
  userId: string;
  displayName: string;
  dueDate?: string | null;
  tonePreference: string;
  babyNickname?: string | null;
  hospitalName?: string | null;
  notificationTime?: string | null;
}) {
  const user = await getAuthenticatedUser(input.userId);
  if (!user) {
    throw new Error("사용자를 찾지 못했습니다.");
  }

  const metrics = calculatePregnancyMetrics({
    dueDate: input.dueDate ?? null,
    pregnancyWeekOrDueDate: input.dueDate ?? undefined,
  });

  await supabaseUpdate(`users?id=eq.${input.userId}`, {
    display_name: input.displayName,
  });

  const existingProfiles = await supabaseSelect<Array<{
    id: string;
    onboarding_payload: {
      pregnancyWeekOrDueDate?: string;
      tonePreference?: string;
      babyNickname?: string | null;
      hospitalName?: string | null;
      notificationTime?: string | null;
    } | null;
  }>>(
    `pregnancy_profiles?select=id,onboarding_payload&user_id=eq.${input.userId}&limit=1`,
  );

  const existingPayload = existingProfiles[0]?.onboarding_payload ?? {};
  const nextOnboardingPayload = {
    ...existingPayload,
    pregnancyWeekOrDueDate: input.dueDate || existingPayload.pregnancyWeekOrDueDate || null,
    tonePreference: input.tonePreference,
    babyNickname: input.babyNickname ?? existingPayload.babyNickname ?? null,
    hospitalName: input.hospitalName ?? existingPayload.hospitalName ?? null,
    notificationTime: input.notificationTime ?? existingPayload.notificationTime ?? "08:30",
  };

  const profilePayload = {
    pregnancy_status: "pregnant",
    pregnancy_day_count: metrics.pregnancyDayCount,
    pregnancy_week: metrics.pregnancyWeek,
    pregnancy_day_in_week: metrics.pregnancyDayInWeek,
    due_date: metrics.dueDate,
    onboarding_payload: nextOnboardingPayload,
  };

  if (existingProfiles[0]) {
    await supabaseUpdate(`pregnancy_profiles?user_id=eq.${input.userId}`, profilePayload);
  } else {
    await supabaseInsert("pregnancy_profiles", {
      user_id: input.userId,
      ...profilePayload,
    });
  }

  const nextUser = await getAuthenticatedUser(input.userId);
  if (!nextUser) {
    throw new Error("프로필 저장 후 사용자 정보를 확인하지 못했습니다.");
  }

  return nextUser;
}
