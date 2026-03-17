// @ts-nocheck
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { palette } from "../../theme";

export function ResetPasswordScreen() {
  const { requestPasswordReset } = useMobileAppSession();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit() {
    await requestPasswordReset({ phoneNumber });
    setMessage("재설정 요청을 접수했습니다. 운영자 확인 후 안내됩니다.");
    router.replace("/auth/login");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>Reset Password</Text>
        <Text style={styles.title}>비밀번호 재설정</Text>
        <Text style={styles.description}>{message ?? "전화번호 기준으로 재설정 요청을 시작하는 화면입니다."}</Text>

        <View style={styles.form}>
          <TextInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="전화번호"
            placeholderTextColor={palette.subInk}
            style={styles.input}
            keyboardType="phone-pad"
          />
          <Pressable style={styles.primaryButton} onPress={handleSubmit}>
            <Text style={styles.primaryButtonLabel}>재설정 요청</Text>
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
