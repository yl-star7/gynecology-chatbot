// @ts-nocheck
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, Card, KeyboardScreen, LabeledInput } from "../../components/ui";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { palette, patientSurfacePalette as surface, space, typo } from "../../theme";

export function LoginScreen() {
  const { requestVerificationCode, signIn } = useMobileAppSession();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRequestCode() {
    try {
      await requestVerificationCode({ phoneNumber });
      setStatusMessage("인증번호를 보냈어요.");
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "인증번호 발송에 실패했어요.");
    }
  }

  async function handleLogin() {
    try {
      const user = await signIn({ phoneNumber, verificationCode });
      router.replace(user.hasCompletedOnboarding ? "/home" : "/onboarding");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "로그인에 실패했어요.");
    }
  }

  return (
    <KeyboardScreen centered>
      <Card>
        <View style={styles.form}>
          <LabeledInput
            label="전화번호"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="01012345678"
            keyboardType="phone-pad"
            returnKeyType="next"
          />
          <LabeledInput
            label="인증번호"
            value={verificationCode}
            onChangeText={setVerificationCode}
            placeholder="6자리 숫자"
            keyboardType="number-pad"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {statusMessage && !error ? <Text style={styles.status}>{statusMessage}</Text> : null}
          <Button label="인증번호 받기" variant="secondary" onPress={handleRequestCode} />
          <Button label="시작하기" onPress={handleLogin} />
        </View>
      </Card>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.lg },
  error: { ...typo.caption, color: palette.errorText, textAlign: "center" },
  status: { ...typo.caption, color: palette.accent, textAlign: "center" },
});
