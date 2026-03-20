// @ts-nocheck
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { patientSurfacePalette as surface, radii, shadows, space } from "../../theme";

export function Card({
  children,
  variant = "primary",
  style,
}: {
  children: ReactNode;
  variant?: "primary" | "accent" | "muted";
  style?: object;
}) {
  return (
    <View style={[styles.base, variantStyles[variant], shadows.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.xl,
    padding: space.xl,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: surface.surfacePrimary,
  },
  accent: {
    backgroundColor: surface.surfaceAccent,
  },
  muted: {
    backgroundColor: surface.surfaceSecondary,
  },
});
