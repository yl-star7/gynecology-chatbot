// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import type { ComponentType } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Card, Pressable } from "../../ui";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  shadows,
  space,
  typo,
} from "../../../theme";
import type { ConversationWeekEncyclopediaSheetModel } from "../../../screens/patient/PatientConversationWeekEncyclopediaSheet.model";

const SheetIcon = Ionicons as unknown as ComponentType<{
  name: "close" | "open-outline";
  size: number;
  color: string;
}>;

export function PatientConversationWeekEncyclopediaSheet({
  visible,
  model,
  onClose,
  onOpenFullView,
}: {
  visible: boolean;
  model: ConversationWeekEncyclopediaSheetModel;
  onClose: () => void;
  onOpenFullView?: () => void;
}) {
  const { height } = useWindowDimensions();
  const canOpenFullView = Boolean(onOpenFullView && model.selectedWeekNumber);

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
        <View style={[styles.sheet, { maxHeight: Math.round(height * 0.82) }]}>
          <View style={styles.handle} />
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
                color={surface.textSecondary}
              />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {model.emptyTitle ? (
              <Card variant="muted" style={styles.emptyCard}>
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

          {canOpenFullView ? (
            <Pressable
              style={styles.ctaButton}
              accessibilityRole="button"
              accessibilityLabel="임신백과에서 자세히 보기"
              onPress={onOpenFullView}
            >
              <SheetIcon
                name="open-outline"
                size={space.lg}
                color={surface.surfacePrimary}
              />
              <Text style={styles.ctaLabel}>임신백과에서 자세히 보기</Text>
            </Pressable>
          ) : null}
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
    backgroundColor: surface.surfacePrimary,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.lg,
    gap: space.md,
    ...shadows.card,
  },
  handle: {
    alignSelf: "center",
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
    paddingBottom: space.xs,
  },
  emptyCard: {
    gap: space.sm,
  },
  sectionCard: {
    gap: space.sm,
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
  ctaButton: {
    minHeight: space.xxxl + space.lg,
    borderRadius: radii.full,
    backgroundColor: palette.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs,
    paddingHorizontal: space.lg,
  },
  ctaLabel: {
    ...typo.button,
    color: surface.surfacePrimary,
    fontWeight: "700",
  },
});
