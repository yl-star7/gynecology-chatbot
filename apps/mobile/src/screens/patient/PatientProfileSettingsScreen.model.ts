import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import type {
  HomeViewData,
  MobileProfileViewData,
} from "@gynecology-chatbot/app-core";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { useMobileServices } from "../../core/MobileServicesProvider";
import {
  resolvePatientProfileLoadError,
  resolvePatientProfileSaveError,
} from "./patientErrorCopy.model";
import { buildPatientHomeViewModel } from "./view-models";

export const DEFAULT_NOTIFICATION_TIME = "08:30";
export const TONE_OPTIONS = ["차분하게", "친근하게", "전문적으로", "다정하게"];

function createDueDateMaxDate() {
  const date = new Date();
  date.setDate(date.getDate() + 294);
  return date;
}

export function usePatientProfileSettingsScreenModel() {
  const router = useRouter();
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

  const homeViewModel = useMemo(
    () => buildPatientHomeViewModel({ home, profile }),
    [home, profile],
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
  }, [currentUser, homePort, profilePort, router]);

  function toggleToneDropdown() {
    setIsToneDropdownOpen((current) => !current);
  }

  function selectTonePreference(nextTone: string) {
    setTonePreference(nextTone);
    setIsToneDropdownOpen(false);
    setError(null);
  }

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
          displayName: profile.displayName,
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

  return {
    babyNickname,
    dueDate,
    dueDateMaxDate: createDueDateMaxDate(),
    error,
    hospitalName,
    homeViewModel,
    isSaving,
    isToneDropdownOpen,
    notificationTime,
    profile,
    setBabyNickname,
    setDueDate,
    setHospitalName,
    setNotificationTime,
    toneOptions: TONE_OPTIONS,
    tonePreference,
    toggleToneDropdown,
    selectTonePreference,
    handleSave,
    summaryPregnancyWeekLabel: profile
      ? dueDate === (profile.dueDate ?? "")
        ? homeViewModel.pregnancyWeekLabel
        : ""
      : "불러오는 중이에요",
  };
}
