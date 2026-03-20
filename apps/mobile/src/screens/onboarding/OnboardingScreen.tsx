// @ts-nocheck
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button, Card, HeroSection, KeyboardScreen, LabeledInput } from "../../components/ui";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { palette, patientSurfacePalette as surface, radii, space, typo } from "../../theme";

const TONE_OPTIONS = ["차분하게", "친근하게", "전문적으로", "다정하게"];

export function OnboardingScreen() {
  const { completeOnboarding } = useMobileAppSession();
  const [step, setStep] = useState(0);
  const [pregnancyWeekOrDueDate, setPregnancyWeekOrDueDate] = useState("");
  const [babyNickname, setBabyNickname] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [tonePreference, setTonePreference] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleNext() {
    if (step === 1 && !pregnancyWeekOrDueDate.trim()) {
      setError("현재 주차나 예정일을 알려주세요.");
      return;
    }
    setError(null);
    setStep((prev) => prev + 1);
  }

  async function handleComplete() {
    try {
      const notes = [
        babyNickname.trim() ? `태명: ${babyNickname.trim()}` : null,
        hospitalName.trim() ? `병원: ${hospitalName.trim()}` : null,
      ].filter(Boolean).join(" / ");

      await completeOnboarding({
        pregnancyWeekOrDueDate: [pregnancyWeekOrDueDate.trim(), notes].filter(Boolean).join(" / "),
        tonePreference: tonePreference || "친근하게",
      });
      router.replace("/home");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "저장에 실패했어요. 다시 시도해주세요.");
    }
  }

  return (
    <KeyboardScreen centered>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((step + 1) / 4) * 100}%` }]} />
      </View>

      {step === 0 && (
        <>
          <HeroSection
            eyebrow="4단계 중 1단계"
            title="반가워요!"
            description="앞으로 임신 기간 동안 함께할게요."
          />
          <Button label="시작하기" onPress={handleNext} />
        </>
      )}

      {step === 1 && (
        <>
          <HeroSection
            eyebrow="4단계 중 2단계"
            title="지금 몇 주차예요?"
          />
          <Card>
            <View style={styles.form}>
              <LabeledInput
                label="현재 주차 또는 출산 예정일"
                value={pregnancyWeekOrDueDate}
                onChangeText={setPregnancyWeekOrDueDate}
                placeholder="예: 16주 또는 2026-08-01"
              />
              <LabeledInput
                label="다니고 계신 병원 (선택)"
                value={hospitalName}
                onChangeText={setHospitalName}
                placeholder="예: OO산부인과"
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={styles.buttonRow}>
                <Button label="이전" variant="secondary" onPress={() => setStep(0)} />
                <Button label="다음" onPress={handleNext} />
              </View>
            </View>
          </Card>
        </>
      )}

      {step === 2 && (
        <>
          <HeroSection
            eyebrow="4단계 중 3단계"
            title="아기 태명을 지어주세요"
            description="아직 정하지 않았다면 건너뛰어도 돼요."
          />
          <Card>
            <View style={styles.form}>
              <LabeledInput
                label="태명"
                value={babyNickname}
                onChangeText={setBabyNickname}
                placeholder="예: 콩이, 달이, 뽀미"
              />
              <View style={styles.buttonRow}>
                <Button label="이전" variant="secondary" onPress={() => setStep(1)} />
                <Button label={babyNickname.trim() ? "다음" : "건너뛰기"} onPress={() => setStep(3)} />
              </View>
            </View>
          </Card>
        </>
      )}

      {step === 3 && (
        <>
          <HeroSection
            eyebrow="4단계 중 4단계"
            title="상담 분위기를 골라주세요"
          />
          <Card>
            <View style={styles.form}>
              <View style={styles.toneGrid}>
                {TONE_OPTIONS.map((tone) => (
                  <Pressable
                    key={tone}
                    style={[styles.toneChip, tonePreference === tone && styles.toneChipActive]}
                    onPress={() => setTonePreference(tone)}
                  >
                    <Text style={[styles.toneLabel, tonePreference === tone && styles.toneLabelActive]}>
                      {tone}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={styles.buttonRow}>
                <Button label="이전" variant="secondary" onPress={() => setStep(2)} />
                <Button label="시작하기" onPress={handleComplete} />
              </View>
            </View>
          </Card>
        </>
      )}
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: surface.strokeSubtle,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: palette.accent,
  },
  form: {
    gap: space.lg,
  },
  buttonRow: {
    flexDirection: "row",
    gap: space.md,
  },
  toneGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
  },
  toneChip: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
  },
  toneChipActive: {
    borderColor: palette.accent,
    backgroundColor: surface.surfaceAccent,
  },
  toneLabel: {
    ...typo.body,
    color: surface.textSecondary,
  },
  toneLabelActive: {
    color: palette.accent,
    fontWeight: "600",
  },
  error: {
    ...typo.caption,
    color: palette.errorText,
  },
});
