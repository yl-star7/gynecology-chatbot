// @ts-nocheck
import type { ReactNode } from "react";
import { useRouter } from "expo-router";
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
import { resolvePatientShellHeaderLayout } from "./PatientShell.model";
import type { PatientTabKey } from "./PatientTabBar.model";

export function PatientShell({
  children,
  activeTab: _activeTab,
  title,
  showProfileButton = true,
  pageTone = "plain",
  headerCompact = false,
  backHref,
  hideHeader = false,
  skipTopSafeArea = false,
}: {
  children: ReactNode;
  // 탭 활성화는 Expo Router Tabs가 담당하며, 기존 화면 호환을 위해 prop 시그니처만 유지합니다.
  activeTab?: PatientTabKey;
  title?: string;
  backHref?: string;
  showProfileButton?: boolean;
  pageTone?: "main" | "plain";
  headerCompact?: boolean;
  hideHeader?: boolean;
  skipTopSafeArea?: boolean;
}) {
  const router = useRouter();
  const { currentUser } = useMobileAppSession();
  const avatarLabel = currentUser?.displayName?.slice(0, 1) ?? "나";
  const useMainTone = pageTone === "main";
  const headerLayout = resolvePatientShellHeaderLayout({
    hasBackButton: Boolean(backHref),
    showProfileButton,
  });

  return (
    <SafeAreaView
      edges={skipTopSafeArea ? ["bottom", "left", "right"] : undefined}
      style={[
        styles.safeArea,
        useMainTone ? styles.safeAreaMain : styles.safeAreaPlain,
      ]}
    >
      {hideHeader ? null : (
        <View
          style={[
            styles.header,
            useMainTone ? styles.headerMain : styles.headerPlain,
            headerLayout.usesCompactTopInset
              ? styles.headerWithBackButton
              : null,
            headerCompact ? styles.headerCompact : null,
            headerLayout.compactTrailingSpace
              ? styles.headerWithoutRightSlot
              : null,
          ]}
        >
          <View style={styles.headerLeading}>
            {headerLayout.leftSlot === "back" ? (
              <Pressable
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                    return;
                  }
                  router.replace(backHref!);
                }}
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
            ) : null}
            {title ? <Text style={styles.headerTitle}>{title}</Text> : null}
          </View>
          {headerLayout.rightSlot === "profile" ? (
            <Pressable
              onPress={() => router.navigate("/(tabs)/profile")}
              accessibilityLabel="마이페이지 열기"
              style={styles.profileButton}
            >
              <Text style={styles.profileButtonLabel}>{avatarLabel}</Text>
            </Pressable>
          ) : (
            <View style={styles.trailingSpacer} />
          )}
        </View>
      )}
      <View style={styles.body}>{children}</View>
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
    paddingTop: space.xl,
    paddingBottom: space.md,
  },
  headerMain: {
    backgroundColor: surface.pageBackground,
  },
  headerPlain: {
    backgroundColor: surface.pageBackground,
  },
  headerCompact: {
    paddingTop: space.xs,
    paddingBottom: 0,
  },
  headerWithBackButton: {
    paddingTop: space.xl + space.xs,
  },
  headerLeading: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  headerTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
    flexShrink: 1,
  },
  trailingSpacer: {
    width: space.xxxl + space.sm,
    height: space.xxxl + space.sm,
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
