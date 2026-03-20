// @ts-nocheck
import { StyleSheet, Text, TextInput, View } from "react-native";
import type { KeyboardTypeOptions } from "react-native";
import { palette, patientSurfacePalette as surface, radii, typo } from "../../theme";

export function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.subInk}
        style={[styles.input, multiline ? styles.multiline : null]}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    ...typo.label,
    color: surface.textPrimary,
    marginLeft: 4,
  },
  input: {
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: surface.fieldSurface,
    color: surface.textPrimary,
    fontSize: 15,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
});
