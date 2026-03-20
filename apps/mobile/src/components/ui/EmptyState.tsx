// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { palette, patientSurfacePalette as surface } from "../../theme";

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
        <Ionicons name={icon} size={32} color={palette.accent} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: surface.surfaceAccent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: surface.textPrimary,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: surface.textSecondary,
    textAlign: "center",
  },
});
