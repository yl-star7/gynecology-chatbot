import type { AuthenticatedUser } from "@gynecology-chatbot/app-core";
import {
  DEFAULT_MOBILE_THEME_KEY,
  resolveMobileThemeKey,
} from "@gynecology-chatbot/app-core";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import {
  supabaseInsert,
  supabaseSelect,
  supabaseUpdate,
} from "./supabase-rest";
import { checkSmsVerification, sendSmsVerification } from "./twilio-verify";
import { recordUserAction } from "./user-action-log";

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

function calculatePregnancyMetrics(input: {
  pregnancyWeekOrDueDate?: string;
  dueDate?: string | null;
}) {
  if (input.dueDate) {
    const dueDate = new Date(`${input.dueDate}T00:00:00`);
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const diffDays = Math.round(
      (dueDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
    );
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

type PregnancyMetrics = ReturnType<typeof calculatePregnancyMetrics>;

type PregnancyProfileOnboardingPayload = {
  pregnancyWeekOrDueDate?: string | null;
  tonePreference?: string | null;
  babyNickname?: string | null;
  hospitalName?: string | null;
  notificationTime?: string | null;
  themeKey?: string | null;
};

type PregnancyProfileFirstClassValues = {
  babyNickname?: string | null;
  notificationTime?: string | null;
  themeKey?: string | null;
};

type BuildPregnancyProfilePayloadOptions = {
  pregnancyMetrics: PregnancyMetrics;
  dueDate?: string | null;
  pregnancyWeekOrDueDate?: string | null;
  tonePreference: string;
  inputBabyNickname?: string | null;
  inputHospitalName?: string | null;
  inputNotificationTime?: string | null;
  inputThemeKey?: string | null;
  existingOnboardingPayload?: PregnancyProfileOnboardingPayload | null;
  existingFirstClass?: PregnancyProfileFirstClassValues | null;
};

export function buildPregnancyProfilePayload({
  pregnancyMetrics,
  dueDate,
  pregnancyWeekOrDueDate,
  tonePreference,
  inputBabyNickname,
  inputHospitalName,
  inputNotificationTime,
  inputThemeKey,
  existingOnboardingPayload,
  existingFirstClass,
}: BuildPregnancyProfilePayloadOptions) {
  const basePayload = existingOnboardingPayload ?? {};
  const nextBabyNickname =
    inputBabyNickname ??
    existingFirstClass?.babyNickname ??
    basePayload.babyNickname ??
    null;
  const nextNotificationTime =
    inputNotificationTime ??
    existingFirstClass?.notificationTime ??
    basePayload.notificationTime ??
    "08:30";
  const nextThemeKey = resolveMobileThemeKey(
    inputThemeKey ??
      existingFirstClass?.themeKey ??
      basePayload.themeKey ??
      DEFAULT_MOBILE_THEME_KEY,
  );

  const nextOnboardingPayload = {
    ...basePayload,
    pregnancyWeekOrDueDate:
      pregnancyWeekOrDueDate ?? basePayload.pregnancyWeekOrDueDate ?? null,
    tonePreference,
    babyNickname: nextBabyNickname,
    hospitalName: inputHospitalName ?? basePayload.hospitalName ?? null,
    notificationTime: nextNotificationTime,
    themeKey: nextThemeKey,
  };

  return {
    pregnancy_status: "pregnant",
    pregnancy_day_count: pregnancyMetrics.pregnancyDayCount,
    pregnancy_week: pregnancyMetrics.pregnancyWeek,
    pregnancy_day_in_week: pregnancyMetrics.pregnancyDayInWeek,
    due_date: dueDate ?? pregnancyMetrics.dueDate ?? null,
    baby_nickname: nextBabyNickname,
    theme_key: nextThemeKey,
    notification_time: nextNotificationTime,
    onboarding_payload: nextOnboardingPayload,
  };
}

function toAuthenticatedUser(
  user: UserRow,
  hasCompletedOnboarding: boolean,
): AuthenticatedUser {
  return {
    id: user.id,
    phoneNumber: user.phone_number,
    displayName: user.display_name,
    hasCompletedOnboarding,
  };
}

function encodeVerificationToken(phoneNumber: string) {
  return Buffer.from(JSON.stringify({ phoneNumber }), "utf8").toString(
    "base64url",
  );
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
  return (
    expectedHash.length === actualHash.length &&
    timingSafeEqual(expectedHash, actualHash)
  );
}

function nowIso() {
  return new Date().toISOString();
}

export async function findUserByPhoneNumber(phoneNumber: string) {
  const users = await supabaseSelect<UserRow[]>(
    `users?select=id,display_name,phone_number,account_status,password_hash,password_set_at,phone_verified_at&phone_number=eq.${encodeURIComponent(phoneNumber)}&limit=1`,
  );
  return users[0] ?? null;
}

export async function getAuthenticatedUser(userId: string) {
  const [users, profiles] = await Promise.all([
    supabaseSelect<UserRow[]>(
      `users?select=id,display_name,phone_number,account_status,password_hash,password_set_at,phone_verified_at&id=eq.${userId}&limit=1`,
    ),
    supabaseSelect<PregnancyProfileRow[]>(
      `pregnancy_profiles?select=user_id&user_id=eq.${userId}&limit=1`,
    ),
  ]);

  if (!users[0]) {
    return null;
  }

  return toAuthenticatedUser(users[0], Boolean(profiles[0]));
}

export async function signInUserByPhoneNumber(
  phoneNumber: string,
  password: string,
) {
  const user = await findUserByPhoneNumber(phoneNumber);
  if (!user) {
    throw new Error("등록된 전화번호를 찾을 수 없습니다.");
  }

  if (user.account_status === "pending_recovery") {
    throw new Error(
      "비밀번호 재설정 대기 중입니다. 새 비밀번호를 먼저 설정해 주세요.",
    );
  }

  if (user.account_status === "paused" || user.account_status === "deleted") {
    throw new Error(
      "현재 로그인할 수 없는 계정 상태입니다. 관리자에게 문의해 주세요.",
    );
  }

  if (!verifyPassword(password, user.password_hash)) {
    throw new Error("전화번호 또는 비밀번호가 맞지 않습니다.");
  }

  await supabaseUpdate(`users?id=eq.${user.id}`, {
    last_login_at: nowIso(),
    updated_at: nowIso(),
  });

  await recordUserAction({
    userId: user.id,
    actionType: "login_succeeded",
  });

  const nextUser = await getAuthenticatedUser(user.id);
  if (!nextUser) {
    throw new Error("로그인 사용자 정보를 확인하지 못했습니다.");
  }

  return nextUser;
}

export async function verifyPhoneNumber(
  phoneNumber: string,
  verificationCode: string,
) {
  const user = await findUserByPhoneNumber(phoneNumber);
  if (!user) {
    throw new Error("등록된 전화번호를 찾을 수 없습니다.");
  }

  await checkSmsVerification(phoneNumber, verificationCode);

  await recordUserAction({
    userId: user.id,
    actionType: "phone_verified",
  });

  return {
    verificationToken: encodeVerificationToken(phoneNumber),
  };
}

export async function startPhoneVerification(phoneNumber: string) {
  const user = await findUserByPhoneNumber(phoneNumber);
  if (!user) {
    throw new Error("등록된 전화번호를 찾을 수 없습니다.");
  }

  await sendSmsVerification(phoneNumber);

  await recordUserAction({
    userId: user.id,
    actionType: "phone_verification_started",
    payload: {
      flow: "signup",
    },
  });

  return { ok: true as const };
}

export async function setUserPassword(
  verificationToken: string,
  password: string,
) {
  const { phoneNumber } = decodeVerificationToken(verificationToken);
  const user = await findUserByPhoneNumber(phoneNumber);
  if (!user) {
    throw new Error("인증 대상 사용자를 찾지 못했습니다.");
  }

  await supabaseUpdate(`users?id=eq.${user.id}`, {
    account_status: "active",
    password_hash: hashPassword(password),
    password_set_at: nowIso(),
    phone_verified_at: nowIso(),
    updated_at: nowIso(),
  });

  await recordUserAction({
    userId: user.id,
    actionType: "password_set",
    payload: {
      flow: user.account_status === "pending_recovery" ? "recovery" : "signup",
    },
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
    updated_at: nowIso(),
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

  await sendSmsVerification(phoneNumber);

  await recordUserAction({
    userId: user.id,
    actionType: "password_reset_requested",
  });

  return { ok: true as const };
}

export async function completeUserOnboarding(input: {
  userId: string;
  pregnancyWeekOrDueDate: string;
  tonePreference: string;
  dueDate?: string | null;
  themeKey?: string | null;
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

  const payload = buildPregnancyProfilePayload({
    pregnancyMetrics: metrics,
    dueDate: metrics.dueDate,
    pregnancyWeekOrDueDate: input.pregnancyWeekOrDueDate ?? null,
    tonePreference: input.tonePreference,
    inputBabyNickname: null,
    inputHospitalName: null,
    inputNotificationTime: "08:30",
    inputThemeKey: input.themeKey ?? DEFAULT_MOBILE_THEME_KEY,
  });

  if (existingProfiles[0]) {
    await supabaseUpdate(
      `pregnancy_profiles?user_id=eq.${input.userId}`,
      {
        ...payload,
        updated_at: nowIso(),
      },
    );
  } else {
    await supabaseInsert("pregnancy_profiles", {
      user_id: input.userId,
      ...payload,
    });
  }

  await recordUserAction({
    userId: input.userId,
    actionType: "onboarding_completed",
    payload: {
      pregnancyWeek: metrics.pregnancyWeek,
      tonePreference: input.tonePreference,
      themeKey: resolveMobileThemeKey(input.themeKey),
    },
  });

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
  themeKey?: string | null;
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
    updated_at: nowIso(),
  });

  const existingProfiles = await supabaseSelect<
    Array<{
      id: string;
      onboarding_payload: {
        pregnancyWeekOrDueDate?: string | null;
        tonePreference?: string | null;
        babyNickname?: string | null;
        hospitalName?: string | null;
        notificationTime?: string | null;
      } | null;
      baby_nickname?: string | null;
      notification_time?: string | null;
      theme_key?: string | null;
    }>
  >(
    `pregnancy_profiles?select=id,onboarding_payload,baby_nickname,notification_time,theme_key&user_id=eq.${input.userId}&limit=1`,
  );

  const existingProfile = existingProfiles[0];
  const existingPayload = existingProfile?.onboarding_payload ?? {};
  const profilePayload = buildPregnancyProfilePayload({
    pregnancyMetrics: metrics,
    dueDate: metrics.dueDate,
    pregnancyWeekOrDueDate:
      input.dueDate || existingPayload.pregnancyWeekOrDueDate || null,
    tonePreference: input.tonePreference,
    inputBabyNickname: input.babyNickname,
    inputHospitalName: input.hospitalName,
    inputNotificationTime: input.notificationTime,
    inputThemeKey: input.themeKey ?? DEFAULT_MOBILE_THEME_KEY,
    existingOnboardingPayload: existingProfile?.onboarding_payload ?? null,
    existingFirstClass: existingProfile
      ? {
          babyNickname: existingProfile.baby_nickname ?? null,
          notificationTime: existingProfile.notification_time ?? null,
          themeKey: existingProfile.theme_key ?? null,
        }
      : null,
  });

  if (existingProfiles[0]) {
    await supabaseUpdate(
      `pregnancy_profiles?user_id=eq.${input.userId}`,
      {
        ...profilePayload,
        updated_at: nowIso(),
      },
    );
  } else {
    await supabaseInsert("pregnancy_profiles", {
      user_id: input.userId,
      ...profilePayload,
    });
  }

  await recordUserAction({
    userId: input.userId,
    actionType: "profile_updated",
    payload: {
      displayName: input.displayName,
      dueDate: metrics.dueDate,
      babyNickname: input.babyNickname ?? null,
      notificationTime: input.notificationTime ?? "08:30",
      themeKey: resolveMobileThemeKey(input.themeKey),
    },
  });

  const nextUser = await getAuthenticatedUser(input.userId);
  if (!nextUser) {
    throw new Error("프로필 저장 후 사용자 정보를 확인하지 못했습니다.");
  }

  return nextUser;
}
