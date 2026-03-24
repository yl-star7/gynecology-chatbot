// @ts-nocheck
import { StyleSheet, Text, View } from "react-native";
import { Card } from "../ui";
import { palette, radii, space, typo } from "../../theme";

export function PatientHeroBubble({
  message,
  name,
}: {
  message: string;
  name: string;
}) {
  return (
    <View style={styles.wrapper}>
      <Card style={styles.bubble}>
        <Text style={styles.bubbleLabel}>{name}의 한마디</Text>
        <Text style={styles.message}>{message}</Text>
      </Card>
      <View style={styles.tailWrap}>
        <View style={styles.tail} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "flex-end",
    paddingRight: space.sm,
  },
  bubble: {
    width: "90%",
    backgroundColor: palette.accent,
    borderRadius: 28,
    paddingVertical: space.lg,
  },
  bubbleLabel: {
    ...typo.caption,
    color: "#ffffff",
    opacity: 0.85,
  },
  message: {
    marginTop: space.sm,
    ...typo.body,
    color: "#ffffff",
  },
  tailWrap: {
    width: "90%",
    alignItems: "center",
    marginTop: -2,
  },
  tail: {
    width: 20,
    height: 20,
    backgroundColor: palette.accent,
    borderBottomLeftRadius: radii.sm,
    transform: [{ rotate: "45deg" }],
  },
});
