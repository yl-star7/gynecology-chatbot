import type { ComponentType } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import type { TodayViewData } from "@gynecology-chatbot/app-core";
import { Card, Pressable } from "../../ui";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  space,
  typo,
} from "../../../theme";

const ChecklistIcon = Ionicons as unknown as ComponentType<{
  name: "checkmark-circle-outline";
  size: number;
  color: string;
}>;

export function PatientTodayChecklistSection({
  title,
  items,
  pendingChecklistIds,
  progressPercent,
  onToggleChecklistItem,
}: {
  title: string;
  items: TodayViewData["checklistItems"];
  pendingChecklistIds: string[];
  progressPercent: number;
  onToggleChecklistItem: (checklistId: string, completed: boolean) => void;
}) {
  return (
    <Card style={styles.segmentCard}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.iconTitleRow}>
          <View style={[styles.sectionIconWrap, styles.checklistIconWrap]}>
            <ChecklistIcon
              name="checkmark-circle-outline"
              size={space.lg + space.xs}
              color={palette.successText}
            />
          </View>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
      </View>

      <View style={styles.checklist}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            style={styles.checklistRow}
            onPress={() => onToggleChecklistItem(item.id, !item.completed)}
            disabled={pendingChecklistIds.includes(item.id)}
            accessibilityLabel={`${item.label} ${item.completed ? "완료됨" : "미완료"}`}
          >
            <View
              style={
                item.completed
                  ? [styles.checkbox, styles.checkboxCompleted]
                  : styles.checkbox
              }
            />
            <Text style={styles.checklistLabel}>{item.label}</Text>
          </Pressable>
        ))}
        {items.length === 0 ? (
          <Text style={styles.emptyChecklistText}>
            오늘 체크리스트를 준비 중이에요.
          </Text>
        ) : null}
      </View>

      <View style={styles.progressMetaRow}>
        <Text style={styles.progressMetaLabel}>완료율</Text>
        <Text style={styles.progressPercent}>{`${progressPercent}%`}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  segmentCard: {
    gap: space.sm,
    padding: space.md,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.sm,
  },
  iconTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  sectionIconWrap: {
    width: space.xxl + space.xs,
    height: space.xxl + space.xs,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  checklistIconWrap: {
    backgroundColor: palette.successBackground,
  },
  sectionTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  checklist: {
    marginTop: space.lg,
    gap: space.lg,
  },
  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  checkbox: {
    width: space.xl + space.xs,
    height: space.xl + space.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
    backgroundColor: surface.fieldSurface,
  },
  checkboxCompleted: {
    backgroundColor: palette.successBackground,
    borderColor: palette.successText,
  },
  checklistLabel: {
    ...typo.titleSm,
    color: surface.textPrimary,
    flex: 1,
  },
  emptyChecklistText: {
    ...typo.body,
    color: surface.textSecondary,
  },
  progressMetaRow: {
    marginTop: space.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressMetaLabel: {
    ...typo.label,
    color: surface.textSecondary,
  },
  progressPercent: {
    ...typo.titleSm,
    color: palette.successText,
  },
  progressTrack: {
    marginTop: space.sm,
    height: 10,
    borderRadius: radii.full,
    backgroundColor: surface.surfaceSecondary,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: palette.successText,
  },
});