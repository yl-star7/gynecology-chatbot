// @ts-nocheck
import type { ComponentType } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, Pressable } from "../../ui";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  shadows,
  space,
  typo,
} from "../../../theme";
import { useMobileTheme } from "../../../theme-provider";
import type { ConversationWeekEncyclopediaSheetModel } from "../../../screens/patient/PatientConversationWeekEncyclopediaSheet.model";

const SheetIcon = Ionicons as unknown as ComponentType<{
  name: "close";
  size: number;
  color: string;
}>;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function PatientConversationWeekEncyclopediaSheet({
  visible,
  model,
  onClose,
}: {
  visible: boolean;
  model: ConversationWeekEncyclopediaSheetModel;
  onClose: () => void;
}) {
  const { surface: activeSurface } = useMobileTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isCompact = model.sections.length === 0;
  const usableHeight = height - insets.top;
  const defaultSheetHeight = Math.round(
    usableHeight * (isCompact ? 0.42 : 0.64),
  );
  const minSheetHeight = Math.round(usableHeight * (isCompact ? 0.32 : 0.42));
  const maxSheetHeight = Math.round(usableHeight * 0.86);
  const [sheetHeight, setSheetHeight] = useState(defaultSheetHeight);
  const sheetHeightRef = useRef(defaultSheetHeight);
  const dragStartHeightRef = useRef(defaultSheetHeight);

  const setAdjustedSheetHeight = useCallback((nextHeight: number) => {
    sheetHeightRef.current = nextHeight;
    setSheetHeight(nextHeight);
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setAdjustedSheetHeight(defaultSheetHeight);
  }, [defaultSheetHeight, setAdjustedSheetHeight, visible]);

  const handleToggleSheetHeight = useCallback(() => {
    const isExpanded = sheetHeightRef.current >= maxSheetHeight - space.lg;
    setAdjustedSheetHeight(isExpanded ? defaultSheetHeight : maxSheetHeight);
  }, [defaultSheetHeight, maxSheetHeight, setAdjustedSheetHeight]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gestureState) =>
          Math.abs(gestureState.dy) > 5,
        onPanResponderGrant: () => {
          dragStartHeightRef.current = sheetHeightRef.current;
        },
        onPanResponderMove: (_event, gestureState) => {
          const nextHeight = clamp(
            dragStartHeightRef.current - gestureState.dy,
            minSheetHeight,
            maxSheetHeight,
          );
          setAdjustedSheetHeight(nextHeight);
        },
      }),
    [maxSheetHeight, minSheetHeight, setAdjustedSheetHeight],
  );

  const scrollHeight = Math.max(
    isCompact ? space.xxxl * 3 : space.xxxl * 8,
    sheetHeight - space.xxxl * 5,
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.backdropTint} />
        <Pressable
          style={styles.backdrop}
          accessibilityLabel="닫기"
          onPress={onClose}
        />
        <View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              paddingBottom: Math.max(insets.bottom, space.md),
            },
          ]}
        >
          <Pressable
            {...panResponder.panHandlers}
            accessibilityLabel="시트 높이 조절"
            accessibilityRole="button"
            onPress={handleToggleSheetHeight}
            style={styles.dragHandleArea}
          >
            <View style={styles.handle} />
          </Pressable>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>주차별 사전</Text>
              <Text style={styles.title}>{model.title}</Text>
              <Text style={styles.subtitle}>{model.subtitle}</Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityLabel="닫기"
              style={styles.closeButton}
            >
              <SheetIcon
                name="close"
                size={space.lg + space.xs}
                color={activeSurface.textSecondary}
              />
            </Pressable>
          </View>

          <ScrollView
            style={[styles.scroll, { height: scrollHeight }]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {model.emptyTitle ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.sectionTitle}>{model.emptyTitle}</Text>
                {model.emptyDescription ? (
                  <Text style={styles.bodyText}>{model.emptyDescription}</Text>
                ) : null}
              </Card>
            ) : null}

            {model.sections.map((section) => (
              <Card key={section.title} style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.body ? (
                  <Text style={styles.bodyText}>{section.body}</Text>
                ) : null}
                {section.items?.length ? (
                  <View style={styles.itemList}>
                    {section.items.map((item, index) => (
                      <View
                        key={`${section.title}-${index}`}
                        style={styles.itemRow}
                      >
                        <View style={styles.itemDot} />
                        <Text style={styles.itemText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </Card>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  backdropTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: surface.textPrimary,
    opacity: 0.32,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: surface.surfaceSecondary,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    gap: space.md,
    ...shadows.card,
  },
  dragHandleArea: {
    minHeight: space.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  handle: {
    width: space.xxxl + space.md,
    height: space.xs,
    borderRadius: radii.full,
    backgroundColor: surface.surfaceAccent,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.md,
  },
  headerCopy: {
    flex: 1,
    gap: space.xs,
  },
  eyebrow: {
    ...typo.caption,
    color: palette.accent,
    fontWeight: "700",
  },
  title: {
    ...typo.titleMd,
    color: surface.textPrimary,
  },
  subtitle: {
    ...typo.body,
    color: surface.textSecondary,
  },
  closeButton: {
    width: space.xxxl,
    height: space.xxxl,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: surface.fieldSurface,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: space.sm,
    paddingBottom: space.md,
  },
  emptyCard: {
    gap: space.sm,
  },
  sectionCard: {
    gap: space.sm,
    padding: space.lg,
  },
  sectionTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  bodyText: {
    ...typo.body,
    color: surface.textSecondary,
  },
  itemList: {
    gap: space.xs,
  },
  itemRow: {
    flexDirection: "row",
    gap: space.sm,
    alignItems: "flex-start",
  },
  itemDot: {
    width: space.xs,
    height: space.xs,
    borderRadius: radii.full,
    backgroundColor: palette.accent,
    marginTop: space.sm,
  },
  itemText: {
    flex: 1,
    ...typo.body,
    color: surface.textSecondary,
  },
});
