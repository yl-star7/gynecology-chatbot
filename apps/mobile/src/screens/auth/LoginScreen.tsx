// @ts-nocheck
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  BrandMark,
  Button,
  Card,
  KeyboardScreen,
  LabeledInput,
} from "../../components/ui";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { palette, space, typo } from "../../theme";

export function LoginScreen() {
  const { requestVerificationCode, signIn } = useMobileAppSession();
  const [phoneNumber, setPhoneNumber] = useState(__DEV__ ? "01012345678" : "");
  const [verificationCode, setVerificationCode] = useState(
    __DEV__ ? "000000" : "",
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasRequestedCode, setHasRequestedCode] = useState(false);

  const isBypassPhoneNumber = useMemo(
    () => __DEV__ && phoneNumber.trim() === "01026784241",
    [phoneNumber],
  );

  async function handleRequestCode() {
    try {
      if (isBypassPhoneNumber) {
        setVerificationCode("000000");
        setHasRequestedCode(true);
        setStatusMessage("테스트 번호 확인을 마쳤어요. 바로 시작할 수 있어요.");
        setError(null);
        return;
      }

      await requestVerificationCode({ phoneNumber });
      setHasRequestedCode(true);
      setStatusMessage("인증번호를 보냈어요.");
      setError(null);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "인증번호 발송에 실패했어요.",
      );
    }
  }

  async function handleLogin() {
    if (!hasRequestedCode) {
      setError("먼저 인증번호 받기를 눌러주세요.");
      return;
    }

    if (!verificationCode.trim()) {
      setError("인증번호를 입력해 주세요.");
      return;
    }

    try {
      const user = await signIn({ phoneNumber, verificationCode });
      router.replace(user.hasCompletedOnboarding ? "/home" : "/onboarding");
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "로그인에 실패했어요.",
      );
    }
  }

  return (
    <KeyboardScreen centered>
      <View style={styles.brandBlock}>
        <BrandMark
          centered
          subtitle="산모와 아기를 위한 다정한 상담"
          size={68}
        />
      </View>
      <Card>
        <View style={styles.form}>
          <LabeledInput
            label="전화번호"
            value={phoneNumber}
            onChangeText={(next) => {
              setPhoneNumber(next);
              setHasRequestedCode(false);
              setStatusMessage(null);
              setError(null);
            }}
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
          {statusMessage && !error ? (
            <Text style={styles.status}>{statusMessage}</Text>
          ) : null}
          <Button
            label="인증번호 받기"
            variant="secondary"
            onPress={handleRequestCode}
          />
          <Button label="시작하기" onPress={handleLogin} />
        </View>
      </Card>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  brandBlock: {
    marginBottom: space.lg,
  },
  form: { gap: space.lg },
  error: { ...typo.caption, color: palette.errorText, textAlign: "center" },
  status: { ...typo.caption, color: palette.accent, textAlign: "center" },
});
