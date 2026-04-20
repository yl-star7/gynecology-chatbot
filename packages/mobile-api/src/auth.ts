import type { AuthenticatedUser } from "@gynecology-chatbot/app-core";
import {
  DEFAULT_MOBILE_THEME_KEY,
  resolveMobileThemeKey,
} from "@gynecology-chatbot/app-core";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";
import { createHash, randomBytes, randomUUID } from "crypto";
import {
  computePhoneNumberBlindIndex,
  createPhoneNumberStorage,
  decryptPhoneNumber,
} from "./privacy/phone-crypto";
import {
  checkSmsVerification,
  normalizePhoneNumberToE164,
  sendSmsVerification,
} from "./solapi-sms";
import { recordUserAction } from "./user-action-log";

type UserRow = {
  id: string;
  phone_number_encrypted: string;
  phone_number_last4: string;
  account_status: "active" | "paused" | "deleted" | "pending_recovery";
  phone_verified_at: string | null;
  last_login_at: string | null;
};

type PregnancyProfileRow = {
  id?: string;
  user_id: string;
  display_name?: string | null;
  onboarding_payload?: PregnancyProfileOnboardingPayload | null;
  due_date?: string | null;
  baby_nickname?: string | null;
  notification_time?: string | null;
  theme_key?: string | null;
};

type BlockedPhoneNumberRow = {
  id: string;
  phone_number_encrypted: string;
  phone_number_last4: string;
  phone_number_blind_index: string;
  display_name: string | null;
  note: string | null;
};

type UserSelectRow = {
  id: string;
  phone_number_encrypted: string | null;
  phone_number_last4: string | null;
  account_status: string;
  phone_verified_at: Date | null;
  last_login_at: Date | null;
};

type PregnancyProfileSelectRow = {
  id: string;
  user_id: string;
  display_name: string | null;
  onboarding_payload: Prisma.JsonValue;
  due_date: Date | null;
  baby_nickname: string | null;
  notification_time: Date | null;
  theme_key: string | null;
};

type BlockedPhoneNumberSelectRow = {
  id: string;
  phone_number_encrypted: string | null;
  phone_number_last4: string | null;
  phone_number_blind_index: string | null;
  display_name: string | null;
  note: string | null;
};

type AuthFlow = "sign_in" | "signup";

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

function nowIso() {
  return new Date().toISOString();
}

function oneYearFromNow() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date;
}

function tenMinutesFromNow() {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 10);
  return date;
}

function toIsoString(value: Date | null) {
  return value?.toISOString() ?? null;
}

function parseOnboardingPayload(
  value: Prisma.JsonValue,
): PregnancyProfileOnboardingPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as PregnancyProfileOnboardingPayload;
}

function mapUserRow(
  row: UserSelectRow,
): UserRow & { phone_number_encrypted: string } {
  if (!row.phone_number_encrypted || !row.phone_number_last4) {
    throw new Error("전화번호 데이터가 올바르지 않습니다.");
  }

  return {
    id: row.id,
    phone_number_encrypted: row.phone_number_encrypted,
    phone_number_last4: row.phone_number_last4,
    account_status: row.account_status as UserRow["account_status"],
    phone_verified_at: toIsoString(row.phone_verified_at),
    last_login_at: toIsoString(row.last_login_at),
  };
}

function mapPregnancyProfileRow(
  row: PregnancyProfileSelectRow,
): PregnancyProfileRow {
  return {
    id: row.id,
    user_id: row.user_id,
    display_name: row.display_name,
    onboarding_payload: parseOnboardingPayload(row.onboarding_payload),
    due_date: row.due_date ? row.due_date.toISOString().slice(0, 10) : null,
    baby_nickname: row.baby_nickname,
    notification_time: row.notification_time
      ? row.notification_time.toISOString().slice(11, 19)
      : null,
    theme_key: row.theme_key,
  };
}

function mapBlockedPhoneNumberRow(
  row: BlockedPhoneNumberSelectRow,
): BlockedPhoneNumberRow & { phone_number_encrypted: string } {
  if (
    !row.phone_number_encrypted ||
    !row.phone_number_last4 ||
    !row.phone_number_blind_index
  ) {
    throw new Error("차단 번호 데이터가 올바르지 않습니다.");
  }

  return {
    id: row.id,
    phone_number_encrypted: row.phone_number_encrypted,
    phone_number_last4: row.phone_number_last4,
    phone_number_blind_index: row.phone_number_blind_index,
    display_name: row.display_name,
    note: row.note,
  };
}

