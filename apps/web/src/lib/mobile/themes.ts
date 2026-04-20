"use client";

import {
  DEFAULT_MOBILE_THEME_KEY,
  getMobileThemePreset,
  MOBILE_THEME_OPTIONS,
  resolveMobileThemeKey,
  type MobileThemeKey,
} from "@gynecology-chatbot/app-core";

export {
  DEFAULT_MOBILE_THEME_KEY,
  MOBILE_THEME_OPTIONS,
  resolveMobileThemeKey,
  type MobileThemeKey,
};

const THEME_ATTRIBUTE = "data-theme";

export function applyMobileTheme(themeKey?: string | null) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.setAttribute(
    THEME_ATTRIBUTE,
    resolveMobileThemeKey(themeKey),
  );
}

export function readAppliedMobileTheme() {
  if (typeof document === "undefined") {
    return DEFAULT_MOBILE_THEME_KEY;
  }

  return resolveMobileThemeKey(
    document.documentElement.getAttribute(THEME_ATTRIBUTE),
  );
}

export function getMobileThemeOption(themeKey?: string | null) {
  return getMobileThemePreset(themeKey);
}
