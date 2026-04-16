import { useRouter } from "expo-router";
import { Keyboard } from "react-native";
import { useEffect, useMemo, useState } from "react";
import type {
  HomeViewData,
  MobileProfileViewData,
} from "@gynecology-chatbot/app-core";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import {
  cacheProfileView,
  hasFreshCachedHomeView,
  hasFreshCachedProfileView,
  readCachedHomeView,
  readCachedProfileView,
} from "../../core/patientViewCache";
import { useMobileServices } from "../../core/MobileServicesProvider";
import { scheduleDailyLocalNotification } from "../../notifications/dailyLocalNotification";
import {
  resolvePatientProfileLoadError,
  resolvePatientProfileRefreshError,
  resolvePatientProfileSaveError,
} from "./patientErrorCopy.model";
import { publishPatientProfileSyncProfile } from "./patientProfileSyncStore";
import {
  DEFAULT_NOTIFICATION_TIME,
  INVALID_NOTIFICATION_TIME_ERROR,
  normalizePatientNotificationTimeInput,
} from "./patientNotificationTime.model";
import {
  createPregnancyWeekState,
  getPregnancyWeekDisplayLabel,
} from "./pregnancyWeek.model";
import { buildPatientHomeViewModel } from "./view-models";

export const TONE_OPTIONS = ["차분하게", "친근하게", "전문적으로", "다정하게"];
export { DEFAULT_NOTIFICATION_TIME, normalizePatientNotificationTimeInput };

function createDueDateMaxDate() {
  const date = new Date();
  date.setDate(date.getDate() + 294);
  return date;
}

