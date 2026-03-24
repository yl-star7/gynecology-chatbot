// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Pressable } from "../ui";
import { palette, patientSurfacePalette as surface, radii, shadows, space, typo } from "../../theme";

const TABS = [
  { key: "home", label: "홈", icon: "home-outline", href: "/home" },
  { key: "today", label: "오늘,우리", icon: "chatbubble-ellipses-outline", href: "/chat/new" },
  { key: "profile", label: "마이페이지", icon: "person-outline", href: "/profile" },
];

export function PatientTabBar({ activeTab }: { activeTab: "home" | "today" | "profile" }) {
  return (
    <View style={[styles.container, shadows.header]}>
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;

        return (
          <Pressable
            key={tab.key}
            style={[styles.item, isActive ? styles.itemActive : null]}
            onPress={() => router.replace(tab.href)}
            accessibilityLabel={`${tab.label} 화면 열기`}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={isActive ? palette.accent : surface.textSecondary}
            />
            <Text style={[styles.label, isActive ? styles.labelActive : null]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: space.xl,
    right: space.xl,
    bottom: space.xxl,
    flexDirection: "row",
    borderRadius: radii.full,
    backgroundColor: surface.surfacePrimary,
    padding: space.sm,
    gap: space.sm,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
    paddingVertical: space.md,
    gap: space.xs,
  },
  itemActive: {
    backgroundColor: surface.surfaceAccent,
  },
  label: {
    ...typo.caption,
    color: surface.textSecondary,
  },
  labelActive: {
    color: palette.accent,
    fontWeight: "700",
  },
});
