// @ts-nocheck
import { StyleSheet, Text, View } from "react-native";
import { palette, patientSurfacePalette as surface, typo } from "../../theme";

export function HeroSection({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string | null;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
  },
  eyebrow: {
    ...typo.eyebrow,
    color: palette.accent,
  },
  title: {
    marginTop: 8,
    ...typo.titleLg,
    color: surface.textPrimary,
  },
  description: {
    marginTop: 10,
    ...typo.body,
    color: surface.textSecondary,
  },
});
