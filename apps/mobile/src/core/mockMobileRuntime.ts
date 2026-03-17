import type { AuthenticatedUser, OnboardingProfileInput } from "@gynecology-chatbot/app-core";

interface MockMobileRuntimeState {
  currentUser: AuthenticatedUser | null;
  pregnancyWeekLabel: string;
  pregnancyDayCount: number;
  tonePreference: string;
}

const runtimeState: MockMobileRuntimeState = {
  currentUser: null,
  pregnancyWeekLabel: "18주 6일",
  pregnancyDayCount: 132,
  tonePreference: "차분하고 핵심만",
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

export function setMockPasswordUser(phoneNumber: string) {
  const nextUser = buildAuthenticatedUser({
    phoneNumber,
    hasCompletedOnboarding: false,
  });
  runtimeState.currentUser = nextUser;
  return nextUser;
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
  runtimeState.tonePreference = input.tonePreference.trim() || runtimeState.tonePreference;

  const weekMatch = input.pregnancyWeekOrDueDate.match(/(\d+)/);
  if (weekMatch) {
    runtimeState.pregnancyWeekLabel = `${weekMatch[1]}주차`;
    runtimeState.pregnancyDayCount = Number(weekMatch[1]) * 7;
  }

  return nextUser;
}
