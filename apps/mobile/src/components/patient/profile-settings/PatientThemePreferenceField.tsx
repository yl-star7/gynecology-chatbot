import { StyleSheet, Text, View } from "react-native";
import type { MobileThemeKey } from "@gynecology-chatbot/app-core";
import { Pressable } from "../../ui";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  space,
  typo,
} from "../../../theme";

const THEME_SWATCH_COLORS: Record<MobileThemeKey, string> = {
  "rose-sand": "#e08aa7",
  "soft-peach": "#e08b67",
  "mint-neutral": "#6ca78f",
  "sky-blue": "#5ba2d8",
};

export function PatientThemePreferenceField({
  value,
  options,
  onSelect,
}: {
  value: MobileThemeKey;
  options: {
    key: MobileThemeKey;
    label: string;
    description: string;
  }[];
  onSelect: (value: MobileThemeKey) => void;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>앱 색상</Text>
      <View style={styles.themeGrid}>
        {options.map((option) => {
          const isSelected = value === option.key;

          return (
            <Pressable
              key={option.key}
              style={
                isSelected
                  ? [styles.themeOption, styles.themeOptionActive]
                  : styles.themeOption
              }
              onPress={() => onSelect(option.key)}
              accessibilityLabel={`${option.label} 테마 선택`}
            >
              <View
                style={[
                  styles.themeSwatch,
                  { backgroundColor: THEME_SWATCH_COLORS[option.key] },
                ]}
              />
              <View style={styles.themeCopy}>
                <Text
                  style={[
                    styles.themeLabel,
                    isSelected && styles.themeLabelActive,
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.themeDescription}>
                  {option.description}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldBlock: {
    gap: space.xs,
  },
  fieldLabel: {
    ...typo.caption,
    color: surface.textSecondary,
    fontWeight: "600",
  },
  themeGrid: {
    gap: space.sm,
  },
  themeOption: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    borderRadius: radii.lg,
    backgroundColor: surface.fieldSurface,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  themeOptionActive: {
    backgroundColor: surface.surfaceAccent,
  },
  themeSwatch: {
    width: space.xl,
    height: space.xl,
    borderRadius: radii.full,
  },
  themeCopy: {
    flex: 1,
    gap: space.xs,
  },
  themeLabel: {
    ...typo.label,
    color: surface.textPrimary,
  },
  themeLabelActive: {
    color: palette.accent,
  },
  themeDescription: {
    ...typo.caption,
    color: surface.textSecondary,
  },
});
