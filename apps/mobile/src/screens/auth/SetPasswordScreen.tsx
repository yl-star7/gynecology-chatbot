// @ts-nocheck
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { palette } from "../../theme";

export function SetPasswordScreen() {
  const { setPassword } = useMobileAppSession();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPasswordValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    try {
      await setPassword({ phoneNumber, verificationCode, password });
      router.replace("/auth/login");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "비밀번호 저장에 실패했습니다.");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>Set Password</Text>
        <Text style={styles.title}>최초 비밀번호 설정</Text>
        <Text style={styles.description}>{error ?? "휴대폰 본인인증 이후 비밀번호를 등록하는 화면입니다."}</Text>

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
            value={verificationCode}
            onChangeText={setVerificationCode}
            placeholder="인증 코드"
            placeholderTextColor={palette.subInk}
            style={styles.input}
            keyboardType="number-pad"
          />
          <TextInput
            value={password}
            onChangeText={setPasswordValue}
            placeholder="새 비밀번호"
            placeholderTextColor={palette.subInk}
            style={styles.input}
            secureTextEntry
          />
          <Pressable style={styles.primaryButton} onPress={handleSubmit}>
            <Text style={styles.primaryButtonLabel}>비밀번호 저장</Text>
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
