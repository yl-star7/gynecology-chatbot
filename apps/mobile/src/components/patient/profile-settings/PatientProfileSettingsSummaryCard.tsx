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
  babyNickname,
  hospitalName,
  notificationTime,
}: {
  pregnancyWeekLabel: string;
  babyNickname?: string | null;
  hospitalName?: string | null;
  notificationTime?: string | null;
}) {
  const summaryItems = [
    {
      label: "현재 주차",
      value: pregnancyWeekLabel,
      accent: true,
    },
    {
      label: "태명",
      value: babyNickname?.trim() || "아직 정하지 않았어요",
    },
    {
      label: "병원",
      value: hospitalName?.trim() || "아직 입력하지 않았어요",
    },
    {
      label: "알림 시간",
      value: notificationTime?.trim() || "08:30",
    },
  ];

  return (
    <Card>
      <View style={styles.summaryColumn}>
        {summaryItems.map((item) => (
          <View key={item.label} style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{item.label}</Text>
            <Text
              style={
                item.accent
                  ? [styles.summaryValue, styles.accentValue]
                  : styles.summaryValue
              }
            >
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  summaryColumn: {
    gap: space.md,
  },
  summaryRow: {
    gap: space.xs,
  },
  summaryLabel: {
    ...typo.caption,
    color: surface.textSecondary,
  },
  summaryValue: {
    ...typo.label,
    color: surface.textPrimary,
  },
  accentValue: {
    color: palette.accent,
  },
});
