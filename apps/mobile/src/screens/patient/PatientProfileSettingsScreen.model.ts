import { useRootNavigationState, useRouter } from "expo-router";
import { Keyboard } from "react-native";
import { useEffect, useMemo, useState } from "react";
import type {
  HomeViewData,
  MobileProfileViewData,
} from "@gynecology-chatbot/app-core";
import {
  addCalendarDays,
  createKoreanDateKey,
  PREGNANCY_TERM_DAYS,
  resolveMobileThemeKey,
  type MobileThemeKey,
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
import { useMobileTheme } from "../../theme-provider";
import { scheduleDailyLocalNotification } from "../../notifications/dailyLocalNotification";
import {
  resolvePatientProfileLoadError,
  resolvePatientProfileRefreshError,
  resolvePatientProfileSaveError,
} from "./patientErrorCopy.model";
import { publishPatientProfileSyncProfile } from "./patientProfileSyncStore";
import {
  isThemeOnlyProfileSettingsSave,
  shouldRescheduleProfileNotification,
} from "./patientProfileSettingsSave.model";
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
import { PATIENT_THEME_OPTIONS } from "./patientThemeSettings.model";

export const TONE_OPTIONS = ["차분하게", "친근하게", "전문적으로", "다정하게"];
export { DEFAULT_NOTIFICATION_TIME, normalizePatientNotificationTimeInput };

function createDueDateMaxDate() {
  return addCalendarDays(createKoreanDateKey(), PREGNANCY_TERM_DAYS);
}

export function usePatientProfileSettingsScreenModel() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const isNavigationReady = Boolean(rootNavigationState?.key);
  const { currentUser, isRestoringSession } = useMobileAppSession();
  const { profilePort, homePort } = useMobileServices();
  const { applyThemeKey, key: activeThemeKey } = useMobileTheme();
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
  const [themeKey, setThemeKey] = useState<MobileThemeKey>(activeThemeKey);
  const [hasProfileFieldEdits, setHasProfileFieldEdits] = useState(false);
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
      setHasProfileFieldEdits(false);
      publishPatientProfileSyncProfile(cachedProfile);
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
    if (isRestoringSession || !isNavigationReady) {
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
        setHasProfileFieldEdits(false);
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
  }, [
    currentUser,
    homePort,
    isNavigationReady,
    isRestoringSession,
    profilePort,
    router,
  ]);

  useEffect(() => {
    setThemeKey(activeThemeKey);
  }, [activeThemeKey]);

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
    if (notificationTime !== nextTime) {
      setHasProfileFieldEdits(true);
    }
    setNotificationTime(nextTime);
    setIsToneDropdownOpen(false);
    setError(null);
  }

  function selectTonePreference(nextTone: string) {
    if (tonePreference !== nextTone) {
      setHasProfileFieldEdits(true);
    }
    setTonePreference(nextTone);
    setIsToneDropdownOpen(false);
    setError(null);
  }

  function changeBabyNickname(nextBabyNickname: string) {
    if (babyNickname !== nextBabyNickname) {
      setHasProfileFieldEdits(true);
    }
    setBabyNickname(nextBabyNickname);
    setError(null);
  }

  function changeDueDate(nextDueDate: string) {
    if (dueDate !== nextDueDate) {
      setHasProfileFieldEdits(true);
    }
    setDueDate(nextDueDate);
    setError(null);
  }

  function changeHospitalName(nextHospitalName: string) {
    if (hospitalName !== nextHospitalName) {
      setHasProfileFieldEdits(true);
    }
    setHospitalName(nextHospitalName);
    setError(null);
  }

  function selectThemeKey(nextThemeKey: MobileThemeKey) {
    setThemeKey(nextThemeKey);
    setIsToneDropdownOpen(false);
    setIsTimePickerOpen(false);
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
    const previousThemeKey = resolveMobileThemeKey(
      previousProfile?.themeKey ?? activeThemeKey,
    );
    const saveDraft = {
      babyNickname: trimmedBabyNickname,
      dueDate: dueDate || null,
      hospitalName: trimmedHospitalName,
      notificationTime: normalizedNotificationTime,
      themeKey,
      tonePreference: trimmedTonePreference,
    };
    const isThemeOnlyChange = isThemeOnlyProfileSettingsSave({
      draft: saveDraft,
      hasProfileFieldEdits,
      previousProfile,
      previousThemeKey,
    });
    const shouldRescheduleNotification = shouldRescheduleProfileNotification(
      previousProfile,
      saveDraft,
    );
    const optimisticProfile: MobileProfileViewData | null = profile
      ? {
          ...profile,
          displayName: profile.displayName,
          dueDate: dueDate || null,
          tonePreference: trimmedTonePreference,
          babyNickname: trimmedBabyNickname,
          hospitalName: trimmedHospitalName,
          notificationTime: normalizedNotificationTime,
          themeKey,
        }
      : profile;
    const saveInput = {
      userId: currentUser.id,
      displayName: profile?.displayName ?? "",
      dueDate: dueDate || null,
      tonePreference: trimmedTonePreference,
      babyNickname: trimmedBabyNickname,
      hospitalName: trimmedHospitalName,
      notificationTime: normalizedNotificationTime,
      themeKey,
    };

    setError(null);
    setIsTimePickerOpen(false);
    setNotificationTime(normalizedNotificationTime);
    setProfile(optimisticProfile);
    if (optimisticProfile) {
      cacheProfileView(currentUser.id, optimisticProfile);
    }
    publishPatientProfileSyncProfile(optimisticProfile);
    if (isThemeOnlyChange) {
      if (themeKey !== previousThemeKey) {
        void applyThemeKey(themeKey, currentUser.id).catch((themeError) => {
          console.error("patient theme persist error", themeError);
        });
      }
      router.replace("/(tabs)/profile");
      void profilePort.updateProfile(saveInput).catch((saveError) => {
        const saveMessage = resolvePatientProfileSaveError(saveError);
        if (saveMessage.includes("세션이 만료되었어요")) {
          router.replace("/auth/login");
          return;
        }
        console.error("patient theme background save error", saveError);
      });
      return;
    }

    setIsSaving(true);
    if (themeKey !== previousThemeKey) {
      void applyThemeKey(themeKey).catch((themeError) => {
        console.error("patient theme apply error", themeError);
      });
    }

    try {
      await profilePort.updateProfile(saveInput);
      if (shouldRescheduleNotification) {
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
      }

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
        const refreshedThemeKey = resolveMobileThemeKey(nextProfile.themeKey);
        setThemeKey(refreshedThemeKey);
        void applyThemeKey(refreshedThemeKey, currentUser.id);
      }
      publishPatientProfileSyncProfile(nextProfile);
      router.replace("/(tabs)/profile");
    } catch (saveError) {
      if (themeKey !== previousThemeKey) {
        void applyThemeKey(previousThemeKey).catch((themeError) => {
          console.error("patient theme rollback error", themeError);
        });
      }
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
    setBabyNickname: changeBabyNickname,
    setDueDate: changeDueDate,
    setHospitalName: changeHospitalName,
    setNotificationTime,
    setThemeKey,
    toneOptions: TONE_OPTIONS,
    tonePreference,
    toggleTimePicker,
    toggleToneDropdown,
    selectNotificationTime,
    selectThemeKey,
    selectTonePreference,
    themeKey,
    themeOptions: PATIENT_THEME_OPTIONS,
    handleSave,
    summaryPregnancyWeekLabel,
  };
}
