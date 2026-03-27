// @ts-nocheck
import { StyleSheet, Text } from "react-native";
import { Pressable } from "./Pressable";
import { palette, patientSurfacePalette as surface, radii, space, typo } from "../../theme";

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "text";
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[styles.base, variantStyles[variant], disabled ? styles.disabled : null]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.label, labelVariants[variant]]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    paddingVertical: space.lg,
  },
  label: {
    ...typo.button,
  },
  disabled: {
    opacity: 0.45,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: surface.accentSolid,
  },
  secondary: {
    backgroundColor: surface.surfaceAccent,
  },
  text: {
    backgroundColor: "transparent",
    paddingVertical: space.md,
  },
});

const labelVariants = StyleSheet.create({
  primary: {
    color: surface.surfacePrimary,
  },
  secondary: {
    color: palette.accent,
  },
  text: {
    color: palette.accent,
    fontSize: 14,
    fontWeight: "500",
  },
});
