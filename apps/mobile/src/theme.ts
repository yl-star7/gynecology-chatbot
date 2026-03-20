import { Platform } from "react-native";
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

// Re-export design tokens (no circular dependency - tokens.ts has no imports from theme)
export { space, radii, typo } from "./tokens";

// ─── Shadow presets (depend on palette, so defined here) ─
export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: palette.ink,
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    android: {
      elevation: 2,
    },
  }),
  header: Platform.select({
    ios: {
      shadowColor: palette.ink,
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
    },
    android: {
      elevation: 3,
    },
  }),
  fab: {
    shadowColor: patientSurfacePalette.accentSolid,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
} as const;
