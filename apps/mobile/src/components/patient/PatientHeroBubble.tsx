// @ts-nocheck
import { StyleSheet, Text, View } from "react-native";
import { Card } from "../ui";
import { radii, space, typo } from "../../theme";
import { useMobileTheme } from "../../theme-provider";

export function PatientHeroBubble({
  message,
  name,
}: {
  message: string;
  name: string;
}) {
  const { palette, surface } = useMobileTheme();

  return (
    <View style={styles.wrapper}>
      <Card style={[styles.bubble, { backgroundColor: palette.accent }]}>
        <Text style={[styles.bubbleLabel, { color: surface.surfacePrimary }]}>
          {name}의 한마디
        </Text>
        <Text style={[styles.message, { color: surface.surfacePrimary }]}>
          {message}
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
  },
  bubble: {
    width: "90%",
    borderRadius: radii.xxl,
    paddingVertical: space.lg,
  },
  bubbleLabel: {
    ...typo.caption,
    opacity: 0.85,
  },
  message: {
    marginTop: space.sm,
    ...typo.body,
  },
});
