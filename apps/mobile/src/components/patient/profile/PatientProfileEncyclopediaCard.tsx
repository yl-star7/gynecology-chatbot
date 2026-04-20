import { Ionicons } from "@expo/vector-icons";
import type { ComponentType } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card, Pressable } from "../../ui";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  space,
  typo,
} from "../../../theme";
import type { ProfileEncyclopediaEntry } from "../../../screens/patient/PatientProfileScreen.model";

const ChevronIcon = Ionicons as unknown as ComponentType<{
  name: "chevron-forward";
  size: number;
  color: string;
}>;

function EntryRow({
  badge,
  title,
  description,
  onPress,
}: {
  badge: string;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.entryRow}
      onPress={onPress}
      accessibilityLabel={`${title} 열기`}
    >
      <View style={styles.entryBadge}>
        <Text style={styles.entryBadgeText}>{badge}</Text>
      </View>
      <View style={styles.entryText}>
        <Text style={styles.entryTitle}>{title}</Text>
        <Text style={styles.entryDescription}>{description}</Text>
      </View>
      <ChevronIcon
        name="chevron-forward"
        size={space.lg + space.xs}
        color={surface.textSecondary}
      />
    </Pressable>
  );
}

export function PatientProfileEncyclopediaCard({
  entry,
  onOpenCurrentWeek,
  onBrowseWeeks,
}: {
  entry: ProfileEncyclopediaEntry;
  onOpenCurrentWeek: () => void;
  onBrowseWeeks: () => void;
}) {
  return (
    <Card>
      <Text style={styles.sectionTitle}>{entry.sectionTitle}</Text>
      <Text style={styles.sectionDescription}>
        주차별 태아 발달과 엄마 몸 변화를 사전처럼 읽어봐요.
      </Text>
      <View style={styles.entryList}>
        {entry.showCurrentWeekEntry ? (
          <EntryRow
            badge={entry.currentWeekLabel.replace("주차", "")}
            title={entry.currentActionLabel}
            description={entry.currentDescription}
            onPress={onOpenCurrentWeek}
          />
        ) : null}
        <EntryRow
          badge="주"
          title={entry.browseActionLabel}
          description={entry.browseDescription}
          onPress={onBrowseWeeks}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  sectionDescription: {
    marginTop: space.xs,
    ...typo.caption,
    color: surface.textSecondary,
  },
  entryList: {
    marginTop: space.lg,
    gap: space.sm,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.lg,
    backgroundColor: surface.fieldSurface,
    padding: space.md,
    gap: space.md,
  },
  entryBadge: {
    width: space.xxxl + space.sm,
    height: space.xxxl + space.sm,
    borderRadius: radii.md,
    backgroundColor: surface.surfaceAccent,
    alignItems: "center",
    justifyContent: "center",
  },
  entryBadgeText: {
    ...typo.label,
    color: palette.accent,
  },
  entryText: {
    flex: 1,
  },
  entryTitle: {
    ...typo.label,
    color: surface.textPrimary,
  },
  entryDescription: {
    marginTop: space.xs,
    ...typo.caption,
    color: surface.textSecondary,
  },
});
