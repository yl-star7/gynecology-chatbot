import { space } from "../src/tokens.ts";

export const HIDDEN_HEADER_SCREEN_OPTIONS = {
  headerShown: false,
} as const;

export const ROOT_STACK_ROUTE_NAMES = [
  "index",
  "auth/login",
  "onboarding/index",
  "(tabs)",
  "chat",
  "records",
  "profile-settings",
  "profile-survey",
] as const;

export function buildTabsScreenOptions(colors: {
  accent: string;
  subInk: string;
  card: string;
  line: string;
}) {
  return {
    ...HIDDEN_HEADER_SCREEN_OPTIONS,
    tabBarActiveTintColor: colors.accent,
    tabBarInactiveTintColor: colors.subInk,
    tabBarStyle: {
      backgroundColor: colors.card,
      borderTopColor: colors.line,
      height: space.xxxl * 2 + space.md,
      paddingTop: space.xs,
      paddingBottom: space.lg,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: "600",
    },
  } as const;
}
