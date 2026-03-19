// @ts-nocheck
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { palette, patientSurfacePalette as surface } from "../../theme";

export function LoginScreen() {
  const { requestVerificationCode, signIn } = useMobileAppSession();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRequestCode() {
    try {
      await requestVerificationCode({ phoneNumber });
      setStatusMessage("인증 코드를 보냈습니다.");
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "코드 발송에 실패했습니다.");
    }
  }

  async function handleLogin() {
    try {
      const user = await signIn({ phoneNumber, verificationCode });
      router.replace(user.hasCompletedOnboarding ? "/home" : "/onboarding");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "로그인에 실패했습니다.");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Login</Text>
          <Text style={styles.title}>전화번호 문자 인증으로 로그인</Text>
          <Text style={styles.description}>
            {error ??
              statusMessage ??
              "최초 1회 인증 이후에는 1년 세션을 기준으로 이어서 사용합니다."}
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.form}>
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="전화번호"
              placeholderTextColor={surface.textSecondary}
              style={styles.input}
              keyboardType="phone-pad"
            />
            <TextInput
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder="인증 코드"
              placeholderTextColor={surface.textSecondary}
              style={styles.input}
              keyboardType="number-pad"
            />
            <Pressable style={styles.secondaryButton} onPress={handleRequestCode}>
              <Text style={styles.secondaryButtonLabel}>인증 코드 보내기</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={handleLogin}>
              <Text style={styles.primaryButtonLabel}>인증하고 로그인</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: surface.pageBackground },
  container: { flex: 1, padding: 24, justifyContent: "center" },
  heroCard: {
    borderRadius: 24,
    backgroundColor: surface.surfacePrimary,
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
    padding: 20,
  },
  eyebrow: { fontSize: 12, fontWeight: "700", color: palette.accent, textTransform: "uppercase", letterSpacing: 1 },
  title: { marginTop: 10, fontSize: 30, fontWeight: "700", color: surface.textPrimary },
  description: { marginTop: 12, fontSize: 15, lineHeight: 22, color: surface.textSecondary },
  formCard: {
    marginTop: 16,
    borderRadius: 24,
    backgroundColor: surface.surfacePrimary,
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
    padding: 18,
  },
  form: { gap: 12 },
  input: {
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: surface.fieldSurface,
    color: surface.textPrimary,
  },
  primaryButton: {
    marginTop: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: surface.accentSolid,
    paddingVertical: 15,
  },
  primaryButtonLabel: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: surface.accentSolid,
    backgroundColor: surface.surfacePrimary,
    paddingVertical: 15,
  },
  secondaryButtonLabel: { color: surface.accentSolid, fontSize: 15, fontWeight: "700" },
});