function normalizeNotificationTimeForPrisma(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return new Date(`1970-01-01T${value}`);
}

function buildSessionToken() {
  return randomBytes(32).toString("base64url");
}

function hashSessionToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizePhoneNumber(phoneNumber: string) {
  const trimmed = phoneNumber.trim();
  if (!trimmed) {
    throw new Error("전화번호를 입력해 주세요.");
  }

  try {
    return normalizePhoneNumberToE164(trimmed);
  } catch {
    return trimmed;
  }
}

function createPhoneCandidates(phoneNumber: string) {
  const trimmed = phoneNumber.trim();
  const candidates = new Set<string>();

  if (trimmed) {
    candidates.add(trimmed);
  }

  try {
    const normalized = normalizePhoneNumberToE164(trimmed);
    candidates.add(normalized);

    if (normalized.startsWith("+82")) {
      candidates.add(`0${normalized.slice(3)}`);
    }
  } catch {
    // Ignore normalization errors here; callers validate separately.
  }

  return [...candidates];
}

function ensureUserCanSignIn(
  accountStatus: UserRow["account_status"],
  _flow: AuthFlow,
) {
  if (accountStatus === "paused" || accountStatus === "deleted") {
    throw new Error(
      "현재 로그인할 수 없는 계정 상태입니다. 관리자에게 문의해 주세요.",
    );
  }
}

async function findPregnancyProfile(userId: string) {
  const profile = await prisma.pregnancy_profiles.findUnique({
    where: { user_id: userId },
    select: {
      id: true,
      user_id: true,
      display_name: true,
      onboarding_payload: true,
      due_date: true,
      baby_nickname: true,
      notification_time: true,
      theme_key: true,
    },
  });

  return profile ? mapPregnancyProfileRow(profile) : null;
}

function toDecryptedPhoneRow<T extends { phone_number_encrypted: string }>(
  row: T,
) {
  return {
    ...row,
    phone_number: decryptPhoneNumber(row.phone_number_encrypted),
  };
}

export async function findBlockedPhoneNumber(phoneNumber: string) {
  const candidates = createPhoneCandidates(phoneNumber);

  for (const candidate of candidates) {
    const blindIndex = computePhoneNumberBlindIndex(candidate);
    const row = await prisma.blocked_phone_numbers.findUnique({
      where: { phone_number_blind_index: blindIndex },
      select: {
        id: true,
        phone_number_encrypted: true,
        phone_number_last4: true,
        phone_number_blind_index: true,
        display_name: true,
        note: true,
      },
    });

    if (row) {
      return toDecryptedPhoneRow(mapBlockedPhoneNumberRow(row));
    }
  }

  return null;
}

function ensurePhoneNumberNotBlocked(phoneNumber: string) {
  return findBlockedPhoneNumber(phoneNumber).then((blockedPhoneNumber) => {
    if (blockedPhoneNumber) {
      throw new Error("중지된 번호입니다. 관리자에게 문의해주세요.");
    }
  });
}

function toAuthenticatedUser(
  user: UserRow & { phone_number: string },
  profile: PregnancyProfileRow | null,
): AuthenticatedUser {
  return {
    id: user.id,
    phoneNumber: user.phone_number,
    displayName: profile?.display_name?.trim() || "사용자",
    hasCompletedOnboarding: hasCompletedProfileOnboarding(profile),
  };
}

export function hasCompletedProfileOnboarding(
  profile: Pick<PregnancyProfileRow, "onboarding_payload" | "due_date"> | null,
) {
  if (!profile) {
    return false;
  }

  const payload = profile.onboarding_payload;
  const tonePreference = payload?.tonePreference?.trim();
  const pregnancySignal =
    payload?.pregnancyWeekOrDueDate?.trim() ?? profile.due_date?.trim();

  return Boolean(tonePreference && pregnancySignal);
}

export async function findUserByPhoneNumber(phoneNumber: string) {
  const candidates = createPhoneCandidates(phoneNumber);

  for (const candidate of candidates) {
    const blindIndex = computePhoneNumberBlindIndex(candidate);
    const user = await prisma.users.findUnique({
      where: { phone_number_blind_index: blindIndex },
      select: {
        id: true,
        phone_number_encrypted: true,
        phone_number_last4: true,
        account_status: true,
        phone_verified_at: true,
        last_login_at: true,
      },
    });

    if (user) {
      return toDecryptedPhoneRow(mapUserRow(user));
    }
  }

  return null;
}

