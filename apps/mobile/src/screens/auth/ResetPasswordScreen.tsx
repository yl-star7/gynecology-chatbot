// @ts-nocheck
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { palette } from "../../theme";

export function ResetPasswordScreen() {
  const [message] = useState(
    "세션이 만료되면 같은 전화번호로 인증 코드를 다시 받아 로그인하면 됩니다.",
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>Notice</Text>
        <Text style={styles.title}>비밀번호 재설정 없음</Text>
        <Text style={styles.description}>{message}</Text>

        <View style={styles.form}>
          <Pressable style={styles.primaryButton} onPress={() => router.replace("/auth/login")}>
            <Text style={styles.primaryButtonLabel}>로그인 화면으로 이동</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.background },
  container: { flex: 1, padding: 24, justifyContent: "center" },
  eyebrow: { fontSize: 12, fontWeight: "700", color: palette.accent, textTransform: "uppercase", letterSpacing: 1 },
  title: { marginTop: 10, fontSize: 30, fontWeight: "700", color: palette.ink },
  description: { marginTop: 12, fontSize: 15, lineHeight: 22, color: palette.subInk },
  form: { marginTop: 24, gap: 12 },
  input: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    color: palette.ink,
  },
  primaryButton: {
    marginTop: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: palette.accent,
    paddingVertical: 15,
  },
  primaryButtonLabel: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
});
