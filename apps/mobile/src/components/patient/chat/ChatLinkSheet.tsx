// @ts-nocheck
import { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { LinkTargetContent } from "@gynecology-chatbot/app-core";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  space,
  typo,
} from "../../../theme";

const SHEET_HEIGHT = Math.round(Dimensions.get("window").height * 0.55);

export function ChatLinkSheet({
  visible,
  target,
  entityId,
  getLinkTarget,
  onClose,
  onOpenFullView,
}: {
  visible: boolean;
  target: string | null;
  entityId?: string | null;
  getLinkTarget: (
    target: string,
    entityId?: string,
  ) => Promise<LinkTargetContent>;
  onClose: () => void;
  onOpenFullView?: (target: string, entityId?: string) => void;
}) {
  const [content, setContent] = useState<LinkTargetContent | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const translateY = useState(new Animated.Value(SHEET_HEIGHT))[0];

  useEffect(() => {
    if (!visible || !target) {
      setContent(null);
      setErrorText(null);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setErrorText(null);
    getLinkTarget(target, entityId ?? undefined)
      .then((next) => {
        if (cancelled) return;
        setContent(next);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setErrorText(
          error instanceof Error ? error.message : "내용을 불러오지 못했어요.",
        );
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, target, entityId, getLinkTarget]);

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : SHEET_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, translateY]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          accessibilityLabel="닫기"
          onPress={onClose}
        />
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY }] }]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.eyebrow} numberOfLines={1}>
              {content?.section ?? "연결된 정보"}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityLabel="닫기"
            >
              <Ionicons name="close" size={22} color={surface.textSecondary} />
            </Pressable>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {content?.title ??
              (isLoading ? "불러오는 중이에요" : "연결된 내용")}
          </Text>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.body}>
              {errorText ??
                content?.body ??
                (isLoading
                  ? "잠시만 기다려주세요."
                  : "연결된 내용을 준비 중이에요.")}
            </Text>
          </ScrollView>
          {target && onOpenFullView ? (
            <Pressable
              style={styles.ctaButton}
              onPress={() => {
                onClose();
                onOpenFullView(target, entityId ?? undefined);
              }}
              accessibilityRole="button"
              accessibilityLabel="전체 내용 보기"
            >
              <Text style={styles.ctaLabel}>
                {content?.ctaLabel ?? "전체 내용 보기"}
              </Text>
            </Pressable>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.32)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: surface.surfacePrimary,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.lg,
    gap: space.sm,
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: surface.surfaceAccent,
    marginBottom: space.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.sm,
  },
  eyebrow: {
    ...typo.caption,
    color: palette.accent,
    fontWeight: "700",
    flex: 1,
  },
  title: {
    ...typo.titleMd,
    color: surface.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: space.md,
  },
  body: {
    ...typo.body,
    color: surface.textSecondary,
    lineHeight: 22,
  },
  ctaButton: {
    borderRadius: radii.full,
    backgroundColor: palette.accent,
    paddingVertical: space.sm,
    alignItems: "center",
  },
  ctaLabel: {
    ...typo.button,
    color: surface.surfacePrimary,
    fontWeight: "700",
  },
});
