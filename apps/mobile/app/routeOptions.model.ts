import { space } from "../src/tokens.ts";
import {
  PATIENT_TAB_BAR_BODY_HEIGHT,
  PATIENT_TAB_BAR_CONTENT_OFFSET_Y,
  buildPatientTabBarHeight,
} from "../src/screens/patient/patientScreenLayout.model.ts";

export {
  PATIENT_TAB_BAR_BODY_HEIGHT,
  PATIENT_TAB_BAR_CONTENT_OFFSET_Y,
};

export const HIDDEN_HEADER_SCREEN_OPTIONS = {
  headerShown: false,
} as const;

export const ROOT_STACK_ROUTE_NAMES = [
  "index",
  "auth/login",
  "onboarding/index",
  "approval-pending",
  "(tabs)",
  "ask",
  "chat",
  "encyclopedia",
  "lexicon",
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
  platformOS?: string;
}) {
  const tabBarContentOffsetY =
    colors.platformOS === "android" ? 0 : PATIENT_TAB_BAR_CONTENT_OFFSET_Y;

  return {
    ...HIDDEN_HEADER_SCREEN_OPTIONS,
    tabBarActiveTintColor: colors.accent,
    tabBarInactiveTintColor: colors.subInk,
    tabBarStyle: {
      backgroundColor: colors.card,
      borderTopWidth: 0,
      borderTopColor: "transparent",
      height: PATIENT_TAB_BAR_BODY_HEIGHT,
      paddingTop: 0,
      paddingBottom: space.xs,
      elevation: 0,
      shadowOpacity: 0,
      shadowColor: "transparent",
    },
    tabBarItemStyle: {
      height: PATIENT_TAB_BAR_BODY_HEIGHT,
      paddingVertical: 0,
      justifyContent: "center",
      transform: [{ translateY: tabBarContentOffsetY }],
    },
    tabBarIconStyle: {
      marginTop: 0,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: "600",
      marginTop: 0,
      marginBottom: 0,
    },
  } as const;
}

export function buildTabBarSafeAreaStyle({
  bottomInset,
  minimumBottomPadding = space.xs,
}: {
  bottomInset: number;
  minimumBottomPadding?: number;
}) {
  const paddingBottom = Math.max(bottomInset, minimumBottomPadding);

  return {
    height: buildPatientTabBarHeight({ bottomInset, minimumBottomPadding }),
    paddingBottom,
  } as const;
}
