// @ts-nocheck
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type {
  HomeViewData,
  MobileProfileViewData,
} from "@gynecology-chatbot/app-core";
import {
  Button,
  Card,
  DueDateCalendarPicker,
  LabeledInput,
  Pressable,
} from "../../components/ui";
import { PatientShell } from "../../components/patient/PatientShell";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { useMobileServices } from "../../core/MobileServicesProvider";
import {
  palette,
  patientSurfacePalette as surface,
  space,
  typo,
} from "../../theme";
import { buildPatientScrollContentInsets } from "./patientScreenLayout.model";
import {
  resolvePatientProfileLoadError,
  resolvePatientProfileSaveError,
} from "./patientErrorCopy.model";
import { buildPatientHomeViewModel } from "./view-models";

const DEFAULT_NOTIFICATION_TIME = ["0", "8", ":", "3", "0"].join("");
const TONE_OPTIONS = ["차분하게", "친근하게", "전문적으로", "다정하게"];

export function PatientProfileSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useMobileAppSession();
  const { profilePort, homePort } = useMobileServices();
  const [profile, setProfile] = useState<MobileProfileViewData | null>(null);
  const [home, setHome] = useState<HomeViewData | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [tonePreference, setTonePreference] = useState("");
  const [isToneDropdownOpen, setIsToneDropdownOpen] = useState(false);
  const [babyNickname, setBabyNickname] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [notificationTime, setNotificationTime] = useState(
    DEFAULT_NOTIFICATION_TIME,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const contentInsets = buildPatientScrollContentInsets({
    bottomInset: insets.bottom,
    tabBarHeight: 0,
    extraBottomSpacing: space.xl,
    topSpacing: space.xl,
  });
  const draftProfile = useMemo(
    () =>
      profile
        ? {
            ...profile,
            displayName: profile.displayName,
            dueDate: dueDate || null,
            pregnancyWeekLabel:
              dueDate === (profile.dueDate ?? "")
                ? profile.pregnancyWeekLabel
                : null,
            tonePreference,
            babyNickname: babyNickname.trim() || null,
            hospitalName: hospitalName.trim() || null,
            notificationTime,
          }
        : null,
    [
      babyNickname,
      dueDate,
      hospitalName,
      notificationTime,
      profile,
      tonePreference,
    ],
  );
  const previewHome = useMemo(() => {
    if (!home) {
      return home;
    }

    if (dueDate === (profile?.dueDate ?? "")) {
      return home;
    }

    return {
      ...home,
      pregnancyWeekLabel: null,
    };
  }, [dueDate, home, profile?.dueDate]);
  const homeViewModel = useMemo(
    () => buildPatientHomeViewModel({ home: previewHome, profile: draftProfile }),
    [draftProfile, previewHome],
  );

  useEffect(() => {
    if (!currentUser) {
      router.replace("/auth/login");
      return;
    }

    Promise.all([profilePort.getProfile(), homePort.getHomeView()])
      .then(([nextProfile, nextHome]) => {
        setProfile(nextProfile);
        setHome(nextHome);
        setDueDate(nextProfile.dueDate ?? "");
        setTonePreference(nextProfile.tonePreference ?? "");
        setBabyNickname(nextProfile.babyNickname ?? "");
        setHospitalName(nextProfile.hospitalName ?? "");
        setNotificationTime(
          nextProfile.notificationTime ?? DEFAULT_NOTIFICATION_TIME,
        );
      })
      .catch((nextError) => {
        const message = resolvePatientProfileLoadError(nextError);
        if (message.includes("세션이 만료되었어요")) {
          router.replace("/auth/login");
          return;
        }
        setError(message);
      });
  }, [currentUser, homePort, profilePort]);

  async function handleSave() {
    if (!currentUser) {
      return;
    }

    const trimmedTonePreference = tonePreference.trim();
    if (!trimmedTonePreference) {
      setError("상담 분위기를 선택해주세요.");
      return;
    }

    const previousProfile = profile;
    const previousHome = home;
    const optimisticProfile = profile
      ? {
          ...profile,
          displayName: profile?.displayName ?? "",
          dueDate: dueDate || null,
          tonePreference: trimmedTonePreference,
          babyNickname: babyNickname.trim() || null,
          hospitalName: hospitalName.trim() || null,
          notificationTime,
        }
      : profile;

    setIsSaving(true);
    setError(null);
    setProfile(optimisticProfile);

    try {
      await profilePort.updateProfile({
        userId: currentUser.id,
        displayName: profile?.displayName ?? "",
        dueDate: dueDate || null,
        tonePreference: trimmedTonePreference,
        babyNickname: babyNickname.trim() || null,
        hospitalName: hospitalName.trim() || null,
        notificationTime,
      });
      const [refreshedProfile, refreshedHome] = await Promise.all([
        profilePort.getProfile(),
        homePort.getHomeView(),
      ]);
      setProfile(refreshedProfile);
      setHome(refreshedHome);
      router.back();
    } catch (nextError) {
      setProfile(previousProfile);
      setHome(previousHome);
      const message = resolvePatientProfileSaveError(nextError);
      if (message.includes("세션이 만료되었어요")) {
        router.replace("/auth/login");
        return;
      }
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PatientShell
      activeTab="profile"
      backHref="/(tabs)/profile"
      showProfileButton={false}
      pageTone="plain"
      hideHeader
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: contentInsets.paddingTop,
              paddingBottom: contentInsets.paddingBottom,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Card>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>현재 주차</Text>
              <Text style={styles.summaryValue}>
                {profile ? homeViewModel.pregnancyWeekLabel : "불러오는 중이에요"}
              </Text>
            </View>
          </Card>

          <Card variant="muted">
            <View style={styles.form}>
              <LabeledInput
                label="태명"
                value={babyNickname}
                onChangeText={setBabyNickname}
                placeholder="우리 아기 별명"
              />
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>출산 예정일</Text>
                <DueDateCalendarPicker
                  value={dueDate}
                  onChange={setDueDate}
                  minDate={new Date()}
                  maxDate={(() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 294);
                    return d;
                  })()}
                />
              </View>
              <LabeledInput
                label="병원"
                value={hospitalName}
                onChangeText={setHospitalName}
                placeholder="다니는 병원 이름"
              />
              <LabeledInput
                label="알림 시간"
                value={notificationTime}
                onChangeText={setNotificationTime}
                placeholder={DEFAULT_NOTIFICATION_TIME}
              />
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>상담 분위기</Text>
                <Pressable
                  style={styles.dropdownTrigger}
                  onPress={() => setIsToneDropdownOpen((prev) => !prev)}
                  accessibilityLabel="상담 분위기 선택"
                >
                  <Text
                    style={
                      tonePreference
                        ? styles.dropdownValue
                        : styles.dropdownPlaceholder
                    }
                  >
                    {tonePreference || "상담 분위기를 선택해주세요"}
                  </Text>
                </Pressable>
                {isToneDropdownOpen ? (
                  <View style={styles.dropdownList}>
                    {TONE_OPTIONS.map((tone) => (
                      <Pressable
                        key={tone}
                        style={[
                          styles.dropdownItem,
                          tonePreference === tone && styles.dropdownItemActive,
                        ]}
                        onPress={() => {
                          setTonePreference(tone);
                          setIsToneDropdownOpen(false);
                          setError(null);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemLabel,
                            tonePreference === tone &&
                              styles.dropdownItemLabelActive,
                          ]}
                        >
                          {tone}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <Button
                label={isSaving ? "저장 중이에요..." : "저장하기"}
                onPress={handleSave}
                disabled={isSaving}
              />
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
    gap: space.md,
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
  dropdownTrigger: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
    backgroundColor: surface.surfacePrimary,
    justifyContent: "center",
    paddingHorizontal: space.md,
  },
  dropdownValue: {
    ...typo.body,
    color: surface.textPrimary,
  },
  dropdownPlaceholder: {
    ...typo.body,
    color: surface.textSecondary,
  },
  dropdownList: {
    marginTop: space.xs,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
    backgroundColor: surface.surfacePrimary,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  dropdownItemActive: {
    backgroundColor: surface.surfaceAccent,
  },
  dropdownItemLabel: {
    ...typo.body,
    color: surface.textPrimary,
  },
  dropdownItemLabelActive: {
    color: palette.accent,
    fontWeight: "600",
  },
  errorText: {
    ...typo.caption,
    color: palette.error,
  },
});
