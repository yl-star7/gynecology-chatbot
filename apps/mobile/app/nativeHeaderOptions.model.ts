export const DEFAULT_PUSH_SCREEN_OPTIONS = {
  presentation: "card",
  headerBackTitleVisible: false,
} as const;

export function buildNativeHeaderScreenOptions(title: string) {
  return {
    ...DEFAULT_PUSH_SCREEN_OPTIONS,
    title,
  } as const;
}
