// @ts-nocheck
import type { ReactNode } from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, Text, View } from "react-native";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { Pressable } from "../ui";
import { palette, patientSurfacePalette as surface, radii, space, typo } from "../../theme";
import { PatientTabBar } from "./PatientTabBar";

export function PatientShell({
  children,
  activeTab,
  showProfileButton = true,
  pageTone = "plain",
}: {
  children: ReactNode;
  activeTab: "home" | "today" | "profile";
  title?: string;
  backHref?: string;
  showProfileButton?: boolean;
  pageTone?: "main" | "plain";
}) {
  const { currentUser } = useMobileAppSession();
  const avatarLabel = currentUser?.displayName?.slice(0, 1) ?? "나";
  const useMainTone = pageTone === "main";

  return (
    <SafeAreaView style={[styles.safeArea, useMainTone ? styles.safeAreaMain : styles.safeAreaPlain]}>
      <View style={[styles.header, useMainTone ? styles.headerMain : styles.headerPlain]}>
        <View style={styles.headerSpacer} />
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
  },
  safeAreaMain: {
    backgroundColor: surface.pageBackground,
  },
  safeAreaPlain: {
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.xl,
    paddingTop: space.sm,
    paddingBottom: space.md,
  },
  headerMain: {
    backgroundColor: surface.pageBackground,
  },
  headerPlain: {
    backgroundColor: surface.pageBackground,
  },
  headerSpacer: {
    flex: 1,
  },
  iconButtonPlaceholder: {
    width: 38,
    height: 38,
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
