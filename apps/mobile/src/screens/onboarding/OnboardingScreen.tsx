// @ts-nocheck
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, Card, HeroSection, KeyboardScreen, LabeledInput } from "../../components/ui";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { palette, patientSurfacePalette as surface, space, typo } from "../../theme";

export function OnboardingScreen() {
  const { completeOnboarding } = useMobileAppSession();
  const [step, setStep] = useState(0);
  const [pregnancyWeekOrDueDate, setPregnancyWeekOrDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleComplete() {
    if (!pregnancyWeekOrDueDate.trim()) {
      setError("현재 주차나 예정일을 알려주세요.");
      return;
    }

    try {
      await completeOnboarding({
        pregnancyWeekOrDueDate: pregnancyWeekOrDueDate.trim(),
        tonePreference: "친근하게",
      });
      router.replace("/home");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "저장에 실패했어요. 다시 시도해주세요.");
    }
  }

  return (
    <KeyboardScreen centered>
      {step === 0 && (
        <>
          <HeroSection
            title="반가워요!"
            description="앞으로 임신 기간 동안 함께할게요. 태명, 병원 같은 정보는 나중에 대화하면서 알려주셔도 돼요."
          />
          <Button label="시작하기" onPress={() => setStep(1)} />
        </>
      )}

      {step === 1 && (
        <>
          <HeroSection
            title="지금 몇 주차예요?"
            description="이것만 알려주시면 바로 시작할 수 있어요."
          />
          <Card>
            <View style={styles.form}>
              <LabeledInput
                label="현재 주차 또는 출산 예정일"
                value={pregnancyWeekOrDueDate}
                onChangeText={setPregnancyWeekOrDueDate}
                placeholder="예: 16주 또는 2026-08-01"
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button label="상담 시작하기" onPress={handleComplete} />
            </View>
          </Card>
        </>
      )}
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: space.lg,
  },
  error: {
    ...typo.caption,
    color: palette.errorText,
  },
});
