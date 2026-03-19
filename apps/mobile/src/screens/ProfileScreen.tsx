// @ts-nocheck
import { router } from "expo-router";
import { useEffect, useState } from "react";
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
import { MobileScreenFrame } from "../components/MobileScreenFrame";
import { useMobileAppSession } from "../core/MobileAppSessionProvider";
import { useMobileServices } from "../core/MobileServicesProvider";
import { palette, patientSurfacePalette as surface } from "../theme";

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
              : "프로필을 불러오지 못했습니다.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser, profilePort]);

  async function handleSave() {
    if (!currentUser || !displayName.trim() || !tonePreference.trim()) {
      setError("이름과 채팅 톤은 비워둘 수 없습니다.");
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
          : "프로필을 저장하지 못했습니다.",
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
        style={styles.keyboardArea}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroCard}>
            <Text style={styles.eyebrow}>프로필</Text>
            <Text style={styles.title}>내 정보와 상담 설정</Text>
            <Text style={styles.description}>
              {error ?? "로그아웃은 여기서만 노출하고, 홈은 탐색과 요약에 집중합니다."}
            </Text>
            <View style={styles.metaGrid}>
              <View style={styles.metaCard}>
                <Text style={styles.metaLabel}>이름</Text>
                <Text style={styles.metaValue}>{displayName || "확인 중"}</Text>
              </View>
              <View style={styles.metaCard}>
                <Text style={styles.metaLabel}>전화번호</Text>
                <Text style={styles.metaValue}>{phoneNumber || "확인 중"}</Text>
              </View>
              <View style={styles.metaCard}>
                <Text style={styles.metaLabel}>현재 주차</Text>
                <Text style={styles.metaValue}>{pregnancyWeekLabel}</Text>
              </View>
              <View style={styles.metaCard}>
                <Text style={styles.metaLabel}>임신 경과</Text>
                <Text style={styles.metaValue}>{pregnancyDayCount}일</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>설정</Text>
            <View style={styles.form}>
              <LabeledInput label="이름" value={displayName} onChangeText={setDisplayName} />
              <LabeledInput label="태명" value={babyNickname} onChangeText={setBabyNickname} />
              <LabeledInput label="예정 출산일" value={dueDate} onChangeText={setDueDate} placeholder="2026-08-01" />
              <LabeledInput label="주 진료 병원" value={hospitalName} onChangeText={setHospitalName} />
              <LabeledInput label="알림 시간" value={notificationTime} onChangeText={setNotificationTime} placeholder="08:30" />
              <LabeledInput label="채팅 톤" value={tonePreference} onChangeText={setTonePreference} placeholder="차분하게" />
              <Pressable style={styles.primaryButton} onPress={handleSave}>
                <Text style={styles.primaryButtonLabel}>
                  {isSaving ? "저장 중" : "프로필 저장"}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>세션 관리</Text>
            <Text style={styles.description}>
              계정과 설정을 정리한 뒤, 필요할 때만 여기서 세션을 종료합니다.
            </Text>
            <Pressable style={styles.secondaryButton} onPress={handleLogout}>
              <Text style={styles.secondaryButtonLabel}>로그아웃</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </MobileScreenFrame>
  );
}

function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.subInk}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  keyboardArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 120,
    gap: 16,
  },
  heroCard: {
    borderRadius: 24,
    backgroundColor: surface.surfacePrimary,
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
    padding: 20,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.accent,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 10,
    fontSize: 28,
    fontWeight: "700",
    color: surface.textPrimary,
  },
  description: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: surface.textSecondary,
  },
  metaGrid: {
    marginTop: 16,
    gap: 10,
  },
  metaCard: {
    borderRadius: 18,
    backgroundColor: surface.surfaceSecondary,
    padding: 14,
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
  },
  metaLabel: {
    fontSize: 13,
    color: surface.textSecondary,
  },
  metaValue: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: "700",
    color: surface.textPrimary,
  },
  sectionCard: {
    borderRadius: 24,
    backgroundColor: surface.surfacePrimary,
    padding: 18,
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: surface.textPrimary,
  },
  form: {
    marginTop: 16,
    gap: 12,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: surface.textPrimary,
  },
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
    marginTop: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: surface.accentSolid,
    paddingVertical: 15,
  },
  primaryButtonLabel: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: surface.surfaceSecondary,
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
    paddingVertical: 15,
  },
  secondaryButtonLabel: {
    color: surface.accentSolid,
    fontSize: 15,
    fontWeight: "700",
  },
});
