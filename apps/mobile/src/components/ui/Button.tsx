// @ts-nocheck
import { StyleSheet, Text } from "react-native";
import { Pressable } from "./Pressable";
import { radii, space, typo } from "../../theme";
import { useMobileTheme } from "../../theme-provider";

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
  const { palette, surface } = useMobileTheme();
  const buttonStyle =
    variant === "primary"
      ? { backgroundColor: surface.accentSolid }
      : variant === "secondary"
        ? { backgroundColor: surface.surfaceAccent }
        : { backgroundColor: "transparent", paddingVertical: space.md };
  const labelStyle =
    variant === "primary"
      ? { color: surface.surfacePrimary }
      : variant === "secondary"
        ? { color: palette.accent }
        : { color: palette.accent, fontSize: 14, fontWeight: "500" };

  return (
    <Pressable
      style={[styles.base, buttonStyle, disabled ? styles.disabled : null]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.label, labelStyle]}>{label}</Text>
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
