import type {
  AuthenticatedUser,
  MobileProfileViewData,
  OnboardingProfileInput,
} from "@gynecology-chatbot/app-core";
import { DEFAULT_MOBILE_THEME_KEY } from "@gynecology-chatbot/app-core";

interface MockMobileRuntimeState {
  currentUser: AuthenticatedUser | null;
  pregnancyWeekLabel: string;
  pregnancyDayCount: number;
  tonePreference: string;
  dueDate: string | null;
  babyNickname: string | null;
  hospitalName: string | null;
  notificationTime: string;
  themeKey: MobileProfileViewData["themeKey"];
}

const runtimeState: MockMobileRuntimeState = {
  currentUser: null,
  pregnancyWeekLabel: "18주 6일",
  pregnancyDayCount: 132,
  tonePreference: "차분하고 핵심만",
  dueDate: "2026-08-01",
  babyNickname: "튼튼이",
  hospitalName: "산단여성병원",
  notificationTime: "08:30",
  themeKey: DEFAULT_MOBILE_THEME_KEY,
};

function buildAuthenticatedUser(input: {
  phoneNumber: string;
  displayName?: string;
  hasCompletedOnboarding?: boolean;
}): AuthenticatedUser {
  const normalizedPhoneNumber = input.phoneNumber.trim() || "010-0000-0000";

  return {
    id: `user-${normalizedPhoneNumber.replace(/[^0-9]/g, "") || "demo"}`,
    phoneNumber: normalizedPhoneNumber,
    displayName: input.displayName ?? "수연",
    hasCompletedOnboarding: input.hasCompletedOnboarding ?? false,
  };
}

export function readMockMobileRuntime() {
  return runtimeState;
}

export function signInMockUser(phoneNumber: string) {
  const existingUser = runtimeState.currentUser;
  const nextUser = buildAuthenticatedUser({
    phoneNumber,
    displayName: existingUser?.displayName,
    hasCompletedOnboarding: existingUser?.hasCompletedOnboarding ?? false,
  });
  runtimeState.currentUser = nextUser;
  return nextUser;
}

export function createMockVerificationRequest(phoneNumber: string) {
  const normalizedPhoneNumber = phoneNumber.trim();
  if (!normalizedPhoneNumber) {
    throw new Error("전화번호를 먼저 입력해 주세요.");
  }

  if (!runtimeState.currentUser) {
    runtimeState.currentUser = buildAuthenticatedUser({
      phoneNumber: normalizedPhoneNumber,
      hasCompletedOnboarding: false,
    });
  }
}

export function clearMockMobileCurrentUser() {
  runtimeState.currentUser = null;
}

function toIsoDateOnly(input: string) {
  const trimmed = input.trim();
  const ymd = trimmed.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
  if (ymd) {
    return ymd;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

function calculatePregnancyFromDueDate(isoDate: string) {
  const dueDate = new Date(`${isoDate}T00:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  const pregnancyDayCount = Math.max(0, Math.min(280, 280 - diffDays));
  const pregnancyWeek = Math.max(1, Math.floor(pregnancyDayCount / 7));
  const pregnancyDay = pregnancyDayCount % 7;

  return { pregnancyWeek, pregnancyDayCount, pregnancyDay };
}

export function completeMockOnboarding(input: OnboardingProfileInput) {
  const currentUser =
    runtimeState.currentUser ??
    buildAuthenticatedUser({
      phoneNumber: "010-0000-0000",
      hasCompletedOnboarding: false,
    });

  const nextUser: AuthenticatedUser = {
    ...currentUser,
    hasCompletedOnboarding: true,
  };

  runtimeState.currentUser = nextUser;
  runtimeState.tonePreference =
    input.tonePreference.trim() || runtimeState.tonePreference;
  runtimeState.themeKey = input.themeKey ?? runtimeState.themeKey;
  runtimeState.babyNickname = input.babyNickname?.trim() || null;

  const dueDate = toIsoDateOnly(input.pregnancyWeekOrDueDate);
  if (dueDate) {
    runtimeState.dueDate = dueDate;
    const { pregnancyWeek, pregnancyDay } =
      calculatePregnancyFromDueDate(dueDate);
    runtimeState.pregnancyWeekLabel = `${pregnancyWeek}주 ${pregnancyDay}일`;
    runtimeState.pregnancyDayCount = pregnancyWeek * 7 + pregnancyDay;
    return nextUser;
  }

  const weekMatch = input.pregnancyWeekOrDueDate.match(/(\d+)/);
  if (weekMatch) {
    const week = Number(weekMatch[1]);
    runtimeState.pregnancyWeekLabel = `${week}주차`;
    runtimeState.pregnancyDayCount = week * 7;
  }

  return nextUser;
}

export function readMockMobileProfile(): MobileProfileViewData {
  const currentUser =
    runtimeState.currentUser ??
    buildAuthenticatedUser({
      phoneNumber: "010-0000-0000",
      displayName: "수연",
      hasCompletedOnboarding: true,
    });

  return {
    userId: currentUser.id,
    displayName: currentUser.displayName,
    phoneNumber: currentUser.phoneNumber,
    pregnancyWeekLabel: runtimeState.pregnancyWeekLabel,
    pregnancyDayCount: runtimeState.pregnancyDayCount,
    accountStatus: "active",
    hasCompletedOnboarding: currentUser.hasCompletedOnboarding,
    dueDate: runtimeState.dueDate,
    tonePreference: runtimeState.tonePreference,
    babyNickname: runtimeState.babyNickname,
    hospitalName: runtimeState.hospitalName,
    notificationTime: runtimeState.notificationTime,
    themeKey: runtimeState.themeKey,
  };
}

export function updateMockMobileProfile(input: {
  displayName: string;
  dueDate?: string | null;
  tonePreference: string;
  babyNickname?: string | null;
  hospitalName?: string | null;
  notificationTime?: string | null;
  themeKey?: MobileProfileViewData["themeKey"];
}) {
  const currentUser = readMockMobileProfile();
  runtimeState.currentUser = {
    ...runtimeState.currentUser,
    id: currentUser.userId,
    phoneNumber: currentUser.phoneNumber,
    hasCompletedOnboarding: true,
    displayName: input.displayName,
  };
  runtimeState.tonePreference = input.tonePreference;
  runtimeState.dueDate = input.dueDate ?? null;
  runtimeState.babyNickname = input.babyNickname ?? null;
  runtimeState.hospitalName = input.hospitalName ?? null;
  runtimeState.notificationTime = input.notificationTime ?? "08:30";
  runtimeState.themeKey = input.themeKey ?? runtimeState.themeKey;

  return runtimeState.currentUser;
}
