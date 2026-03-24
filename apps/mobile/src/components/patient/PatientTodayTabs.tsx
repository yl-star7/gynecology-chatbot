// @ts-nocheck
import { StyleSheet, Text, View } from "react-native";
import { Pressable } from "../ui";
import { palette, patientSurfacePalette as surface, radii, space, typo } from "../../theme";

const TAB_ICONS: Record<string, string> = {
  baby: "✦",
  mom: "♡",
  checklist: "✓",
  conversation: "✉",
  records: "◌",
  reflections: "☰",
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
            <View style={[styles.iconWrap, isActive ? styles.iconWrapActive : null]}>
              <Text style={[styles.iconLabel, isActive ? styles.iconLabelActive : null]}>
                {TAB_ICONS[section.id] ?? "•"}
              </Text>
            </View>
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
    flexWrap: "wrap",
    gap: space.sm,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: radii.xxl,
    padding: space.xs,
  },
  tab: {
    borderRadius: radii.full,
    backgroundColor: surface.surfacePrimary,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  tabActive: {
    backgroundColor: surface.surfaceAccent,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: surface.surfaceSecondary,
  },
  iconWrapActive: {
    backgroundColor: "#ffffff",
  },
  iconLabel: {
    fontSize: 12,
    color: surface.textSecondary,
  },
  iconLabelActive: {
    color: palette.accent,
    fontWeight: "700",
  },
  label: {
    ...typo.caption,
    color: surface.textSecondary,
  },
  labelActive: {
    color: palette.accent,
    fontWeight: "700",
  },
});
