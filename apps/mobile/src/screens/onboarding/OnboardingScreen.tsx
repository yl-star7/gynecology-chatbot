// @ts-nocheck
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Card, HeroSection, KeyboardScreen, LabeledInput } from "../../components/ui";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { space } from "../../theme";

export function OnboardingScreen() {
  const { completeOnboarding } = useMobileAppSession();
  const [pregnancyWeekOrDueDate, setPregnancyWeekOrDueDate] = useState("");
  const [tonePreference, setTonePreference] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleComplete() {
    try {
      await completeOnboarding({ pregnancyWeekOrDueDate, tonePreference });
      router.replace("/home");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "저장에 실패했어요. 다시 시도해주세요.");
    }
  }

  return (
    <KeyboardScreen centered>
      <HeroSection
        eyebrow="반가워요"
        title={`몇 가지만\n알려주세요`}
        description={error ?? "더 정확하고 따뜻한 상담을 위해 기본 정보를 입력해 주세요."}
      />

      <Card>
        <View style={styles.form}>
          <LabeledInput
            label="출산 예정일 또는 현재 주차"
            value={pregnancyWeekOrDueDate}
            onChangeText={setPregnancyWeekOrDueDate}
            placeholder="예: 2026-08-01 또는 16주"
          />
          <LabeledInput
            label="원하는 상담 분위기"
            value={tonePreference}
            onChangeText={setTonePreference}
            placeholder="예: 차분하게, 친근하게"
          />
          <Button label="설정 완료" onPress={handleComplete} />
        </View>
      </Card>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.lg },
});
