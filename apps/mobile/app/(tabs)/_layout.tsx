// @ts-nocheck
import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useMobileAppSession } from "../../src/core/MobileAppSessionProvider";
import { PATIENT_TABS } from "../../src/components/patient/PatientTabBar.model";
import { useMobileTheme } from "../../src/theme-provider";
import { buildTabsScreenOptions } from "../routeOptions.model";

export default function TabsLayout() {
  const { currentUser, isRestoringSession } = useMobileAppSession();
  const { palette, surface } = useMobileTheme();
  const router = useRouter();
  const tabsScreenOptions = buildTabsScreenOptions({
    accent: palette.accent,
    subInk: surface.textSecondary,
    card: surface.pageBackground,
    line: surface.strokeSubtle,
  });

  useEffect(() => {
    if (isRestoringSession) {
      return;
    }

    if (!currentUser) {
      router.replace("/auth/login");
    } else if (!currentUser.hasCompletedOnboarding) {
      router.replace("/onboarding");
    }
  }, [currentUser, isRestoringSession, router]);

  if (isRestoringSession || !currentUser) return null;

  return (
    <Tabs screenOptions={tabsScreenOptions}>
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
