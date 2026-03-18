// @ts-nocheck
import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <Text style={styles.label}>index probe</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  label: {
    margin: 24,
    fontSize: 24,
    color: "#111111",
  },
});