export async function getAuthenticatedUser(userId: string) {
  const [user, profile] = await Promise.all([
    prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone_number_encrypted: true,
        phone_number_last4: true,
        account_status: true,
        phone_verified_at: true,
        last_login_at: true,
      },
    }),
    findPregnancyProfile(userId),
  ]);

  if (!user) {
    return null;
  }

  return toAuthenticatedUser(toDecryptedPhoneRow(mapUserRow(user)), profile);
}

async function createOrUpdateSession(userId: string) {
  const sessionToken = buildSessionToken();
  const currentTimestamp = new Date();

  await prisma.auth_sessions.updateMany({
    where: { user_id: userId },
    data: {
      revoked_at: currentTimestamp,
    },
  });

  await prisma.auth_sessions.create({
    data: {
      user_id: userId,
      refresh_token_hash: hashSessionToken(sessionToken),
      expires_at: oneYearFromNow(),
      last_used_at: currentTimestamp,
      created_at: currentTimestamp,
    },
  });

  return sessionToken;
}

async function recordPhoneVerificationRequest(input: {
  phoneNumber: string;
  verificationSid?: string;
  status: string;
  channel?: string;
  verifiedAt?: string | null;
}) {
  const storage = createPhoneNumberStorage(input.phoneNumber);
  await prisma.phone_verification_requests.create({
    data: {
      phone_number_encrypted: storage.phoneNumberEncrypted,
      phone_number_blind_index: storage.phoneNumberBlindIndex,
      phone_number_last4: storage.phoneNumberLast4,
      verification_sid: input.verificationSid ?? null,
      channel: input.channel ?? "sms",
      status: input.status,
      verified_at: input.verifiedAt ? new Date(input.verifiedAt) : null,
      expires_at: tenMinutesFromNow(),
    },
  });
}

async function upsertPhoneUser(
  phoneNumber: string,
  legacyDisplayName?: string | null,
) {
  const existingUser = await findUserByPhoneNumber(phoneNumber);
  const nextTimestamp = new Date();

  if (existingUser) {
    ensureUserCanSignIn(existingUser.account_status, "sign_in");
    const storage = createPhoneNumberStorage(phoneNumber);

    await prisma.users.update({
      where: { id: existingUser.id },
      data: {
        account_status: "active",
        phone_number_encrypted: storage.phoneNumberEncrypted,
        phone_number_blind_index: storage.phoneNumberBlindIndex,
        phone_number_last4: storage.phoneNumberLast4,
        phone_verified_at: nextTimestamp,
        last_login_at: nextTimestamp,
        updated_at: nextTimestamp,
      },
    });

    return existingUser.id;
  }

  const userId = randomUUID();
  const storage = createPhoneNumberStorage(phoneNumber);
  const payload = {
    id: userId,
    phone_number: storage.phoneNumberLast4 + "_" + userId.slice(0, 14),
    phone_number_encrypted: storage.phoneNumberEncrypted,
    phone_number_blind_index: storage.phoneNumberBlindIndex,
    phone_number_last4: storage.phoneNumberLast4,
    role: "user",
    account_status: "active",
    phone_verified_at: nextTimestamp,
    last_login_at: nextTimestamp,
    updated_at: nextTimestamp,
  };

  await prisma.users.create({
    data: payload,
  });

  return userId;
}

export async function startPhoneVerification(phoneNumber: string) {
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

  await ensurePhoneNumberNotBlocked(normalizedPhoneNumber);
  const existingUser = await findUserByPhoneNumber(normalizedPhoneNumber);

  if (existingUser) {
    ensureUserCanSignIn(existingUser.account_status, "sign_in");
  }

  const verification = await sendSmsVerification(normalizedPhoneNumber);
  await recordPhoneVerificationRequest({
    phoneNumber: verification.to ?? normalizedPhoneNumber,
    verificationSid: verification.sid,
    status: verification.status ?? "pending",
    channel: "sms",
  });

  if (existingUser) {
    await recordUserAction({
      userId: existingUser.id,
      actionType: "phone_verification_started",
      payload: {
        flow: "sign_in",
      },
    });
  }

  return { ok: true as const };
}

