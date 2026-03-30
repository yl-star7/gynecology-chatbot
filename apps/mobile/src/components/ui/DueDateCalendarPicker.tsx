import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { palette, patientSurfacePalette as surface, radii, space, typo } from "../../theme";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function buildMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const leadingEmpty = firstDay.getDay();
  const days: (number | null)[] = [];

  for (let i = 0; i < leadingEmpty; i += 1) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(day);
  }

  return days;
}

function formatIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

interface DueDateCalendarPickerProps {
  value: string;
  onChange: (isoDate: string) => void;
  minDate?: Date;
  maxDate?: Date;
}

export function DueDateCalendarPicker({
  value,
  onChange,
  minDate,
  maxDate,
}: DueDateCalendarPickerProps) {
  const initial = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(
    Number.isNaN(initial.getTime()) ? new Date().getFullYear() : initial.getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState(
    Number.isNaN(initial.getTime()) ? new Date().getMonth() : initial.getMonth(),
  );

  const days = buildMonthGrid(viewYear, viewMonth);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function isDisabled(day: number) {
    const date = new Date(viewYear, viewMonth, day);
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  }

  function isSelected(day: number) {
    return value === formatIsoDate(viewYear, viewMonth, day);
  }

  const monthLabel = `${viewYear}년 ${viewMonth + 1}월`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={prevMonth} style={styles.navButton}>
          <Text style={styles.navText}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
          <Text style={styles.navText}>{">"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((wd) => (
          <Text key={wd} style={styles.weekdayLabel}>{wd}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {days.map((day, index) => (
          <View key={index} style={styles.cell}>
            {day != null ? (
              <TouchableOpacity
                onPress={() => {
                  if (!isDisabled(day)) {
                    onChange(formatIsoDate(viewYear, viewMonth, day));
                  }
                }}
                disabled={isDisabled(day)}
                style={[
                  styles.dayButton,
                  isSelected(day) && styles.daySelected,
                  isDisabled(day) && styles.dayDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    isSelected(day) && styles.dayTextSelected,
                    isDisabled(day) && styles.dayTextDisabled,
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))}
      </View>

      {value ? (
        <Text style={styles.selectedLabel}>
          선택한 예정일: {value}
        </Text>
      ) : null}
    </View>
  );
}

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
    padding: space.md,
    backgroundColor: surface.surfacePrimary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: space.sm,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  navText: {
    ...typo.label,
    color: palette.accent,
    fontSize: 18,
  },
  monthLabel: {
    ...typo.label,
    color: surface.textPrimary,
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: space.xs,
  },
  weekdayLabel: {
    width: CELL_SIZE,
    flex: 1,
    textAlign: "center",
    ...typo.caption,
    color: surface.textSecondary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%`,
    height: CELL_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  dayButton: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  daySelected: {
    backgroundColor: palette.accent,
  },
  dayDisabled: {
    opacity: 0.3,
  },
  dayText: {
    ...typo.body,
    color: surface.textPrimary,
  },
  dayTextSelected: {
    color: "#ffffff",
    fontWeight: "700",
  },
  dayTextDisabled: {
    color: surface.textSecondary,
  },
  selectedLabel: {
    marginTop: space.sm,
    textAlign: "center",
    ...typo.caption,
    color: palette.accent,
  },
});
