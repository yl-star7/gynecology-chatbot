export const NATIVE_HEADER_TINT_COLOR = "#D85C8F";

export const DEFAULT_PUSH_SCREEN_OPTIONS = {
  presentation: "card",
  headerBackTitleVisible: false,
} as const;

export function buildNativeHeaderScreenOptions(title?: string) {
  return {
    ...DEFAULT_PUSH_SCREEN_OPTIONS,
    ...(title ? { title } : {}),
    headerBackVisible: true,
    headerShadowVisible: false,
    headerTintColor: NATIVE_HEADER_TINT_COLOR,
    headerTitle: "",
  } as const;
}
