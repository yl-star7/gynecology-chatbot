// @ts-nocheck
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { palette, patientSurfacePalette as surface } from "../../theme";

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
      setError(nextError instanceof Error ? nextError.message : "온보딩 저장에 실패했습니다.");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <View style={styles.heroCard}>
              <Text style={styles.eyebrow}>Onboarding</Text>
              <Text style={styles.title}>임신 정보와 채팅 톤 설정</Text>
              <Text style={styles.description}>
                {error ??
                  "임신 주차, 예정일, 채팅 톤 선호를 최소값으로 수집하는 초기 화면입니다."}
              </Text>
            </View>

            <View style={styles.formCard}>
              <View style={styles.form}>
                <TextInput
                  value={pregnancyWeekOrDueDate}
                  onChangeText={setPregnancyWeekOrDueDate}
                  placeholder="임신 주차 또는 예정일"
                  placeholderTextColor={surface.textSecondary}
                  style={styles.input}
                />
                <TextInput
                  value={tonePreference}
                  onChangeText={setTonePreference}
                  placeholder="채팅 톤 선호"
                  placeholderTextColor={surface.textSecondary}
                  style={styles.input}
                />
                <Pressable style={styles.primaryButton} onPress={handleComplete}>
                  <Text style={styles.primaryButtonLabel}>온보딩 완료</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: surface.pageBackground },
  keyboardArea: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  container: { flexGrow: 1, padding: 24, justifyContent: "center", gap: 16 },
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
});
