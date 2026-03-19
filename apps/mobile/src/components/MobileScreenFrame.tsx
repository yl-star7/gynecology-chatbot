// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMobileAppSession } from "../core/MobileAppSessionProvider";
import { palette, patientSurfacePalette as surface } from "../theme";

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
      <View style={styles.header}>
        <View style={styles.leading}>
          {backHref ? (
            <Pressable
              onPress={() => router.replace(backHref)}
              accessibilityLabel="뒤로 이동"
              style={styles.iconButton}
            >
              <Ionicons name="arrow-back" size={20} color={palette.ink} />
            </Pressable>
          ) : null}
          <Text style={styles.title}>{title}</Text>
        </View>

        {showProfileButton ? (
          <Pressable
            onPress={() => router.push("/profile")}
            accessibilityLabel="프로필 열기"
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
          style={styles.fab}
          onPress={() => router.push("/chat/new")}
          accessibilityLabel="새 상담 시작"
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={22}
            color="#ffffff"
          />
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: surface.strokeSubtle,
  },
  leading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: surface.surfacePrimary,
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: palette.ink,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: surface.surfaceSecondary,
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
  },
  profileButtonLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: palette.ink,
  },
  trailingSpacer: {
    width: 40,
    height: 40,
  },
  body: {
    flex: 1,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 28,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: surface.accentSolid,
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
});
