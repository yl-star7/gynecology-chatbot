import { Modal, StyleSheet, Text, View } from "react-native";
import { Pressable, Button } from "../../ui";
import {
  buildPatientNotificationTimeFromParts,
  getPatientNotificationTimeParts,
} from "../../../screens/patient/patientNotificationTime.model";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  space,
  typo,
} from "../../../theme";

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);

export function PatientNotificationTimeField({
  value,
  isOpen,
  onToggle,
  onSelect,
}: {
  value: string;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
}) {
  const { hour, minute, hourLabel, minuteLabel } =
    getPatientNotificationTimeParts(value);

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>알림 시간</Text>
      <Pressable
        style={styles.trigger}
        onPress={onToggle}
        accessibilityLabel="알림 시간 선택"
      >
        <Text style={styles.triggerValue}>
          {value || `${hourLabel}:${minuteLabel}`}
        </Text>
      </Pressable>
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent
        onRequestClose={onToggle}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>알림 시간</Text>
              <Text style={styles.modalDescription}>
                매일 받고 싶은 시간을 골라주세요.
              </Text>
            </View>
            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>선택한 시간</Text>
              <Text
                style={styles.previewValue}
              >{`${hourLabel}:${minuteLabel}`}</Text>
            </View>
            <View style={styles.pickerRow}>
              <TimeColumn
                label="시"
                values={HOURS}
                selectedValue={hour}
                onSelect={(nextHour) =>
                  onSelect(
                    buildPatientNotificationTimeFromParts(nextHour, minute),
                  )
                }
              />
              <TimeColumn
                label="분"
                values={MINUTES}
                selectedValue={minute}
                onSelect={(nextMinute) =>
                  onSelect(
                    buildPatientNotificationTimeFromParts(hour, nextMinute),
                  )
                }
              />
            </View>
            <Button label="완료" onPress={onToggle} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function TimeColumn({
  label,
  values,
  selectedValue,
  onSelect,
}: {
  label: string;
  values: number[];
  selectedValue: number;
  onSelect: (value: number) => void;
}) {
  return (
    <View style={styles.column}>
      <Text style={styles.columnLabel}>{label}</Text>
      <View style={styles.optionList}>
        {values.map((value) => {
          const isSelected = value === selectedValue;
          return (
            <Pressable
              key={`${label}-${value}`}
              style={
                isSelected
                  ? [styles.optionButton, styles.optionButtonSelected]
                  : styles.optionButton
              }
              onPress={() => onSelect(value)}
            >
              <Text
                style={
                  isSelected
                    ? [styles.optionLabel, styles.optionLabelSelected]
                    : styles.optionLabel
                }
              >
                {String(value).padStart(2, "0")}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldBlock: {
    gap: space.xs,
  },
  fieldLabel: {
    ...typo.caption,
    color: surface.textSecondary,
    fontWeight: "600",
  },
  trigger: {
    minHeight: 52,
    borderRadius: radii.md,
    backgroundColor: surface.fieldSurface,
    justifyContent: "center",
    paddingHorizontal: space.md,
  },
  triggerValue: {
    ...typo.body,
    color: surface.textPrimary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    gap: space.md,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    backgroundColor: surface.surfacePrimary,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.xxl,
  },
  modalHeader: {
    gap: space.xs,
  },
  modalTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  modalDescription: {
    ...typo.caption,
    color: surface.textSecondary,
  },
  previewCard: {
    gap: space.xs,
    borderRadius: radii.lg,
    backgroundColor: surface.surfaceSecondary,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  },
  previewLabel: {
    ...typo.caption,
    color: surface.textSecondary,
  },
  previewValue: {
    ...typo.titleSm,
    color: palette.accent,
  },
  pickerRow: {
    flexDirection: "row",
    gap: space.md,
  },
  column: {
    flex: 1,
    gap: space.xs,
  },
  columnLabel: {
    ...typo.label,
    color: surface.textPrimary,
  },
  optionList: {
    gap: space.xs,
    maxHeight: 240,
  },
  optionButton: {
    borderRadius: radii.md,
    backgroundColor: surface.fieldSurface,
    paddingVertical: space.sm,
    alignItems: "center",
  },
  optionButtonSelected: {
    backgroundColor: surface.surfaceAccent,
  },
  optionLabel: {
    ...typo.body,
    color: surface.textPrimary,
  },
  optionLabelSelected: {
    color: palette.accent,
    fontWeight: "700",
  },
});
