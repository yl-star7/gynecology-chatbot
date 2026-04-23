import { Platform } from "react-native";
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
  "encyclopedia",
  "dev",
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
      borderTopWidth: 0,
      borderTopColor: "transparent",
      height:
        Platform.OS === "android"
          ? space.xxxl + space.xxxl + space.lg
          : space.xxxl + space.xxxl,
      paddingTop: space.xs,
      paddingBottom: Platform.OS === "android" ? space.xxxl : space.xl,
      elevation: 0,
      shadowOpacity: 0,
      shadowColor: "transparent",
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: "600",
    },
  } as const;
}
