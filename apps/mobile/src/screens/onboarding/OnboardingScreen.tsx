// @ts-nocheck
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, Card, KeyboardScreen, LabeledInput, Pressable } from "../../components/ui";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { palette, patientSurfacePalette as surface, radii, space, typo } from "../../theme";

const TONE_OPTIONS = ["차분하게", "친근하게", "전문적으로", "다정하게"];

export function OnboardingScreen() {
  const { completeOnboarding } = useMobileAppSession();
  const [step, setStep] = useState(0);
  const [inputMode, setInputMode] = useState<"week" | "dueDate" | null>(null);
  const [weekNumber, setWeekNumber] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [babyNickname, setBabyNickname] = useState("");
  const [tonePreference, setTonePreference] = useState("");
  const [error, setError] = useState<string | null>(null);

  function next() {
    if (step === 0) {
      if (inputMode === "week" && !weekNumber.trim()) {
        setError("주차를 입력해주세요.");
        return;
      }
      if (inputMode === "dueDate" && !dueDate.trim()) {
        setError("예정일을 입력해주세요.");
        return;
      }
      if (!inputMode) {
        setError("주차 또는 예정일 중 하나를 선택해주세요.");
        return;
      }
    }
    setError(null);
    setStep((s) => s + 1);
  }

  async function handleComplete() {
    try {
      const pregnancyInfo = inputMode === "week" ? `${weekNumber.trim()}주` : dueDate.trim();
      const notes = babyNickname.trim() ? `태명: ${babyNickname.trim()}` : "";
      await completeOnboarding({
        pregnancyWeekOrDueDate: [pregnancyInfo, notes].filter(Boolean).join(" / "),
        tonePreference: tonePreference || "친근하게",
      });
      router.replace("/home");
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했어요.");
    }
  }

  const progress = ((step + 1) / 3) * 100;

  return (
    <KeyboardScreen>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {step === 0 && (
        <Card>
          <Text style={styles.question}>임신 정보를 알려주세요</Text>

          <View style={styles.modeRow}>
            <Pressable
              style={[styles.modeChip, inputMode === "week" && styles.modeChipActive]}
              onPress={() => { setInputMode("week"); setError(null); }}
            >
              <Text style={[styles.modeLabel, inputMode === "week" && styles.modeLabelActive]}>주차로 입력</Text>
            </Pressable>
            <Pressable
              style={[styles.modeChip, inputMode === "dueDate" && styles.modeChipActive]}
              onPress={() => { setInputMode("dueDate"); setError(null); }}
            >
              <Text style={[styles.modeLabel, inputMode === "dueDate" && styles.modeLabelActive]}>예정일로 입력</Text>
            </Pressable>
          </View>

          {inputMode === "week" && (
            <View style={styles.field}>
              <LabeledInput
                label="현재 주차"
                value={weekNumber}
                onChangeText={setWeekNumber}
                placeholder="예: 16"
                keyboardType="number-pad"
                returnKeyType="next"
                onSubmitEditing={next}
              />
            </View>
          )}

          {inputMode === "dueDate" && (
            <View style={styles.field}>
              <LabeledInput
                label="출산 예정일"
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="예: 2026-08-01"
                returnKeyType="next"
                onSubmitEditing={next}
              />
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {inputMode ? <Button label="다음" onPress={next} /> : null}
        </Card>
      )}

      {step === 1 && (
        <Card>
          <Text style={styles.question}>태명을 지어주세요</Text>
          <Text style={styles.hint}>아직 없다면 건너뛰어도 돼요</Text>
          <View style={styles.field}>
            <LabeledInput
              label=""
              value={babyNickname}
              onChangeText={setBabyNickname}
              placeholder="예: 콩이, 달이"
              returnKeyType="next"
              onSubmitEditing={() => { setError(null); setStep(2); }}
            />
          </View>
          <View style={styles.row}>
            <View style={styles.half}><Button label="이전" variant="secondary" onPress={() => setStep(0)} /></View>
            <View style={styles.half}><Button label={babyNickname.trim() ? "다음" : "건너뛰기"} onPress={() => { setError(null); setStep(2); }} /></View>
          </View>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <Text style={styles.question}>어떤 분위기가 좋아요?</Text>
          <View style={styles.toneGrid}>
            {TONE_OPTIONS.map((tone) => (
              <Pressable
                key={tone}
                style={[styles.toneChip, tonePreference === tone && styles.toneChipActive]}
                onPress={() => setTonePreference(tone)}
              >
                <Text style={[styles.toneLabel, tonePreference === tone && styles.toneLabelActive]}>{tone}</Text>
              </Pressable>
            ))}
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.row}>
            <View style={styles.half}><Button label="이전" variant="secondary" onPress={() => setStep(1)} /></View>
            <View style={styles.half}><Button label="시작하기" onPress={handleComplete} /></View>
          </View>
        </Card>
      )}
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  progressBar: { height: 4, borderRadius: 2, backgroundColor: surface.strokeSubtle, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2, backgroundColor: palette.accent },
  question: { fontSize: 22, fontWeight: "700", color: surface.textPrimary },
  hint: { marginTop: space.xs, ...typo.caption, color: surface.textSecondary },
  field: { marginTop: space.lg },
  error: { marginTop: space.sm, ...typo.caption, color: palette.errorText },
  modeRow: { flexDirection: "row", gap: space.sm, marginTop: space.lg },
  modeChip: { flex: 1, paddingVertical: space.md, borderRadius: radii.md, borderWidth: 1.5, borderColor: surface.strokeSubtle, alignItems: "center" },
  modeChipActive: { borderColor: palette.accent, backgroundColor: surface.surfaceAccent },
  modeLabel: { ...typo.body, fontWeight: "600", color: surface.textSecondary },
  modeLabelActive: { color: palette.accent },
  row: { flexDirection: "row", gap: space.md, marginTop: space.sm },
  half: { flex: 1 },
  toneGrid: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: space.lg, marginBottom: space.sm },
  toneChip: { paddingHorizontal: space.lg, paddingVertical: space.md, borderRadius: radii.lg, borderWidth: 1, borderColor: surface.strokeSubtle },
  toneChipActive: { borderColor: palette.accent, backgroundColor: surface.surfaceAccent },
  toneLabel: { ...typo.body, color: surface.textSecondary },
  toneLabelActive: { color: palette.accent, fontWeight: "600" },
});
