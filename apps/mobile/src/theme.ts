import {
  DEFAULT_MOBILE_THEME_KEY,
  getMobileThemePreset,
  resolveMobileThemeKey,
} from "@gynecology-chatbot/app-core";

export const palette = getMobileThemePreset(
  process.env.EXPO_PUBLIC_THEME_KEY ?? DEFAULT_MOBILE_THEME_KEY,
).native;

export const patientSurfacePalette = {
  pageBackground: palette.background,
  surfacePrimary: palette.card,
  surfaceSecondary: palette.cardMuted,
  fieldSurface: palette.field,
  surfaceAccent: palette.accentSoft,
  accentSolid: palette.accent,
  strokeSubtle: palette.line,
  textPrimary: palette.ink,
  textSecondary: palette.subInk,
};

export function resolveNativePalette(themeKey?: string | null) {
  return getMobileThemePreset(resolveMobileThemeKey(themeKey)).native;
}

// Re-export design tokens for convenience
export { space, radii, typo, shadows } from "./tokens";
