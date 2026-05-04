// @ts-nocheck
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { radii, space } from "../../theme";
import { useMobileTheme } from "../../theme-provider";

export function Card({
  children,
  variant = "primary",
  style,
}: {
  children: ReactNode;
  variant?: "primary" | "accent" | "muted";
  style?: object;
}) {
  const { surface, shadows } = useMobileTheme();
  const backgroundColor = {
    primary: surface.surfacePrimary,
    accent: surface.surfaceAccent,
    muted: surface.surfaceSecondary,
  }[variant];

  return (
    <View style={[styles.base, { backgroundColor }, shadows.card, style]}>
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
