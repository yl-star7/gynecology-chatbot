import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import type {
  HomeViewData,
  MobileProfileViewData,
} from "@gynecology-chatbot/app-core";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { useMobileServices } from "../../core/MobileServicesProvider";
import { scheduleDailyLocalNotification } from "../../notifications/dailyLocalNotification";
import {
  resolvePatientProfileLoadError,
  resolvePatientProfileSaveError,
} from "./patientErrorCopy.model";
import { buildPatientHomeViewModel } from "./view-models";

export const DEFAULT_NOTIFICATION_TIME = "08:30";
export const TONE_OPTIONS = ["차분하게", "친근하게", "전문적으로", "다정하게"];
const INVALID_NOTIFICATION_TIME_ERROR = "알림 시간은 08:30처럼 입력해주세요.";

function createDueDateMaxDate() {
  const date = new Date();
  date.setDate(date.getDate() + 294);
  return date;
}

function normalizeHourMinute(hourText: string, minuteText: string) {
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function normalizePatientNotificationTimeInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return DEFAULT_NOTIFICATION_TIME;
  }

  const compact = trimmed.replace(/\s+/g, "");
  const digitsOnlyMatch = compact.match(/^\d{3,4}$/);
  if (digitsOnlyMatch) {
    const normalizedDigits = compact.padStart(4, "0");
    return normalizeHourMinute(
      normalizedDigits.slice(0, 2),
      normalizedDigits.slice(2),
    );
  }

  const colonMatch = compact.match(/^(\d{1,2}):(\d{1,2})$/);
  if (colonMatch) {
    return normalizeHourMinute(colonMatch[1], colonMatch[2]);
  }

  return null;
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

    const normalizedNotificationTime =
      normalizePatientNotificationTimeInput(notificationTime);
    if (!normalizedNotificationTime) {
      setError(INVALID_NOTIFICATION_TIME_ERROR);
      return;
    }

    const trimmedBabyNickname = babyNickname.trim() || null;
    const trimmedHospitalName = hospitalName.trim() || null;
    const previousProfile = profile;
    const previousHome = home;
    const optimisticProfile = profile
      ? {
          ...profile,
          displayName: profile.displayName,
          dueDate: dueDate || null,
          tonePreference: trimmedTonePreference,
          babyNickname: trimmedBabyNickname,
          hospitalName: trimmedHospitalName,
          notificationTime: normalizedNotificationTime,
        }
      : profile;

    setIsSaving(true);
    setError(null);
    setNotificationTime(normalizedNotificationTime);
    setProfile(optimisticProfile);

    try {
      const saveInput = {
        userId: currentUser.id,
        displayName: profile?.displayName ?? "",
        dueDate: dueDate || null,
        tonePreference: trimmedTonePreference,
        babyNickname: trimmedBabyNickname,
        hospitalName: trimmedHospitalName,
        notificationTime: normalizedNotificationTime,
      };
      await profilePort.updateProfile(saveInput);
      void scheduleDailyLocalNotification({
        notificationTime: normalizedNotificationTime,
        pregnancyWeekLabel:
          optimisticProfile?.pregnancyWeekLabel ??
          homeViewModel.pregnancyWeekLabel,
      }).catch((notificationError) => {
        console.error(
          "daily local notification schedule error",
          notificationError,
        );
      });

      try {
        const [refreshedProfile, refreshedHome] = await Promise.all([
          profilePort.getProfile(),
          homePort.getHomeView(),
        ]);
        setProfile(refreshedProfile);
        setHome(refreshedHome);
      } catch (refreshError) {
        console.error("patient profile refresh error", refreshError);
      }

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
