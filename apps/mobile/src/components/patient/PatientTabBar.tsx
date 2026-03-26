// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Pressable } from "../ui";
import { palette, patientSurfacePalette as surface, radii, shadows, space, typo } from "../../theme";
import { openPatientTab, PATIENT_TABS } from "./PatientTabBar.model";

export function PatientTabBar({ activeTab }: { activeTab: "home" | "today" | "profile" }) {
  return (
    <View style={[styles.container, shadows.header]}>
      {PATIENT_TABS.map((tab) => {
        const isActive = tab.key === activeTab;

        return (
          <Pressable
            key={tab.key}
            style={[styles.item, isActive ? styles.itemActive : null]}
            onPress={() => openPatientTab(router, tab.href)}
            accessibilityLabel={`${tab.label} 화면 열기`}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={isActive ? palette.accent : surface.textSecondary}
            />
            <Text style={[styles.label, isActive ? styles.labelActive : null]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: space.xl,
    right: space.xl,
    bottom: space.xxl,
    flexDirection: "row",
    borderRadius: radii.full,
    backgroundColor: surface.surfacePrimary,
    padding: space.sm,
    gap: space.sm,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
    paddingVertical: space.md,
    gap: space.xs,
  },
  itemActive: {
    backgroundColor: surface.surfaceAccent,
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
