import { StyleSheet, Text, View } from "react-native";
import { Card, Pressable } from "../../ui";
import {
  patientSurfacePalette as surface,
  radii,
  space,
  typo,
} from "../../../theme";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

export function PatientProfileCalendarCard({
  columnWidth,
  currentMonthLabel,
  gridDays,
  activeDays,
  isoDateByDay,
  onSelectDay,
}: {
  columnWidth: string;
  currentMonthLabel: string | null | undefined;
  gridDays: (number | null)[];
  activeDays: Set<number>;
  isoDateByDay: Map<number, string>;
  onSelectDay: (isoDate: string) => void;
}) {
  return (
    <Card style={styles.calendarCard}>
      <Text style={styles.sectionTitle}>활동 캘린더</Text>
      <Text style={styles.sectionDescription}>
        {currentMonthLabel
          ? `${currentMonthLabel}에 활동이 있었던 날을 눌러 하루 기록을 볼 수 있어요.`
          : "활동이 있었던 날을 한눈에 볼 수 있어요."}
      </Text>
      <View style={styles.weekdayRow}>
        {DAY_NAMES.map((label) => (
          <Text key={label} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.calendarGrid}>
        {gridDays.map((day, index) => {
          const isActive = day ? activeDays.has(day) : false;
          const isoDate = day ? isoDateByDay.get(day) : null;

          if (!day || !isoDate) {
            return (
              <View
                key={`day-${index}`}
                style={[styles.calendarCell, { width: columnWidth }]}
              >
                <View style={styles.calendarCellInner}>
                  <Text style={styles.calendarLabel} />
                </View>
              </View>
            );
          }

          return (
            <Pressable
              key={`day-${index}`}
              style={[styles.calendarCell, { width: columnWidth }]}
              onPress={() => onSelectDay(isoDate)}
              accessibilityLabel={`${day}일 기록 보기`}
            >
              <View
                style={
                  isActive
                    ? [styles.calendarCellInner, styles.calendarCellActive]
                    : styles.calendarCellInner
                }
              >
                <Text
                  style={
                    isActive
                      ? [styles.calendarLabel, styles.calendarLabelActive]
                      : styles.calendarLabel
                  }
                >
                  {String(day)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  calendarCard: {
    paddingTop: space.xl,
  },
  sectionTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  sectionDescription: {
    marginTop: space.xs,
    ...typo.caption,
    color: surface.textSecondary,
  },
  weekdayRow: {
    marginTop: space.lg,
    flexDirection: "row",
  },
  weekdayLabel: {
    width: "14.285714%",
    textAlign: "center",
    ...typo.caption,
    color: surface.textSecondary,
  },
  calendarGrid: {
    marginTop: space.md,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarCell: {
    aspectRatio: 1,
    padding: space.xs / 2,
  },
  calendarCellInner: {
    flex: 1,
    borderRadius: radii.sm,
    backgroundColor: surface.fieldSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarCellActive: {
    backgroundColor: surface.accentSolid,
  },
  calendarLabel: {
    ...typo.label,
    color: surface.textSecondary,
  },
  calendarLabelActive: {
    color: surface.surfacePrimary,
    fontWeight: "700",
  },
});
