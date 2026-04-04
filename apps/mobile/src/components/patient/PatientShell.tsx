// @ts-nocheck
import type { ReactNode } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, Text, View } from "react-native";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { Pressable } from "../ui";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  space,
  typo,
} from "../../theme";
import { PatientTabBar } from "./PatientTabBar";
import { resolvePatientShellHeaderLayout } from "./PatientShell.model";

export function PatientShell({
  children,
  activeTab,
  showProfileButton = true,
  pageTone = "plain",
  headerCompact = false,
  rightActionIcon,
  rightActionLabel,
  onRightActionPress,
  backHref,
}: {
  children: ReactNode;
  activeTab: "home" | "today" | "profile";
  title?: string;
  backHref?: string;
  showProfileButton?: boolean;
  pageTone?: "main" | "plain";
  headerCompact?: boolean;
  rightActionIcon?: keyof typeof Ionicons.glyphMap;
  rightActionLabel?: string;
  onRightActionPress?: () => void;
}) {
  const { currentUser } = useMobileAppSession();
  const avatarLabel = currentUser?.displayName?.slice(0, 1) ?? "나";
  const useMainTone = pageTone === "main";
  const headerLayout = resolvePatientShellHeaderLayout({
    hasBackButton: Boolean(backHref),
    showProfileButton,
    hasRightAction: Boolean(rightActionIcon && onRightActionPress),
  });

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        useMainTone ? styles.safeAreaMain : styles.safeAreaPlain,
      ]}
    >
      <View
        style={[
          styles.header,
          useMainTone ? styles.headerMain : styles.headerPlain,
          headerCompact ? styles.headerCompact : null,
          headerLayout.usesCompactTopInset ? styles.headerWithBackButton : null,
          headerLayout.compactTrailingSpace ? styles.headerWithoutRightSlot : null,
        ]}
      >
        {headerLayout.leftSlot === "back" ? (
          <Pressable
            onPress={() => router.replace(backHref!)}
            accessibilityLabel="뒤로가기"
            style={styles.iconButton}
            hitSlop={12}
          >
            <Ionicons
              name="chevron-back"
              size={space.lg + space.sm}
              color={surface.textPrimary}
            />
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
        {headerLayout.rightSlot === "profile" ? (
          <Pressable
            onPress={() => router.replace("/profile")}
            accessibilityLabel="마이페이지 열기"
            style={styles.profileButton}
          >
            <Text style={styles.profileButtonLabel}>{avatarLabel}</Text>
          </Pressable>
        ) : headerLayout.rightSlot === "action" ? (
          <Pressable
            onPress={onRightActionPress}
            accessibilityLabel={rightActionLabel ?? "추가 동작"}
            style={styles.iconButton}
            hitSlop={12}
          >
            <Ionicons
              name={rightActionIcon!}
              size={space.lg + space.sm}
              color={surface.textPrimary}
            />
          </Pressable>
        ) : null}
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
    backgroundColor: surface.surfacePrimary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.md,
  },
  headerMain: {
    backgroundColor: surface.pageBackground,
  },
  headerPlain: {
    backgroundColor: surface.pageBackground,
  },
  headerCompact: {
    paddingTop: space.sm,
    paddingBottom: space.xs,
  },
  headerWithBackButton: {
    paddingTop: space.md,
  },
  headerSpacer: {
    flex: 1,
  },
  headerWithoutRightSlot: {
    paddingBottom: 0,
  },
  profileButton: {
    width: space.xxxl + space.sm,
    height: space.xxxl + space.sm,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: surface.surfaceAccent,
  },
  iconButton: {
    width: space.xxxl + space.md,
    height: space.xxxl + space.md,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: surface.surfaceSecondary,
  },
  profileButtonLabel: {
    ...typo.label,
    color: palette.accent,
  },
  body: {
    flex: 1,
  },
});
