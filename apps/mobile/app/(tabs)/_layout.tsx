// @ts-nocheck
import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMobileAppSession } from "../../src/core/MobileAppSessionProvider";
import { PATIENT_TABS } from "../../src/components/patient/PatientTabBar.model";
import { useMobileTheme } from "../../src/theme-provider";
import { usePatientBottomInset } from "../../src/screens/patient/usePatientBottomInset";
import {
  PATIENT_TAB_BAR_BODY_HEIGHT,
  buildTabBarSafeAreaStyle,
  buildTabsScreenOptions,
} from "../routeOptions.model";

export default function TabsLayout() {
  const { currentUser, isRestoringSession } = useMobileAppSession();
  const { palette, surface } = useMobileTheme();
  const router = useRouter();
  const bottomInset = usePatientBottomInset();
  const tabsScreenOptions = buildTabsScreenOptions({
    accent: palette.accent,
    subInk: surface.textSecondary,
    card: surface.pageBackground,
    line: surface.strokeSubtle,
    platformOS: Platform.OS,
  });
  const tabBarSafeAreaStyle = buildTabBarSafeAreaStyle({
    bottomInset,
  });
  const mergedScreenOptions = {
    ...tabsScreenOptions,
    tabBarStyle: {
      ...tabsScreenOptions.tabBarStyle,
      ...tabBarSafeAreaStyle,
      paddingTop: 0,
      alignItems: "center",
      justifyContent: "flex-start",
    },
    tabBarItemStyle: {
      ...tabsScreenOptions.tabBarItemStyle,
      height: PATIENT_TAB_BAR_BODY_HEIGHT,
      paddingVertical: 0,
      paddingTop: 0,
      justifyContent: "center",
      transform: tabsScreenOptions.tabBarItemStyle.transform,
    },
    tabBarIconStyle: { ...tabsScreenOptions.tabBarIconStyle, marginTop: 0 },
    tabBarLabelStyle: {
      ...tabsScreenOptions.tabBarLabelStyle,
      marginTop: 0,
      marginBottom: 0,
    },
  };

  useEffect(() => {
    if (isRestoringSession) {
      return;
    }

    if (!currentUser) {
      router.replace("/auth/login");
    } else if (currentUser.accountStatus === "pending_approval") {
      router.replace("/approval-pending");
    } else if (!currentUser.hasCompletedOnboarding) {
      router.replace("/onboarding");
    }
  }, [currentUser, isRestoringSession, router]);

  if (
    isRestoringSession ||
    !currentUser ||
    currentUser.accountStatus === "pending_approval"
  ) {
    return null;
  }

  return (
    <Tabs screenOptions={mergedScreenOptions}>
      {PATIENT_TABS.map((tab) => (
        <Tabs.Screen
          key={tab.key}
          name={tab.routeName}
          options={{
            title: tab.label,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={tab.icon} color={color} size={size} />
            ),
          }}
        />
      ))}
      <Tabs.Screen name="knowledge" options={{ href: null }} />
      <Tabs.Screen name="notebook" options={{ href: null }} />
    </Tabs>
  );
}
