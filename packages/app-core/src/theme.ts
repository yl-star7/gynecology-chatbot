export type MobileThemeKey = "rose-sand" | "soft-peach" | "mint-neutral";

export interface MobileThemePreset {
  key: MobileThemeKey;
  label: string;
  description: string;
  web: {
    bg: string;
    panel: string;
    panelStrong: string;
    panelMuted: string;
    field: string;
    text: string;
    textSoft: string;
    line: string;
    accent: string;
    accentDark: string;
    accentSoft: string;
    success: string;
    successSoft: string;
    successText: string;
    warning: string;
    errorSoft: string;
    errorText: string;
    shadow: string;
  };
  native: {
    background: string;
    card: string;
    cardMuted: string;
    field: string;
    ink: string;
    subInk: string;
    accent: string;
    accentSoft: string;
    warm: string;
    line: string;
    dot: string;
    successBackground: string;
    successText: string;
    errorBackground: string;
    errorText: string;
  };
}

export const MOBILE_THEME_PRESETS: Record<MobileThemeKey, MobileThemePreset> = {
  "rose-sand": {
    key: "rose-sand",
    label: "Cherry Blossom",
    description: "벚꽃 잎과 라이트 샌드 계열의 기본 테마",
    web: {
      bg: "#fffafc",
      panel: "rgba(255, 253, 254, 0.9)",
      panelStrong: "#ffffff",
      panelMuted: "#fcf4f7",
      field: "#ffffff",
      text: "#34262d",
      textSoft: "#7f6974",
      line: "rgba(140, 106, 122, 0.12)",
      accent: "#d48ea5",
      accentDark: "#b67087",
      accentSoft: "#faebf1",
      success: "#5b7d6a",
      successSoft: "#eef6f1",
      successText: "#4b6b5a",
      warning: "#a46d3e",
      errorSoft: "#fbf0f4",
      errorText: "#95687a",
      shadow: "0 22px 60px rgba(139, 111, 125, 0.14)",
    },
    native: {
      background: "#fffafc",
      card: "#ffffff",
      cardMuted: "#fcf4f7",
      field: "#ffffff",
      ink: "#34262d",
      subInk: "#7f6974",
      accent: "#d48ea5",
      accentSoft: "#faebf1",
      warm: "#f6e3ea",
      line: "#eadce3",
      dot: "#d8a1b5",
      successBackground: "#eef6f1",
      successText: "#4b6b5a",
      errorBackground: "#fbf0f4",
      errorText: "#95687a",
    },
  },
  "soft-peach": {
    key: "soft-peach",
    label: "Soft Peach",
    description: "피치와 코랄이 섞인 따뜻한 테마",
    web: {
      bg: "#fff4ec",
      panel: "rgba(255, 250, 245, 0.84)",
      panelStrong: "#fffaf5",
      panelMuted: "#fff1e6",
      field: "#ffffff",
      text: "#3a241f",
      textSoft: "#86645c",
      line: "rgba(164, 111, 88, 0.16)",
      accent: "#e08263",
      accentDark: "#c5674b",
      accentSoft: "#ffe1d1",
      success: "#537a60",
      successSoft: "#eef6ef",
      successText: "#537a60",
      warning: "#b07a34",
      errorSoft: "#fff3ee",
      errorText: "#9a503d",
      shadow: "0 22px 60px rgba(189, 118, 86, 0.16)",
    },
    native: {
      background: "#fff4ec",
      card: "#fffaf5",
      cardMuted: "#fff1e6",
      field: "#ffffff",
      ink: "#3a241f",
      subInk: "#86645c",
      accent: "#e08263",
      accentSoft: "#ffe1d1",
      warm: "#ffd8bf",
      line: "#f1d5c5",
      dot: "#ef9b6f",
      successBackground: "#eef6ef",
      successText: "#537a60",
      errorBackground: "#fff3ee",
      errorText: "#9a503d",
    },
  },
  "mint-neutral": {
    key: "mint-neutral",
    label: "Mint Neutral",
    description: "뉴트럴 그린과 민트 그라데이션 기반 테마",
    web: {
      bg: "#edf4ef",
      panel: "rgba(249, 252, 250, 0.82)",
      panelStrong: "#fbfdfb",
      panelMuted: "#f1f7f3",
      field: "#ffffff",
      text: "#18302b",
      textSoft: "#5e7870",
      line: "rgba(50, 88, 78, 0.14)",
      accent: "#4d8776",
      accentDark: "#39695c",
      accentSoft: "#dcefe8",
      success: "#3f775f",
      successSoft: "#ecf7f1",
      successText: "#3f775f",
      warning: "#8a7a43",
      errorSoft: "#f7f0ed",
      errorText: "#7c5b54",
      shadow: "0 22px 60px rgba(59, 101, 89, 0.13)",
    },
    native: {
      background: "#edf4ef",
      card: "#fbfdfb",
      cardMuted: "#f1f7f3",
      field: "#ffffff",
      ink: "#18302b",
      subInk: "#5e7870",
      accent: "#4d8776",
      accentSoft: "#dcefe8",
      warm: "#d8ebe2",
      line: "#d7e7df",
      dot: "#76a892",
      successBackground: "#ecf7f1",
      successText: "#3f775f",
      errorBackground: "#f7f0ed",
      errorText: "#7c5b54",
    },
  },
};

export const MOBILE_THEME_OPTIONS = Object.values(MOBILE_THEME_PRESETS);

export const DEFAULT_MOBILE_THEME_KEY: MobileThemeKey = "rose-sand";

export function resolveMobileThemeKey(value?: string | null): MobileThemeKey {
  return value && value in MOBILE_THEME_PRESETS
    ? (value as MobileThemeKey)
    : DEFAULT_MOBILE_THEME_KEY;
}

export function getMobileThemePreset(value?: string | null) {
  return MOBILE_THEME_PRESETS[resolveMobileThemeKey(value)];
}
