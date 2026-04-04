// @ts-nocheck
import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useMobileAppSession } from "../../src/core/MobileAppSessionProvider";
import { palette, patientSurfacePalette as surface, space } from "../../src/theme";
import { PATIENT_TABS } from "../../src/components/patient/PatientTabBar.model";

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
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: surface.textSecondary,
        tabBarStyle: {
          backgroundColor: surface.surfacePrimary,
          borderTopColor: surface.strokeSubtle,
          height: space.xxxl * 2 + space.md,
          paddingTop: space.xs,
          paddingBottom: space.lg,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
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
