// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Pressable } from "./ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMobileAppSession } from "../core/MobileAppSessionProvider";
import { palette, patientSurfacePalette as surface, shadows, space, typo } from "../theme";
import { resolveBackNavigation } from "./MobileScreenFrame.model";

const FAB_NURSE_SOURCE = require("../../assets/branding/penguin-nurse/neutral.png");

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
  const router = useRouter();
  const { currentUser } = useMobileAppSession();
  const avatarLabel = currentUser?.displayName?.slice(0, 1) ?? "나";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, shadows.header]}>
        <View style={styles.leading}>
          {backHref ? (
            <Pressable
              onPress={() => {
                const navigation = resolveBackNavigation(router.canGoBack(), backHref);
                if (navigation.method === "back") {
                  router.back();
                  return;
                }
                router.replace(navigation.href);
              }}
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
            onPress={() => router.push("/(tabs)/profile")}
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
          <Image
            source={FAB_NURSE_SOURCE}
            style={styles.fabImage}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
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
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    overflow: "visible",
  },
  fabImage: {
    width: 64,
    height: 64,
  },
});
