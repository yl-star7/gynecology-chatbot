// @ts-nocheck
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Card, LabeledInput } from "../components/ui";
import { MobileScreenFrame } from "../components/MobileScreenFrame";
import { useMobileAppSession } from "../core/MobileAppSessionProvider";
import { useMobileServices } from "../core/MobileServicesProvider";
import { palette, patientSurfacePalette as surface, radii, shadows, space, typo } from "../theme";

export function ProfileScreen() {
  const { currentUser, signOut } = useMobileAppSession();
  const { profilePort } = useMobileServices();
  const [displayName, setDisplayName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tonePreference, setTonePreference] = useState("");
  const [babyNickname, setBabyNickname] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [notificationTime, setNotificationTime] = useState("08:30");
  const [pregnancyWeekLabel, setPregnancyWeekLabel] = useState("정보 없음");
  const [pregnancyDayCount, setPregnancyDayCount] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      router.replace("/auth/login");
      return;
    }

    let cancelled = false;

    profilePort
      .getProfile()
      .then((profile) => {
        if (cancelled) {
          return;
        }

        setDisplayName(profile.displayName);
        setDueDate(profile.dueDate ?? "");
        setTonePreference(profile.tonePreference ?? "");
        setBabyNickname(profile.babyNickname ?? "");
        setHospitalName(profile.hospitalName ?? "");
        setNotificationTime(profile.notificationTime ?? "08:30");
        setPregnancyWeekLabel(profile.pregnancyWeekLabel);
        setPregnancyDayCount(profile.pregnancyDayCount);
        setPhoneNumber(profile.phoneNumber);
        setError(null);
      })
      .catch((nextError) => {
        if (!cancelled) {
          setError(
            nextError instanceof Error
              ? nextError.message
              : "프로필을 불러오지 못했어요.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser, profilePort]);

  async function handleSave() {
    if (!currentUser || !displayName.trim() || !tonePreference.trim()) {
      setError("이름과 상담 분위기는 비워둘 수 없어요.");
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
      setDisplayName(refreshed.displayName);
      setDueDate(refreshed.dueDate ?? "");
      setTonePreference(refreshed.tonePreference ?? "");
      setBabyNickname(refreshed.babyNickname ?? "");
      setHospitalName(refreshed.hospitalName ?? "");
      setNotificationTime(refreshed.notificationTime ?? "08:30");
      setPregnancyWeekLabel(refreshed.pregnancyWeekLabel);
      setPregnancyDayCount(refreshed.pregnancyDayCount);
      setPhoneNumber(refreshed.phoneNumber);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "프로필을 저장하지 못했어요.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    await signOut();
    router.replace("/auth/login");
  }

  return (
    <MobileScreenFrame title="프로필" backHref="/home">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroSection}>
            <Text style={styles.eyebrow}>내 정보</Text>
            <Text style={styles.title}>프로필과 설정</Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <View style={styles.metaGrid}>
            <MetaCard label="이름" value={displayName || "확인 중"} />
            <MetaCard label="전화번호" value={phoneNumber || "확인 중"} />
            <MetaCard label="현재 주차" value={pregnancyWeekLabel} />
            <MetaCard label="임신 경과" value={`${pregnancyDayCount}일`} />
          </View>

          <Card>
            <Text style={styles.sectionTitle}>설정</Text>
            <View style={styles.form}>
              <LabeledInput label="이름" value={displayName} onChangeText={setDisplayName} />
              <LabeledInput label="태명" value={babyNickname} onChangeText={setBabyNickname} placeholder="우리 아기 별명" />
              <LabeledInput label="출산 예정일" value={dueDate} onChangeText={setDueDate} placeholder="2026-08-01" />
              <LabeledInput label="병원" value={hospitalName} onChangeText={setHospitalName} placeholder="다니고 계신 산부인과" />
              <LabeledInput label="알림 시간" value={notificationTime} onChangeText={setNotificationTime} placeholder="08:30" />
              <LabeledInput label="상담 분위기" value={tonePreference} onChangeText={setTonePreference} placeholder="차분하게, 친근하게" />
              <Button label={isSaving ? "저장 중..." : "저장하기"} onPress={handleSave} disabled={isSaving} />
            </View>
          </Card>

          <Button label="로그아웃" variant="text" onPress={handleLogout} />
        </ScrollView>
      </KeyboardAvoidingView>
    </MobileScreenFrame>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={[styles.metaCard, shadows.card]}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: space.xl,
    paddingBottom: 60,
    gap: space.lg,
  },
  heroSection: {
    paddingHorizontal: 4,
  },
  eyebrow: {
    ...typo.eyebrow,
    color: palette.accent,
  },
  title: {
    marginTop: 6,
    ...typo.titleMd,
    color: surface.textPrimary,
  },
  errorText: {
    marginTop: space.sm,
    fontSize: 14,
    lineHeight: 20,
    color: palette.errorText,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
  },
  metaCard: {
    width: "47%",
    borderRadius: radii.lg,
    backgroundColor: surface.surfacePrimary,
    padding: space.md,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: surface.textSecondary,
  },
  metaValue: {
    marginTop: space.xs,
    fontSize: 16,
    fontWeight: "600",
    color: surface.textPrimary,
  },
  sectionTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  form: {
    marginTop: space.lg,
    gap: space.md,
  },
});
