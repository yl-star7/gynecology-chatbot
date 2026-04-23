// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
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
import { useMobileTheme } from "../../../theme-provider";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const EXPANDED_HEIGHT = Math.round(SCREEN_HEIGHT * 0.9);
const COLLAPSED_HEIGHT = Math.round(SCREEN_HEIGHT * 0.55);
const COLLAPSED_OFFSET = EXPANDED_HEIGHT - COLLAPSED_HEIGHT;
const CLOSE_OFFSET = EXPANDED_HEIGHT;
const DISMISS_VELOCITY = 0.6;
const SNAP_ANIMATION_MS = 220;

type SnapState = "expanded" | "collapsed";

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
  const { surface: activeSurface } = useMobileTheme();
  const [content, setContent] = useState<LinkTargetContent | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const translateY = useRef(new Animated.Value(CLOSE_OFFSET)).current;
  const snapRef = useRef<SnapState>("collapsed");
  const dragStartRef = useRef(COLLAPSED_OFFSET);

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
    if (visible) {
      snapRef.current = "collapsed";
      Animated.timing(translateY, {
        toValue: COLLAPSED_OFFSET,
        duration: SNAP_ANIMATION_MS,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: CLOSE_OFFSET,
        duration: SNAP_ANIMATION_MS,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  const snapTo = (next: SnapState | "closed") => {
    if (next === "closed") {
      Animated.timing(translateY, {
        toValue: CLOSE_OFFSET,
        duration: SNAP_ANIMATION_MS,
        useNativeDriver: true,
      }).start(() => {
        onClose();
      });
      return;
    }
    const toValue = next === "expanded" ? 0 : COLLAPSED_OFFSET;
    snapRef.current = next;
    Animated.timing(translateY, {
      toValue,
      duration: SNAP_ANIMATION_MS,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gestureState) =>
        Math.abs(gestureState.dy) > 6,
      onPanResponderGrant: () => {
        dragStartRef.current =
          snapRef.current === "expanded" ? 0 : COLLAPSED_OFFSET;
        translateY.stopAnimation();
      },
      onPanResponderMove: (_evt, gestureState) => {
        const next = dragStartRef.current + gestureState.dy;
        const clamped = Math.max(0, Math.min(CLOSE_OFFSET, next));
        translateY.setValue(clamped);
      },
      onPanResponderRelease: (_evt, gestureState) => {
        const current = dragStartRef.current + gestureState.dy;
        if (
          gestureState.vy > DISMISS_VELOCITY ||
          current > COLLAPSED_OFFSET + COLLAPSED_HEIGHT / 3
        ) {
          snapTo("closed");
          return;
        }
        if (gestureState.vy < -DISMISS_VELOCITY) {
          snapTo("expanded");
          return;
        }
        if (gestureState.vy > DISMISS_VELOCITY / 2) {
          snapTo("collapsed");
          return;
        }
        const midpoint = COLLAPSED_OFFSET / 2;
        snapTo(current < midpoint ? "expanded" : "collapsed");
      },
      onPanResponderTerminate: () => {
        snapTo(snapRef.current);
      },
    }),
  ).current;

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
          <View style={styles.dragZone} {...panResponder.panHandlers}>
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
                <Ionicons
                  name="close"
                  size={22}
                  color={activeSurface.textSecondary}
                />
              </Pressable>
            </View>
            <Text style={styles.title} numberOfLines={2}>
              {content?.title ??
                (isLoading ? "불러오는 중이에요" : "연결된 내용")}
            </Text>
          </View>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
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
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: EXPANDED_HEIGHT,
    backgroundColor: surface.surfacePrimary,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.lg,
    gap: space.sm,
  },
  dragZone: {
    gap: space.sm,
    paddingBottom: space.xs,
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
