// @ts-nocheck
import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useMobileAppSession } from "../../src/core/MobileAppSessionProvider";
import { palette, patientSurfacePalette as surface, space } from "../../src/theme";

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
      <Tabs.Screen
        name="home"
        options={{
          title: "홈",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="today"
        options={{
          title: "오늘,우리",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "마이페이지",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen name="knowledge" options={{ href: null }} />
      <Tabs.Screen name="notebook" options={{ href: null }} />
    </Tabs>
  );
}
