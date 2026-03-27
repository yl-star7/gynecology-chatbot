// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { palette, patientSurfacePalette as surface, radii, space, typo } from "../../theme";

export function EmptyState({
  icon = "chatbubbles-outline",
  title,
  description,
}: {
  icon?: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={space.xxxl} color={palette.accent} />
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
