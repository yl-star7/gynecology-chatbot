// @ts-nocheck
import { StyleSheet, Text, View } from "react-native";
import { Card } from "../ui";
import { palette, space, typo } from "../../theme";

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
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
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
});
