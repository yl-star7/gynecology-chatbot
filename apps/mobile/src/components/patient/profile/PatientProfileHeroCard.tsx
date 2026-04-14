import { Ionicons } from "@expo/vector-icons";
import type { ComponentType } from "react";
import type { ImageSourcePropType } from "react-native";
import { Image, StyleSheet, Text, View } from "react-native";
import { Card, Pressable } from "../../ui";
import {
  patientSurfacePalette as surface,
  radii,
  space,
  typo,
} from "../../../theme";

const SettingsIcon = Ionicons as unknown as ComponentType<{
  name: "settings-outline";
  size: number;
  color: string;
}>;

export function PatientProfileHeroCard({
  babyImageSource,
  babyName,
  description,
  dueDateText,
  onPressSettings,
}: {
  babyImageSource: ImageSourcePropType;
  babyName: string;
  description: string;
  dueDateText: string;
  onPressSettings: () => void;
}) {
  return (
    <Card style={styles.heroCard}>
      <Pressable
        style={styles.heroSettingsButton}
        onPress={onPressSettings}
        accessibilityLabel="정보 설정 열기"
      >
        <SettingsIcon
          name="settings-outline"
          size={space.lg + space.sm}
          color={surface.textPrimary}
        />
      </Pressable>
      <View style={styles.heroRow}>
        <View style={styles.avatarCircle}>
          <Image
            source={babyImageSource}
            style={styles.avatarImage}
            resizeMode="cover"
          />
        </View>
        <View style={styles.heroText}>
          <Text style={styles.title}>{babyName}</Text>
          <Text style={styles.description}>{description}</Text>
          <Text style={styles.heroMeta}>{dueDateText}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    paddingVertical: space.xl,
    position: "relative",
  },
  heroSettingsButton: {
    position: "absolute",
    top: space.md,
    right: space.md,
    width: space.xxxl + space.md,
    height: space.xxxl + space.md,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: surface.surfaceSecondary,
    zIndex: 1,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.lg,
  },
  avatarCircle: {
    width: space.xxxl * 2 + space.xl,
    height: space.xxxl * 2 + space.xl,
    borderRadius: radii.full,
    backgroundColor: surface.fieldSurface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  heroText: {
    flex: 1,
  },
  title: {
    ...typo.titleMd,
    color: surface.textPrimary,
  },
  description: {
    marginTop: space.xs,
    ...typo.body,
    color: surface.textSecondary,
  },
  heroMeta: {
    marginTop: space.sm,
    ...typo.caption,
    color: surface.textSecondary,
  },
});
