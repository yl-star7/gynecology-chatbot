// @ts-nocheck
import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useMobileAppSession } from "../../src/core/MobileAppSessionProvider";
import { PATIENT_TABS } from "../../src/components/patient/PatientTabBar.model";
import { palette, patientSurfacePalette as surface } from "../../src/theme";
import { buildTabsScreenOptions } from "../routeOptions.model";

const TABS_SCREEN_OPTIONS = buildTabsScreenOptions({
  accent: palette.accent,
  subInk: surface.textSecondary,
  card: surface.surfacePrimary,
  line: surface.strokeSubtle,
});

export default function TabsLayout() {
  const { currentUser } = useMobileAppSession();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.replace("/auth/login");
    } else if (!currentUser.hasCompletedOnboarding) {
      router.replace("/onboarding");
    }
  }, [currentUser, router]);

  if (!currentUser) return null;

  return (
    <Tabs screenOptions={TABS_SCREEN_OPTIONS}>
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
