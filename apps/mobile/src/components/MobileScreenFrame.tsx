// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Pressable } from "./ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMobileAppSession } from "../core/MobileAppSessionProvider";
import { palette, patientSurfacePalette as surface, radii, shadows, space, typo } from "../theme";

export function MobileScreenFrame({
  title,
  children,
  backHref,
  showProfileButton = false,
  showChatFab = false,
}: {
  title: string;
  children: ReactNode;
  backHref?: string;
  showProfileButton?: boolean;
  showChatFab?: boolean;
}) {
  const { currentUser } = useMobileAppSession();
  const avatarLabel = currentUser?.displayName?.slice(0, 1) ?? "나";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, shadows.header]}>
        <View style={styles.leading}>
          {backHref ? (
            <Pressable
              onPress={() => router.replace(backHref)}
              accessibilityLabel="뒤로 이동"
              style={styles.iconButton}
            >
              <Ionicons name="chevron-back" size={22} color={palette.ink} />
            </Pressable>
          ) : null}
          <Text style={styles.title}>{title}</Text>
        </View>

        {showProfileButton ? (
          <Pressable
            onPress={() => router.push("/profile")}
            accessibilityLabel="설정 열기"
            style={styles.profileButton}
          >
            <Text style={styles.profileButtonLabel}>{avatarLabel}</Text>
          </Pressable>
        ) : (
          <View style={styles.trailingSpacer} />
        )}
      </View>

      <View style={styles.body}>{children}</View>

      {showChatFab ? (
        <Pressable
          style={[styles.fab, shadows.fab]}
          onPress={() => router.push("/chat/new")}
          accessibilityLabel="상담하기"
        >
          <Ionicons name="chatbubble-ellipses" size={24} color="#ffffff" />
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: surface.pageBackground,
  },
  header: {
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: surface.pageBackground,
  },
  leading: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typo.titleSm,
    color: palette.ink,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: surface.surfaceAccent,
  },
  profileButtonLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.accent,
  },
  trailingSpacer: {
    width: 36,
    height: 36,
  },
  body: {
    flex: 1,
  },
  fab: {
    position: "absolute",
    right: space.xl,
    bottom: space.xxxl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: surface.accentSolid,
  },
});
