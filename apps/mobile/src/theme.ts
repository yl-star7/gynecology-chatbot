import {
  DEFAULT_MOBILE_THEME_KEY,
  getMobileThemePreset,
  resolveMobileThemeKey,
} from "@gynecology-chatbot/app-core";

export const palette = getMobileThemePreset(
  process.env.EXPO_PUBLIC_THEME_KEY ?? DEFAULT_MOBILE_THEME_KEY,
).native;

export function resolveNativePalette(themeKey?: string | null) {
  return getMobileThemePreset(resolveMobileThemeKey(themeKey)).native;
}
