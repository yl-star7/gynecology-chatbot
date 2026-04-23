// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { patientSurfacePalette as surface, radii, space, typo } from "../../theme";
import { useMobileTheme } from "../../theme-provider";

export function EmptyState({
  icon = "chatbubbles-outline",
  title,
  description,
}: {
  icon?: string;
  title: string;
  description: string;
}) {
  const { palette: activePalette } = useMobileTheme();

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={space.xxxl} color={activePalette.accent} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: space.xxxl * 2 - space.xs,
    gap: space.sm,
  },
  iconCircle: {
    width: space.xxxl * 2,
    height: space.xxxl * 2,
    borderRadius: radii.full,
    backgroundColor: surface.surfaceAccent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.sm,
  },
  title: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  description: {
    ...typo.caption,
    color: surface.textSecondary,
    textAlign: "center",
  },
});
