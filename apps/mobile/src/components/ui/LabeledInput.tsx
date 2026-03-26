// @ts-nocheck
import { StyleSheet, Text, TextInput, View } from "react-native";
import type { KeyboardTypeOptions } from "react-native";
import { palette, patientSurfacePalette as surface, typo } from "../../theme";
import { LABELED_INPUT_LAYOUT } from "./LabeledInput.model";

export function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline = false,
  returnKeyType,
  onSubmitEditing,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  returnKeyType?: "done" | "go" | "next" | "search" | "send";
  onSubmitEditing?: () => void;
}) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.subInk}
        style={[styles.input, multiline ? styles.multiline : null]}
        keyboardType={keyboardType}
        multiline={multiline}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: LABELED_INPUT_LAYOUT.fieldGap,
  },
  label: {
    ...typo.label,
    color: surface.textPrimary,
    marginLeft: LABELED_INPUT_LAYOUT.labelInset,
  },
  input: {
    minHeight: LABELED_INPUT_LAYOUT.inputMinHeight,
    borderRadius: LABELED_INPUT_LAYOUT.inputRadius,
    paddingHorizontal: LABELED_INPUT_LAYOUT.inputPaddingX,
    paddingVertical: LABELED_INPUT_LAYOUT.inputPaddingY,
    backgroundColor: surface.fieldSurface,
    color: surface.textPrimary,
    fontSize: 15,
  },
  multiline: {
    minHeight: LABELED_INPUT_LAYOUT.multilineMinHeight,
    textAlignVertical: "top",
  },
});
