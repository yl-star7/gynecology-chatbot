// @ts-nocheck
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { palette } from "../theme";

export function PlaceholderScreen(props: { title: string; description: string }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>준비 중</Text>
        <Text style={styles.title}>{props.title}</Text>
        <Text style={styles.description}>{props.description}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
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
