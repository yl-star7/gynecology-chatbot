import type { ComponentType } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "../../ui";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  space,
  typo,
} from "../../../theme";

const SectionIcon = Ionicons as unknown as ComponentType<{
  name: "happy-outline" | "heart-outline";
  size: number;
  color: string;
}>;

export function PatientTodayInfoSection({
  babyCard,
  momCard,
}: {
  babyCard: { title: string; body: string };
  momCard: { title: string; body: string };
}) {
  return (
    <Card style={styles.segmentCard}>
      <View style={styles.segmentSection}>
        <View style={styles.iconTitleRow}>
          <View style={[styles.sectionIconWrap, styles.babyIconWrap]}>
            <SectionIcon
              name="happy-outline"
              size={space.lg + space.xs}
              color={palette.accent}
            />
          </View>
          <Text style={styles.sectionTitle}>{babyCard.title}</Text>
        </View>
        <View style={[styles.innerPanel, styles.babyPanel]}>
          <Text style={styles.sectionBody}>{babyCard.body}</Text>
        </View>
      </View>

      <View style={styles.segmentSection}>
        <View style={styles.iconTitleRow}>
          <View style={[styles.sectionIconWrap, styles.momIconWrap]}>
            <SectionIcon
              name="heart-outline"
              size={space.lg + space.xs}
              color={palette.accent}
            />
          </View>
          <Text style={styles.sectionTitle}>{momCard.title}</Text>
        </View>
        <View style={[styles.innerPanel, styles.momPanel]}>
          <Text style={styles.sectionBody}>{momCard.body}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  segmentCard: {
    gap: space.sm,
    padding: space.md,
  },
  segmentSection: {
    gap: space.md,
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
  babyIconWrap: {
    backgroundColor: surface.surfaceAccent,
  },
  momIconWrap: {
    backgroundColor: surface.surfaceSecondary,
  },
  sectionTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  innerPanel: {
    borderRadius: radii.xl,
    padding: space.lg,
  },
  babyPanel: {
    backgroundColor: surface.surfaceAccent,
  },
  momPanel: {
    backgroundColor: surface.surfaceSecondary,
  },
  sectionBody: {
    ...typo.body,
    color: surface.textSecondary,
  },
});