export function usePatientProfileSettingsScreenModel() {
  const router = useRouter();
  const { currentUser, isRestoringSession } = useMobileAppSession();
  const { profilePort, homePort } = useMobileServices();
  const [profile, setProfile] = useState<MobileProfileViewData | null>(null);
  const [home, setHome] = useState<HomeViewData | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [tonePreference, setTonePreference] = useState("");
  const [isToneDropdownOpen, setIsToneDropdownOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [babyNickname, setBabyNickname] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [notificationTime, setNotificationTime] = useState(
    DEFAULT_NOTIFICATION_TIME,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const cachedProfile = readCachedProfileView(currentUser.id);
    const cachedHome = readCachedHomeView(currentUser.id);

    if (cachedProfile) {
      setProfile(cachedProfile);
      setDueDate(cachedProfile.dueDate ?? "");
      setTonePreference(cachedProfile.tonePreference ?? "");
      setBabyNickname(cachedProfile.babyNickname ?? "");
      setHospitalName(cachedProfile.hospitalName ?? "");
      setNotificationTime(
        cachedProfile.notificationTime ?? DEFAULT_NOTIFICATION_TIME,
      );
      publishPatientProfileSyncProfile(cachedProfile);
      cacheProfileView(currentUser.id, cachedProfile);
    }

    if (cachedHome) {
      setHome(cachedHome);
    }
  }, [currentUser]);

  const homeViewModel = useMemo(
    () => buildPatientHomeViewModel({ home, profile }),
    [home, profile],
  );

  useEffect(() => {
    if (isRestoringSession) {
      return;
    }

    if (!currentUser) {
      router.replace("/auth/login");
      return;
    }

    if (
      hasFreshCachedProfileView(currentUser.id) &&
      hasFreshCachedHomeView(currentUser.id)
    ) {
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
        publishPatientProfileSyncProfile(nextProfile);
      })
      .catch((nextError) => {
        const message = resolvePatientProfileLoadError(nextError);
        if (message.includes("세션이 만료되었어요")) {
          router.replace("/auth/login");
          return;
        }
        setError(message);
      });
  }, [currentUser, homePort, isRestoringSession, profilePort, router]);

  function toggleToneDropdown() {
    Keyboard.dismiss();
    setIsTimePickerOpen(false);
    setIsToneDropdownOpen((current) => !current);
    setError(null);
  }

  function toggleTimePicker() {
    Keyboard.dismiss();
    setIsToneDropdownOpen(false);
    setIsTimePickerOpen((current) => !current);
    setError(null);
  }

  function selectNotificationTime(nextTime: string) {
    setNotificationTime(nextTime);
    setIsToneDropdownOpen(false);
    setError(null);
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
    const optimisticProfile: MobileProfileViewData | null = profile
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
    setIsTimePickerOpen(false);
    setNotificationTime(normalizedNotificationTime);
    setProfile(optimisticProfile);
    if (optimisticProfile) {
      cacheProfileView(currentUser.id, optimisticProfile);
    }
    publishPatientProfileSyncProfile(optimisticProfile);

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
        pregnancyDayCount:
          optimisticProfile?.pregnancyDayCount ??
          homeViewModel.pregnancyDayCount,
      }).catch((notificationError) => {
        console.error(
          "daily local notification schedule error",
          notificationError,
        );
      });

      const [profileRefreshResult, homeRefreshResult] =
        await Promise.allSettled([
          profilePort.getProfile(),
          homePort.getHomeView(),
        ]);
      const refreshMessages = [profileRefreshResult, homeRefreshResult].flatMap(
        (result) =>
          result.status === "rejected"
            ? [resolvePatientProfileRefreshError(result.reason)]
            : [],
      );

      if (
        refreshMessages.some((message) =>
          message.includes("세션이 만료되었어요"),
        )
      ) {
        router.replace("/auth/login");
        return;
      }

      if (
        profileRefreshResult.status === "rejected" ||
        homeRefreshResult.status === "rejected"
      ) {
        console.error("patient profile refresh error", {
          profileRefreshError:
            profileRefreshResult.status === "rejected"
              ? profileRefreshResult.reason
              : null,
          homeRefreshError:
            homeRefreshResult.status === "rejected"
              ? homeRefreshResult.reason
              : null,
        });
      }

      const nextProfile =
        profileRefreshResult.status === "fulfilled"
          ? profileRefreshResult.value
          : optimisticProfile;
      const nextHome =
        homeRefreshResult.status === "fulfilled"
          ? homeRefreshResult.value
          : previousHome;

      setProfile(nextProfile);
      setHome(nextHome);
      if (nextProfile) {
        cacheProfileView(currentUser.id, nextProfile);
      }
      publishPatientProfileSyncProfile(nextProfile);
      router.replace("/(tabs)/profile");
    } catch (saveError) {
      setProfile(previousProfile);
      setHome(previousHome);
      if (previousProfile) {
        cacheProfileView(currentUser.id, previousProfile);
      }
      publishPatientProfileSyncProfile(previousProfile);
      const saveMessage = resolvePatientProfileSaveError(saveError);
      if (saveMessage.includes("세션이 만료되었어요")) {
        router.replace("/auth/login");
        return;
      }
      setError(saveMessage);
    } finally {
      setIsSaving(false);
    }
  }

  const summaryPregnancyWeekLabel = useMemo(() => {
    if (!profile) {
      return "불러오는 중이에요";
    }

    if (dueDate === (profile.dueDate ?? "")) {
      return homeViewModel.pregnancyWeekLabel;
    }

    const draftWeekState = createPregnancyWeekState({
      homePregnancyWeekLabel: null,
      profilePregnancyWeekLabel: null,
      dueDate: dueDate || null,
    });

    return getPregnancyWeekDisplayLabel(draftWeekState);
  }, [dueDate, homeViewModel.pregnancyWeekLabel, profile]);

  return {
    babyNickname,
    dueDate,
    dueDateMaxDate: createDueDateMaxDate(),
    error,
    hospitalName,
    homeViewModel,
    isSaving,
    isTimePickerOpen,
    isToneDropdownOpen,
    notificationTime,
    profile,
    setBabyNickname,
    setDueDate,
    setHospitalName,
    setNotificationTime,
    toneOptions: TONE_OPTIONS,
    tonePreference,
    toggleTimePicker,
    toggleToneDropdown,
    selectNotificationTime,
    selectTonePreference,
    handleSave,
    summaryPregnancyWeekLabel,
  };
}
