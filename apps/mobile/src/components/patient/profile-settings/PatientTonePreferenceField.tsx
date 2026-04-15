import { StyleSheet, Text, View } from "react-native";
import { Pressable } from "../../ui";
import {
  palette,
  patientSurfacePalette as surface,
  space,
  typo,
} from "../../../theme";

export function PatientTonePreferenceField({
  value,
  isOpen,
  options,
  onToggle,
  onSelect,
}: {
  value: string;
  isOpen: boolean;
  options: string[];
  onToggle: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>상담 분위기</Text>
      <Pressable
        style={styles.dropdownTrigger}
        onPress={onToggle}
        accessibilityLabel="상담 분위기 선택"
      >
        <Text style={value ? styles.dropdownValue : styles.dropdownPlaceholder}>
          {value || "상담 분위기를 선택해주세요"}
        </Text>
      </Pressable>
      {isOpen ? (
        <View style={styles.dropdownList}>
          {options.map((option) => {
            const isSelected = value === option;
            return (
              <Pressable
                key={option}
                style={
                  isSelected
                    ? [styles.dropdownItem, styles.dropdownItemActive]
                    : styles.dropdownItem
                }
                onPress={() => onSelect(option)}
                accessibilityLabel={option}
              >
                <Text
                  style={
                    isSelected
                      ? [
                          styles.dropdownItemLabel,
                          styles.dropdownItemLabelActive,
                        ]
                      : styles.dropdownItemLabel
                  }
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
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
  dropdownTrigger: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
    backgroundColor: surface.surfacePrimary,
    justifyContent: "center",
    paddingHorizontal: space.md,
  },
  dropdownValue: {
    ...typo.body,
    color: surface.textPrimary,
  },
  dropdownPlaceholder: {
    ...typo.body,
    color: surface.textSecondary,
  },
  dropdownList: {
    marginTop: space.xs,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
    backgroundColor: surface.surfacePrimary,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  dropdownItemActive: {
    backgroundColor: surface.surfaceAccent,
  },
  dropdownItemLabel: {
    ...typo.body,
    color: surface.textPrimary,
  },
  dropdownItemLabelActive: {
    color: palette.accent,
    fontWeight: "600",
  },
});