export async function completePhoneSignIn(
  phoneNumber: string,
  verificationCode: string,
) {
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

  await ensurePhoneNumberNotBlocked(normalizedPhoneNumber);
  const verification = await checkSmsVerification(
    normalizedPhoneNumber,
    verificationCode,
  );

  const verifiedAt = nowIso();
  await recordPhoneVerificationRequest({
    phoneNumber: verification.to ?? normalizedPhoneNumber,
    verificationSid: verification.sid,
    status: verification.status,
    channel: "sms",
    verifiedAt,
  });

  const userId = await upsertPhoneUser(
    verification.to ?? normalizedPhoneNumber,
    null,
  );
  const sessionToken = await createOrUpdateSession(userId);

  await recordUserAction({
    userId,
    actionType: "phone_verified",
  });

  await recordUserAction({
    userId,
    actionType: "login_succeeded",
  });

  const nextUser = await getAuthenticatedUser(userId);
  if (!nextUser) {
    throw new Error("로그인 사용자 정보를 확인하지 못했습니다.");
  }

  return {
    user: nextUser,
    sessionToken,
  };
}

export async function verifyPhoneNumber(
  phoneNumber: string,
  verificationCode: string,
) {
  const result = await completePhoneSignIn(phoneNumber, verificationCode);
  return result;
}

export async function completeUserOnboarding(input: {
  userId: string;
  pregnancyWeekOrDueDate: string;
  tonePreference: string;
  dueDate?: string | null;
  babyNickname?: string | null;
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

  const existingProfile = await prisma.pregnancy_profiles.findUnique({
    where: { user_id: input.userId },
    select: { id: true },
  });

  const payload = buildPregnancyProfilePayload({
    pregnancyMetrics: metrics,
    dueDate: metrics.dueDate,
    pregnancyWeekOrDueDate: input.pregnancyWeekOrDueDate ?? null,
    tonePreference: input.tonePreference,
    inputBabyNickname: input.babyNickname ?? null,
    inputHospitalName: null,
    inputNotificationTime: "08:30",
    inputThemeKey: input.themeKey ?? DEFAULT_MOBILE_THEME_KEY,
  });

  const prismaPayload = {
    pregnancy_status: payload.pregnancy_status,
    pregnancy_day_count: payload.pregnancy_day_count,
    pregnancy_week: payload.pregnancy_week,
    pregnancy_day_in_week: payload.pregnancy_day_in_week,
    due_date: payload.due_date
      ? new Date(`${payload.due_date}T00:00:00`)
      : null,
    baby_nickname: payload.baby_nickname,
    theme_key: payload.theme_key,
    notification_time: normalizeNotificationTimeForPrisma(
      payload.notification_time,
    ),
    onboarding_payload: payload.onboarding_payload as Prisma.InputJsonValue,
  };

  if (existingProfile) {
    await prisma.pregnancy_profiles.update({
      where: { user_id: input.userId },
      data: {
        ...prismaPayload,
        updated_at: new Date(),
      },
    });
  } else {
    await prisma.pregnancy_profiles.create({
      data: {
        user_id: input.userId,
        ...prismaPayload,
      },
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

  const existingProfileRecord = await prisma.pregnancy_profiles.findUnique({
    where: { user_id: input.userId },
    select: {
      id: true,
      user_id: true,
      display_name: true,
      onboarding_payload: true,
      due_date: true,
      baby_nickname: true,
      notification_time: true,
      theme_key: true,
    },
  });

  const existingProfile = existingProfileRecord
    ? mapPregnancyProfileRow(existingProfileRecord)
    : null;
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

  const nextDisplayName = input.displayName.trim() || null;

  const prismaProfilePayload = {
    pregnancy_status: profilePayload.pregnancy_status,
    pregnancy_day_count: profilePayload.pregnancy_day_count,
    pregnancy_week: profilePayload.pregnancy_week,
    pregnancy_day_in_week: profilePayload.pregnancy_day_in_week,
    due_date: profilePayload.due_date
      ? new Date(`${profilePayload.due_date}T00:00:00`)
      : null,
    baby_nickname: profilePayload.baby_nickname,
    theme_key: profilePayload.theme_key,
    notification_time: normalizeNotificationTimeForPrisma(
      profilePayload.notification_time,
    ),
    onboarding_payload:
      profilePayload.onboarding_payload as Prisma.InputJsonValue,
    display_name: nextDisplayName,
  };

  if (existingProfile) {
    await prisma.pregnancy_profiles.update({
      where: { user_id: input.userId },
      data: {
        ...prismaProfilePayload,
        updated_at: new Date(),
      },
    });
  } else {
    await prisma.pregnancy_profiles.create({
      data: {
        user_id: input.userId,
        ...prismaProfilePayload,
      },
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
