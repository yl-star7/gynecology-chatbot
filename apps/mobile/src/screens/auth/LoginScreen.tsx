// @ts-nocheck
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { palette } from "../../theme";

export function LoginScreen() {
  const { signIn } = useMobileAppSession();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    try {
      const user = await signIn({ phoneNumber, password });
      router.replace(user.hasCompletedOnboarding ? "/home" : "/onboarding");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "로그인에 실패했습니다.");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>Login</Text>
        <Text style={styles.title}>전화번호와 비밀번호로 로그인</Text>
        <Text style={styles.description}>{error ?? "최초 1회 인증 이후에는 전화번호를 ID로 사용합니다."}</Text>

        <View style={styles.form}>
          <TextInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="전화번호"
            placeholderTextColor={palette.subInk}
            style={styles.input}
            keyboardType="phone-pad"
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="비밀번호"
            placeholderTextColor={palette.subInk}
            style={styles.input}
            secureTextEntry
          />
          <Pressable style={styles.primaryButton} onPress={handleLogin}>
            <Text style={styles.primaryButtonLabel}>로그인</Text>
          </Pressable>
        </View>

        <View style={styles.linkRow}>
          <Pressable onPress={() => router.push("/auth/set-password")}>
            <Text style={styles.linkLabel}>최초 비밀번호 설정</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/auth/reset-password")}>
            <Text style={styles.linkLabel}>비밀번호 재설정</Text>
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
  linkRow: { marginTop: 18, gap: 10 },
  linkLabel: { color: palette.accent, fontSize: 14, fontWeight: "600" },
});
