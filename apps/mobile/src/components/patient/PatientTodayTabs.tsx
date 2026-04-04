// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Pressable } from "../ui";
import { palette, patientSurfacePalette as surface, radii, space, typo } from "../../theme";

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  info: "happy-outline",
  checklist: "checkmark-circle-outline",
  conversation: "chatbubble-outline",
  records: "checkbox-outline",
  reflections: "chatbubbles-outline",
};

export function PatientTodayTabs({
  sections,
  activeSection,
  onChange,
}: {
  sections: { id: string; label: string }[];
  activeSection: string;
  onChange: (sectionId: string) => void;
}) {
  return (
    <View style={styles.container}>
      {sections.map((section) => {
        const isActive = section.id === activeSection;

        return (
          <Pressable
            key={section.id}
            style={[styles.tab, isActive ? styles.tabActive : null]}
            onPress={() => onChange(section.id)}
          >
            <Ionicons
              name={TAB_ICONS[section.id] ?? "ellipse-outline"}
              size={space.lg + space.xs}
              color={isActive ? palette.accent : surface.textSecondary}
            />
            <Text style={[styles.label, isActive ? styles.labelActive : null]}>{section.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: space.xs,
    backgroundColor: surface.surfacePrimary,
    borderRadius: radii.xxl,
    padding: space.xs,
  },
  tab: {
    flex: 1,
    borderRadius: radii.full,
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    justifyContent: "center",
    backgroundColor: surface.surfaceSecondary,
  },
  tabActive: {
    backgroundColor: surface.surfaceAccent,
  },
  label: {
    ...typo.label,
    color: surface.textSecondary,
    flexShrink: 1,
  },
  labelActive: {
    color: palette.accent,
    fontWeight: "700",
  },
});
