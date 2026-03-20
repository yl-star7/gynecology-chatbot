// ─── Spacing scale ───────────────────────────────────────
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// ─── Border radius scale ─────────────────────────────────
export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 20,
  xxl: 24,
  full: 999,
} as const;

// ─── Typography presets ──────────────────────────────────
export const typo = {
  eyebrow: {
    fontSize: 13,
    fontWeight: "600" as const,
    letterSpacing: 0.3,
  },
  titleLg: {
    fontSize: 28,
    fontWeight: "700" as const,
    lineHeight: 38,
  },
  titleMd: {
    fontSize: 26,
    fontWeight: "700" as const,
    lineHeight: 36,
  },
  titleSm: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  button: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
} as const;
