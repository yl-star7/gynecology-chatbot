// @ts-nocheck
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { palette } from "../../theme";

export function OnboardingScreen() {
  const { completeOnboarding } = useMobileAppSession();
  const [pregnancyWeekOrDueDate, setPregnancyWeekOrDueDate] = useState("");
  const [tonePreference, setTonePreference] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleComplete() {
    try {
      await completeOnboarding({ pregnancyWeekOrDueDate, tonePreference });
      router.replace("/(tabs)/home");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "온보딩 저장에 실패했습니다.");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>Onboarding</Text>
        <Text style={styles.title}>임신 정보와 채팅 톤 설정</Text>
        <Text style={styles.description}>{error ?? "임신 주차, 예정일, 채팅 톤 선호를 최소값으로 수집하는 초기 화면입니다."}</Text>

        <View style={styles.form}>
          <TextInput
            value={pregnancyWeekOrDueDate}
            onChangeText={setPregnancyWeekOrDueDate}
            placeholder="임신 주차 또는 예정일"
            placeholderTextColor={palette.subInk}
            style={styles.input}
          />
          <TextInput
            value={tonePreference}
            onChangeText={setTonePreference}
            placeholder="채팅 톤 선호"
            placeholderTextColor={palette.subInk}
            style={styles.input}
          />
          <Pressable style={styles.primaryButton} onPress={handleComplete}>
            <Text style={styles.primaryButtonLabel}>온보딩 완료</Text>
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
