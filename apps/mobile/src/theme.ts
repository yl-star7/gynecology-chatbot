import { Platform, processColor, StyleSheet } from "react-native";
import {
  DEFAULT_MOBILE_THEME_KEY,
  type MobileThemeKey,
  getMobileThemePreset,
  resolveMobileThemeKey,
} from "@gynecology-chatbot/app-core";

const initialThemeKey = resolveMobileThemeKey(
  process.env.EXPO_PUBLIC_THEME_KEY ?? DEFAULT_MOBILE_THEME_KEY,
);
const defaultNativePalette = getMobileThemePreset(DEFAULT_MOBILE_THEME_KEY).native;

let activeThemeKey = initialThemeKey;
let activeNativePalette = getMobileThemePreset(activeThemeKey).native;

export const palette = activeNativePalette;

export function createPatientSurfacePalette(nativePalette: typeof palette) {
  return {
    pageBackground: nativePalette.background,
    surfacePrimary: nativePalette.card,
    surfaceSecondary: nativePalette.cardMuted,
    fieldSurface: nativePalette.field,
    surfaceAccent: nativePalette.accentSoft,
    accentSolid: nativePalette.accent,
    strokeSubtle: nativePalette.line,
    textPrimary: nativePalette.ink,
    textSecondary: nativePalette.subInk,
  };
}

export const patientSurfacePalette = createPatientSurfacePalette(palette);

export function resolveNativePalette(themeKey?: string | null) {
  return getMobileThemePreset(resolveMobileThemeKey(themeKey)).native;
}

export function resolvePatientSurfacePalette(themeKey?: string | null) {
  return createPatientSurfacePalette(resolveNativePalette(themeKey));
}

export function readActiveMobileThemeKey() {
  return activeThemeKey;
}

export function setActiveMobileThemeKey(themeKey?: string | null) {
  activeThemeKey = resolveMobileThemeKey(themeKey);
  activeNativePalette = resolveNativePalette(activeThemeKey);
}

export function readActiveNativePalette() {
  return activeNativePalette;
}

function normalizeColorValue(value: string) {
  return value.trim().toLowerCase();
}

const defaultColorResolvers = new Map<
  string,
  (nativePalette: typeof palette) => string
>([
  [
    normalizeColorValue(defaultNativePalette.background),
    (nativePalette) => nativePalette.background,
  ],
  [
    normalizeColorValue(defaultNativePalette.card),
    (nativePalette) => nativePalette.card,
  ],
  [
    normalizeColorValue(defaultNativePalette.cardMuted),
    (nativePalette) => nativePalette.cardMuted,
  ],
  [
    normalizeColorValue(defaultNativePalette.field),
    (nativePalette) => nativePalette.field,
  ],
  [
    normalizeColorValue(defaultNativePalette.ink),
    (nativePalette) => nativePalette.ink,
  ],
  [
    normalizeColorValue(defaultNativePalette.subInk),
    (nativePalette) => nativePalette.subInk,
  ],
  [
    normalizeColorValue(defaultNativePalette.accent),
    (nativePalette) => nativePalette.accent,
  ],
  [
    normalizeColorValue(defaultNativePalette.accentSoft),
    (nativePalette) => nativePalette.accentSoft,
  ],
  [
    normalizeColorValue(defaultNativePalette.warm),
    (nativePalette) => nativePalette.warm,
  ],
  [
    normalizeColorValue(defaultNativePalette.line),
    (nativePalette) => nativePalette.line,
  ],
  [
    normalizeColorValue(defaultNativePalette.dot),
    (nativePalette) => nativePalette.dot,
  ],
  [
    normalizeColorValue(defaultNativePalette.successBackground),
    (nativePalette) => nativePalette.successBackground,
  ],
  [
    normalizeColorValue(defaultNativePalette.successText),
    (nativePalette) => nativePalette.successText,
  ],
  [
    normalizeColorValue(defaultNativePalette.errorBackground),
    (nativePalette) => nativePalette.errorBackground,
  ],
  [
    normalizeColorValue(defaultNativePalette.errorText),
    (nativePalette) => nativePalette.errorText,
  ],
]);

let hasInstalledThemeColorPreprocessors = false;

function resolveThemeStyleColor(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const resolver = defaultColorResolvers.get(normalizeColorValue(value));
  const resolvedColor = resolver ? resolver(activeNativePalette) : value;
  return processColor(resolvedColor) ?? value;
}

export function installMobileThemeColorPreprocessors() {
  if (hasInstalledThemeColorPreprocessors) {
    return;
  }

  hasInstalledThemeColorPreprocessors = true;

  for (const property of [
    "backgroundColor",
    "borderColor",
    "borderTopColor",
    "borderRightColor",
    "borderBottomColor",
    "borderLeftColor",
    "color",
    "shadowColor",
    "textDecorationColor",
    "tintColor",
  ]) {
    StyleSheet.setStyleAttributePreprocessor(
      property,
      resolveThemeStyleColor,
    );
  }
}

export function createThemeShadows(
  nativePalette: typeof palette,
  surfacePalette: ReturnType<typeof createPatientSurfacePalette>,
) {
  return {
    card: Platform.select({
      ios: {
        shadowColor: nativePalette.ink,
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
        shadowColor: nativePalette.ink,
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 3,
      },
    }),
    fab: {
      shadowColor: surfacePalette.accentSolid,
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
  } as const;
}

// Re-export design tokens (no circular dependency - tokens.ts has no imports from theme)
export { space, radii, typo } from "./tokens.ts";

// ─── Shadow presets (depend on palette, so defined here) ─
export const shadows = createThemeShadows(palette, patientSurfacePalette);

export type PatientTheme = {
  key: MobileThemeKey;
  palette: typeof palette;
  surface: ReturnType<typeof createPatientSurfacePalette>;
  shadows: ReturnType<typeof createThemeShadows>;
};

installMobileThemeColorPreprocessors();
