// @ts-nocheck
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import type { MobileProfileViewData } from "@gynecology-chatbot/app-core";
import { Button, Card, DueDateCalendarPicker, LabeledInput } from "../../components/ui";
import { PatientShell } from "../../components/patient/PatientShell";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { useMobileServices } from "../../core/MobileServicesProvider";
import { palette, patientSurfacePalette as surface, space, typo } from "../../theme";

const DEFAULT_NOTIFICATION_TIME = ["0", "8", ":", "3", "0"].join("");

export function PatientProfileSettingsScreen() {
  const { currentUser } = useMobileAppSession();
  const { profilePort } = useMobileServices();
  const [profile, setProfile] = useState<MobileProfileViewData | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tonePreference, setTonePreference] = useState("");
  const [babyNickname, setBabyNickname] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [notificationTime, setNotificationTime] = useState(DEFAULT_NOTIFICATION_TIME);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      router.replace("/auth/login");
      return;
    }

    profilePort
      .getProfile()
      .then((nextProfile) => {
        setProfile(nextProfile);
        setDisplayName(nextProfile.displayName);
        setDueDate(nextProfile.dueDate ?? "");
        setTonePreference(nextProfile.tonePreference ?? "");
        setBabyNickname(nextProfile.babyNickname ?? "");
        setHospitalName(nextProfile.hospitalName ?? "");
        setNotificationTime(nextProfile.notificationTime ?? DEFAULT_NOTIFICATION_TIME);
      })
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : "내 정보를 불러오지 못했어요.");
      });
  }, [currentUser, profilePort]);

  async function handleSave() {
    if (!currentUser) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await profilePort.updateProfile({
        userId: currentUser.id,
        displayName: displayName.trim(),
        dueDate: dueDate || null,
        tonePreference: tonePreference.trim(),
        babyNickname: babyNickname.trim() || null,
        hospitalName: hospitalName.trim() || null,
        notificationTime,
      });
      const refreshed = await profilePort.getProfile();
      setProfile(refreshed);
      router.back();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "저장하지 못했어요. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PatientShell activeTab="profile" title="정보 설정" backHref="/profile" showProfileButton={false} pageTone="plain">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Card>
            <Text style={styles.sectionTitle}>아기 정보와 알림을 설정해요</Text>
            <Text style={styles.sectionDescription}>
              태명, 예정일, 알림 시간과 대화 분위기를 여기에서 한 번에 바꿀 수 있어요.
            </Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>현재 주차</Text>
              <Text style={styles.summaryValue}>{profile?.pregnancyWeekLabel ?? "불러오는 중이에요"}</Text>
            </View>
          </Card>

          <Card variant="muted">
            <View style={styles.form}>
              <LabeledInput label="이름" value={displayName} onChangeText={setDisplayName} />
              <LabeledInput label="태명" value={babyNickname} onChangeText={setBabyNickname} placeholder="우리 아기 별명" />
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>출산 예정일</Text>
                <DueDateCalendarPicker
                  value={dueDate}
                  onChange={setDueDate}
                  minDate={new Date()}
                  maxDate={(() => { const d = new Date(); d.setDate(d.getDate() + 294); return d; })()}
                />
              </View>
              <LabeledInput label="병원" value={hospitalName} onChangeText={setHospitalName} placeholder="다니는 병원 이름" />
              <LabeledInput label="알림 시간" value={notificationTime} onChangeText={setNotificationTime} placeholder={DEFAULT_NOTIFICATION_TIME} />
              <LabeledInput label="상담 분위기" value={tonePreference} onChangeText={setTonePreference} placeholder="차분하게, 따뜻하게" />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <Button label={isSaving ? "저장 중이에요..." : "저장하기"} onPress={handleSave} disabled={isSaving} />
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </PatientShell>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: 140,
    gap: space.md,
  },
  sectionTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  sectionDescription: {
    marginTop: space.sm,
    ...typo.body,
    color: surface.textSecondary,
  },
  summaryRow: {
    marginTop: space.lg,
    gap: space.xs,
  },
  summaryLabel: {
    ...typo.caption,
    color: surface.textSecondary,
  },
  summaryValue: {
    ...typo.label,
    color: palette.accent,
  },
  form: {
    gap: space.md,
  },
  fieldBlock: {
    gap: space.xs,
  },
  fieldLabel: {
    ...typo.caption,
    color: surface.textSecondary,
    fontWeight: "600",
  },
  errorText: {
    ...typo.caption,
    color: palette.error,
  },
});
