// @ts-nocheck
import { StyleSheet, Text, View } from "react-native";
import { MobileScreenFrame } from "../components/MobileScreenFrame";
import { palette } from "../theme";

export function PlaceholderScreen(props: { title: string; description: string }) {
  return (
    <MobileScreenFrame title={props.title} showProfileButton showChatFab>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>준비 중</Text>
        <Text style={styles.title}>{props.title}</Text>
        <Text style={styles.description}>{props.description}</Text>
      </View>
    </MobileScreenFrame>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.accent,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    marginTop: 10,
    fontSize: 32,
    fontWeight: "700",
    color: palette.ink,
  },
  description: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    color: palette.subInk,
  },
});
