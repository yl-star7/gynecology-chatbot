import { StyleSheet, Text, View } from "react-native";
import { Card } from "../../ui";
import {
  palette,
  patientSurfacePalette as surface,
  space,
  typo,
} from "../../../theme";

export function PatientProfileSettingsSummaryCard({
  pregnancyWeekLabel,
}: {
  pregnancyWeekLabel: string;
}) {
  return (
    <Card>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>현재 주차</Text>
        <Text style={styles.summaryValue}>{pregnancyWeekLabel}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    marginTop: space.lg,
    gap: space.xs,
  },
  summaryLabel: {
    ...typo.caption,
    color: surface.textSecondary,
  },
  summaryValue: {
    ...typo.label,
    color: palette.accent,
  },
});