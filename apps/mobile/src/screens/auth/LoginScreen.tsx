// @ts-nocheck
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  buildInitialLoginFormState,
  isDevelopmentAutoVerifiedPhoneNumber,
  resolvePostLoginHref,
  shouldAllowDevelopmentLoginBypass,
} from "./LoginScreen.model";

export function LoginScreen() {
  const router = useRouter();
  const { requestVerificationCode, signIn } = useMobileAppSession();
  const allowDevelopmentBypass = shouldAllowDevelopmentLoginBypass(
    __DEV__,
    process.env.EXPO_PUBLIC_API_BASE_URL,
  );
  const initialFormState = buildInitialLoginFormState(allowDevelopmentBypass);
  const [phoneNumber, setPhoneNumber] = useState(initialFormState.phoneNumber);
  const [verificationCode, setVerificationCode] = useState(
    initialFormState.verificationCode,
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasRequestedCode, setHasRequestedCode] = useState(
    initialFormState.hasRequestedCode,
  );
  const [isSigningIn, setIsSigningIn] = useState(false);
  const signInInFlightRef = useRef(false);

  const isBypassPhoneNumber = useMemo(
    () =>
      allowDevelopmentBypass &&
      isDevelopmentAutoVerifiedPhoneNumber(phoneNumber),
    [allowDevelopmentBypass, phoneNumber],
  );

  const autoLoginFiredRef = useRef(false);
  useEffect(() => {
    if (
      isBypassPhoneNumber &&
      hasRequestedCode &&
      verificationCode.trim() &&
      !autoLoginFiredRef.current
    ) {
      autoLoginFiredRef.current = true;
      handleLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBypassPhoneNumber, hasRequestedCode, verificationCode]);

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
    if (signInInFlightRef.current) {
      return;
    }

    if (!hasRequestedCode) {
      setError("먼저 인증번호 받기를 눌러주세요.");
      return;
    }

    if (!verificationCode.trim()) {
      setError("인증번호를 입력해 주세요.");
      return;
    }

    try {
      signInInFlightRef.current = true;
      setIsSigningIn(true);
      const user = await signIn({ phoneNumber, verificationCode });
      router.replace(resolvePostLoginHref(user));
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "로그인에 실패했어요.",
      );
    } finally {
      signInInFlightRef.current = false;
      setIsSigningIn(false);
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
              setHasRequestedCode(
                allowDevelopmentBypass &&
                  isDevelopmentAutoVerifiedPhoneNumber(next),
              );
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
            disabled={isSigningIn}
          />
          <Button
            label="시작하기"
            onPress={handleLogin}
            disabled={isSigningIn}
          />
          {allowDevelopmentBypass ? (
            <Button
              label="개발자 자동 로그인 (01012345678)"
              variant="secondary"
              disabled={isSigningIn}
              onPress={async () => {
                if (signInInFlightRef.current) {
                  return;
                }

                setError(null);
                setStatusMessage("테스트 계정으로 로그인하는 중이에요.");
                setPhoneNumber("01012345678");
                setVerificationCode("000000");
                setHasRequestedCode(true);
                try {
                  signInInFlightRef.current = true;
                  setIsSigningIn(true);
                  const user = await signIn({
                    phoneNumber: "01012345678",
                    verificationCode: "000000",
                  });
                  router.replace(resolvePostLoginHref(user));
                } catch (nextError) {
                  setStatusMessage(null);
                  setError(
                    nextError instanceof Error
                      ? nextError.message
                      : "자동 로그인에 실패했어요.",
                  );
                } finally {
                  signInInFlightRef.current = false;
                  setIsSigningIn(false);
                }
              }}
            />
          ) : null}
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
