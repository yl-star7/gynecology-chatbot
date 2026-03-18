"use client";

const USER_ID_KEY = "phedy-mobile-user-id";
const ONBOARDING_KEY = "phedy-mobile-onboarding-complete";
const PROFILE_KEY = "phedy-mobile-profile";

function isBrowser() {
  return typeof window !== "undefined";
}

export function readStoredMobileUserId() {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(USER_ID_KEY);
}

export function storeMobileUserId(userId: string) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(USER_ID_KEY, userId);
}

export function readStoredMobileProfile() {
  if (!isBrowser()) {
    return null as null | {
      displayName?: string;
      phoneNumber?: string;
      pregnancyWeekLabel?: string;
      themeKey?: string;
    };
  }

  const raw = window.localStorage.getItem(PROFILE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as {
      displayName?: string;
      phoneNumber?: string;
      pregnancyWeekLabel?: string;
      themeKey?: string;
    };
  } catch {
    return null;
  }
}

export function storeMobileProfile(profile: {
  userId?: string;
  displayName?: string;
  phoneNumber?: string;
  pregnancyWeekLabel?: string;
  themeKey?: string | null;
}) {
  if (!isBrowser()) {
    return;
  }

  const current = readStoredMobileProfile() ?? {};
  const nextProfile = {
    ...current,
    ...profile,
  };

  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile));
}

export function clearMobileSession() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(USER_ID_KEY);
  window.localStorage.removeItem(ONBOARDING_KEY);
  window.localStorage.removeItem(PROFILE_KEY);
}

export function markMobileOnboardingComplete() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(ONBOARDING_KEY, "true");
}

export function hasCompletedMobileOnboarding() {
  if (!isBrowser()) {
    return false;
  }

  return window.localStorage.getItem(ONBOARDING_KEY) === "true";
}
