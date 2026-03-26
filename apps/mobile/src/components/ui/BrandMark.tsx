import { Image, StyleSheet, Text, View } from "react-native";

import { palette, space, typo } from "../../theme";

const BRAND_MARK_SOURCE = require("../../../assets/branding/app-mark.png");

export function BrandMark({
  subtitle,
  centered = false,
  size = 56,
}: {
  subtitle?: string;
  centered?: boolean;
  size?: number;
}) {
  return (
    <View style={[styles.container, centered ? styles.centered : null]}>
      <Image
        source={BRAND_MARK_SOURCE}
        style={{ width: size, height: size, borderRadius: size * 0.22 }}
      />
      <View style={centered ? styles.textCentered : null}>
        <Text style={styles.title}>아가야</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  centered: {
    justifyContent: "center",
  },
  textCentered: {
    alignItems: "center",
  },
  title: {
    ...typo.titleSm,
    color: palette.ink,
  },
  subtitle: {
    marginTop: 2,
    ...typo.caption,
    color: palette.subInk,
  },
});
