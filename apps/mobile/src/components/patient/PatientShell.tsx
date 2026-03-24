// @ts-nocheck
import type { ReactNode } from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { Pressable } from "../ui";
import { palette, patientSurfacePalette as surface, radii, shadows, space, typo } from "../../theme";
import { PatientTabBar } from "./PatientTabBar";

export function PatientShell({
  children,
  activeTab,
  title,
  backHref,
  showProfileButton = true,
}: {
  children: ReactNode;
  activeTab: "home" | "today" | "profile";
  title?: string;
  backHref?: string;
  showProfileButton?: boolean;
}) {
  const { currentUser } = useMobileAppSession();
  const avatarLabel = currentUser?.displayName?.slice(0, 1) ?? "나";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, shadows.header]}>
        <View style={styles.headerLeading}>
          {backHref ? (
            <Pressable
              onPress={() => router.replace(backHref)}
              accessibilityLabel="뒤로 이동"
              style={styles.iconButton}
            >
              <Ionicons name="chevron-back" size={20} color={surface.textPrimary} />
            </Pressable>
          ) : (
            <View style={styles.iconButtonPlaceholder} />
          )}
          <Text style={styles.headerTitle}>{title ?? ""}</Text>
        </View>
        {showProfileButton ? (
          <Pressable
            onPress={() => router.replace("/profile")}
            accessibilityLabel="마이페이지 열기"
            style={styles.profileButton}
          >
            <Text style={styles.profileButtonLabel}>{avatarLabel}</Text>
          </Pressable>
        ) : (
          <View style={styles.iconButtonPlaceholder} />
        )}
      </View>
      <View style={styles.body}>{children}</View>
      <PatientTabBar activeTab={activeTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: surface.pageBackground,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    backgroundColor: surface.pageBackground,
  },
  headerLeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    flex: 1,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: surface.surfacePrimary,
  },
  iconButtonPlaceholder: {
    width: 36,
    height: 36,
  },
  headerTitle: {
    ...typo.label,
    color: surface.textSecondary,
  },
  profileButton: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: surface.surfaceAccent,
  },
  profileButtonLabel: {
    ...typo.label,
    color: palette.accent,
  },
  body: {
    flex: 1,
  },
});
