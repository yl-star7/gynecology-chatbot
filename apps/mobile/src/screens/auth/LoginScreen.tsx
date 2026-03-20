// @ts-nocheck
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Card, HeroSection, KeyboardScreen, LabeledInput } from "../../components/ui";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { space } from "../../theme";

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
      <HeroSection
        eyebrow="본인 확인"
        title={`전화번호로\n간편하게 시작해요`}
        description={error ?? statusMessage ?? "한 번 인증하면 앱을 다시 열 때 자동으로 로그인돼요."}
      />

      <Card>
        <View style={styles.form}>
          <LabeledInput
            label="전화번호"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="010-0000-0000"
            keyboardType="phone-pad"
          />
          <LabeledInput
            label="인증번호"
            value={verificationCode}
            onChangeText={setVerificationCode}
            placeholder="6자리 숫자"
            keyboardType="number-pad"
          />
          <Button label="인증번호 받기" variant="secondary" onPress={handleRequestCode} />
          <Button label="시작하기" onPress={handleLogin} />
        </View>
      </Card>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.lg },
});
