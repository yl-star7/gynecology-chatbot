import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  InteractionManager,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import type {
  HomeViewData,
  MobileProfileViewData,
  RecordDayView,
  TodayViewData,
} from "@gynecology-chatbot/app-core";
import { PatientShell } from "../../components/patient/PatientShell";
import { PatientExternalSurveyCard } from "../../components/patient/profile/PatientExternalSurveyCard";
import { PatientProfileAccountCard } from "../../components/patient/profile/PatientProfileAccountCard";
import { PatientProfileCalendarCard } from "../../components/patient/profile/PatientProfileCalendarCard";
import { PatientProfileDayModal } from "../../components/patient/profile/PatientProfileDayModal";
import { PatientProfileHeroCard } from "../../components/patient/profile/PatientProfileHeroCard";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { useMobileServices } from "../../core/MobileServicesProvider";
import { useChatSessions } from "../../chat/store";
import {
  hasFreshCachedHomeView,
  hasFreshCachedProfileView,
  hasFreshCachedTodayView,
  readCachedHomeView,
  readCachedProfileView,
  readCachedTodayView,
  clearCachedRecordDayView,
} from "../../core/patientViewCache";
import {
  mergePatientProfileSyncSnapshot,
  usePatientProfileSyncSnapshot,
} from "./patientProfileSyncStore";
import { space } from "../../theme";
import {
  addProfileCalendarMonths,
  buildProfileCalendarModel,
  createProfileCalendarMonthKey,
  formatProfileCalendarMonthLabel,
  resolveProfileCalendarMonthKey,
} from "./patientProfileCalendar";
import { buildPatientTabContentInsets } from "./patientScreenLayout.model";
import { usePatientBottomInset } from "./usePatientBottomInset";
import { normalizeSurveyFormUrl } from "./patientSurveyFormUrl.model";
import {
  buildProfileDayState,
  buildProfileInfoCards,
} from "./PatientProfileScreen.model";
import {
  resolvePatientProfileLoadError,
  resolvePatientRecordDayLoadError,
} from "./patientErrorCopy.model";
import { prefetchConversationSession } from "./patientConversationNavigation.model";
import { buildPatientHomeViewModel } from "./view-models";

type ModalSection = "conversation" | "checklist" | "info";
type ConversationSection = "summary" | "heart";
type ExternalSurvey = { id: string; label: string; url: string };

export function PatientProfileScreen() {
  const router = useRouter();
  const bottomInset = usePatientBottomInset();
  const { currentUser, isRestoringSession, signOut } = useMobileAppSession();
  const { profilePort, homePort, todayPort, chatPort } = useMobileServices();
  const { replaceSession } = useChatSessions();
  const syncSnapshot = usePatientProfileSyncSnapshot();
  const [profile, setProfile] = useState<MobileProfileViewData | null>(null);
  const [home, setHome] = useState<HomeViewData | null>(null);
  const [today, setToday] = useState<TodayViewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [externalSurveys, setExternalSurveys] = useState<ExternalSurvey[]>([]);
  const [selectedIsoDate, setSelectedIsoDate] = useState<string | null>(null);
  const [selectedRecordDay, setSelectedRecordDay] =
    useState<RecordDayView | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<string | null>(null);
  const [recordDayError, setRecordDayError] = useState<string | null>(null);
  const [modalSection, setModalSection] =
    useState<ModalSection>("conversation");
  const [conversationSection, setConversationSection] =
    useState<ConversationSection>("summary");
  const isOpeningConversationRef = useRef(false);

  useEffect(() => {
    if (!currentUser) {
      setProfile(null);
      setHome(null);
      setToday(null);
      return;
    }

    const cachedProfile = readCachedProfileView(currentUser.id);
    const cachedHome = readCachedHomeView(currentUser.id);
    const cachedToday = readCachedTodayView(currentUser.id);

    setProfile(cachedProfile);
    setHome(cachedHome);
    setToday(cachedToday);
    setSelectedRecordDay(null);
  }, [currentUser]);

  useFocusEffect(
    useCallback(() => {
      if (isRestoringSession) {
        return;
      }

      if (!currentUser) {
        router.replace("/auth/login");
        return;
      }

      const cachedProfile = readCachedProfileView(currentUser.id);
      const cachedHome = readCachedHomeView(currentUser.id);
      const cachedToday = readCachedTodayView(currentUser.id);
      const hasFreshProfile = hasFreshCachedProfileView(currentUser.id);
      const hasFreshHome = hasFreshCachedHomeView(currentUser.id);

      if (cachedProfile) {
        setProfile(cachedProfile);
      }
      if (cachedHome) {
        setHome(cachedHome);
      }
      if (cachedToday) {
        setToday(cachedToday);
      }

      if (hasFreshProfile && hasFreshHome) {
        setError(null);
      } else {
        Promise.all([
          hasFreshProfile && cachedProfile
            ? Promise.resolve(cachedProfile)
            : profilePort.getProfile(),
          hasFreshHome && cachedHome && !calendarMonth
            ? Promise.resolve(cachedHome)
            : homePort.getHomeView(calendarMonth ?? undefined),
        ])
          .then(([nextProfile, nextHome]) => {
            setProfile(nextProfile);
            setHome(nextHome);
            setError(null);
          })
          .catch((nextError) => {
            setError(resolvePatientProfileLoadError(nextError));
          });
      }

      if (!hasFreshCachedTodayView(currentUser.id)) {
        todayPort
          .getTodayView()
          .then((nextToday) => {
            setToday(nextToday);
          })
          .catch(() => undefined);
      }
    }, [
      currentUser,
      calendarMonth,
      homePort,
      isRestoringSession,
      profilePort,
      router,
      todayPort,
    ]),
  );

  useEffect(() => {
    if (!calendarMonth || !currentUser || isRestoringSession) {
      return;
    }

    let cancelled = false;

    homePort
      .getHomeView(calendarMonth)
      .then((nextHome) => {
        if (!cancelled) {
          setHome(nextHome);
          setError(null);
        }
      })
      .catch((nextError) => {
        if (!cancelled) {
          setError(resolvePatientProfileLoadError(nextError));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [calendarMonth, currentUser, homePort, isRestoringSession]);

  useEffect(() => {
    setProfile((current) =>
      mergePatientProfileSyncSnapshot(
        current,
        syncSnapshot.profile,
        currentUser?.id,
      ),
    );
  }, [currentUser?.id, syncSnapshot.profile, syncSnapshot.version]);

  useEffect(() => {
    let isMounted = true;

    profilePort
      .getBranding()
      .then((branding) => {
        if (!isMounted) {
          return;
        }
        const surveys = Array.isArray(branding.externalSurveys)
          ? branding.externalSurveys.flatMap((survey) => {
              const url = normalizeSurveyFormUrl(survey.url);
              return survey.visible && url
                ? [{ id: survey.id, label: survey.label, url }]
                : [];
            })
          : [];
        const fallbackUrl = normalizeSurveyFormUrl(branding.surveyFormUrl);
        setExternalSurveys(
          surveys.length > 0
            ? surveys
            : fallbackUrl
              ? [{ id: "legacy", label: "설문", url: fallbackUrl }]
              : [],
        );
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setExternalSurveys([]);
      });

    return () => {
      isMounted = false;
    };
  }, [profilePort]);

  useEffect(() => {
    if (!selectedIsoDate) {
      return;
    }

    setSelectedRecordDay(null);
    setRecordDayError(null);

    if (!currentUser) {
      return;
    }

    let cancelled = false;

    homePort
      .getRecordDay(selectedIsoDate)
      .then((nextRecordDay) => {
        if (!cancelled) {
          setSelectedRecordDay(nextRecordDay);
        }
      })
      .catch((nextError) => {
        if (!cancelled) {
          setSelectedRecordDay(null);
          setRecordDayError(resolvePatientRecordDayLoadError(nextError));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser, homePort, selectedIsoDate]);

  async function handleLogout() {
    await signOut();
    router.replace("/auth/login");
  }

  function openCalendarDay(isoDate: string) {
    clearCachedRecordDayView(currentUser?.id, isoDate);
    setSelectedIsoDate(isoDate);
    setModalSection("conversation");
    setConversationSection("summary");
  }

  function closeCalendarDayModal() {
    setSelectedIsoDate(null);
    setSelectedRecordDay(null);
    setRecordDayError(null);
  }

  function moveCalendarMonth(offset: number) {
    const visibleMonth = resolveProfileCalendarMonthKey(home?.calendarDays);
    setCalendarMonth(addProfileCalendarMonths(visibleMonth, offset));
    closeCalendarDayModal();
  }

  function openTodayTab() {
    closeCalendarDayModal();
    router.navigate("/(tabs)/today");
  }

  function openConversationSession(sessionId: string) {
    if (isOpeningConversationRef.current) {
      return;
    }

    isOpeningConversationRef.current = true;
    setRecordDayError(null);
    const targetHref = `/chat/${sessionId}?readOnly=1` as const;
    const prefetch = prefetchConversationSession({
      sessionId,
      getSession: chatPort.getSession.bind(chatPort),
      replaceSession,
    }).catch(() => {
      // 채팅 화면 자체가 loadSessionDetail 로 재시도하므로 여기선 조용히 실패
    });

    closeCalendarDayModal();

    requestAnimationFrame(() => {
      InteractionManager.runAfterInteractions(() => {
        router.push(targetHref);
        void prefetch.finally(() => {
          setTimeout(() => {
            isOpeningConversationRef.current = false;
          }, 400);
        });
      });
    });
  }

  const calendarModel = useMemo(
    () => buildProfileCalendarModel(home?.calendarDays),
    [home?.calendarDays],
  );
  const visibleCalendarMonth = useMemo(
    () => resolveProfileCalendarMonthKey(home?.calendarDays),
    [home?.calendarDays],
  );
  const currentCalendarMonth = useMemo(() => createProfileCalendarMonthKey(), []);
  const calendarMonthLabel =
    home?.currentMonthLabel ??
    formatProfileCalendarMonthLabel(visibleCalendarMonth);
  const canGoNextCalendarMonth = visibleCalendarMonth < currentCalendarMonth;
  const homeViewModel = useMemo(
    () => buildPatientHomeViewModel({ home, profile }),
    [home, profile],
  );
  const babyName = profile?.babyNickname?.trim() || "아기";
  const selectedDay = useMemo(
    () =>
      (home?.calendarDays ?? []).find(
        (day) => day.isoDate === selectedIsoDate,
      ) ?? null,
    [home?.calendarDays, selectedIsoDate],
  );
  const dayState = useMemo(
    () =>
      buildProfileDayState({
        selectedIsoDate,
        selectedDay,
        selectedRecordDay,
        hasRecordDayError: Boolean(recordDayError),
      }),
    [recordDayError, selectedDay, selectedIsoDate, selectedRecordDay],
  );
  const infoCards = useMemo(
    () =>
      buildProfileInfoCards({
        today,
        recordDay: selectedRecordDay,
      }),
    [selectedRecordDay, today],
  );
  const contentInsets = buildPatientTabContentInsets({
    bottomInset,
    extraBottomSpacing: 0,
    topSpacing: space.xs,
  });
  const heroDescription = profile
    ? `${homeViewModel.pregnancyWeekLabel} · ${homeViewModel.pregnancyDayText}예요.`
    : "아기와 함께한 시간을 정리해보세요.";
  const dueDateText = profile?.dueDate
    ? `예정일 ${profile.dueDate} · 알림 ${profile.notificationTime ?? "08:30"}`
    : "출산 예정일을 입력하면 더 정확히 보여드려요.";

  return (
    <PatientShell
      activeTab="profile"
      showProfileButton={false}
      pageTone="plain"
      headerCompact
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
          <PatientProfileHeroCard
            babyImageSource={homeViewModel.babyImageSource}
            babyName={babyName}
            description={heroDescription}
            dueDateText={dueDateText}
            onPressSettings={() => router.push("/profile-settings")}
          />

          <PatientProfileCalendarCard
            columnWidth={calendarModel.columnWidth}
            currentMonthLabel={calendarMonthLabel}
            gridDays={calendarModel.gridDays}
            activeDays={calendarModel.activeDays}
            isoDateByDay={calendarModel.isoDateByDay}
            onSelectDay={openCalendarDay}
            onPreviousMonth={() => moveCalendarMonth(-1)}
            onNextMonth={() => moveCalendarMonth(1)}
            canGoNextMonth={canGoNextCalendarMonth}
          />

          <PatientExternalSurveyCard
            surveys={externalSurveys}
            onOpenSurvey={(surveyId) =>
              router.push(`/profile-survey?surveyId=${encodeURIComponent(surveyId)}`)
            }
          />

          <PatientProfileAccountCard
            phoneNumber={profile?.phoneNumber}
            hospitalName={profile?.hospitalName}
            notificationTime={profile?.notificationTime}
            onLogout={handleLogout}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <PatientProfileDayModal
        visible={Boolean(selectedIsoDate)}
        dateLabel={selectedRecordDay?.dateLabel ?? ""}
        isoDate={selectedIsoDate ?? ""}
        selectedIsToday={dayState.selectedIsToday}
        modalSection={modalSection}
        conversationSection={conversationSection}
        checklistStatus={dayState.checklistStatus}
        infoStatus={dayState.infoStatus}
        conversationStatus={dayState.conversationStatus}
        checklistItems={selectedRecordDay?.checklistItems ?? []}
        conversationSummary={dayState.conversationSummary}
        relatedSessions={selectedRecordDay?.relatedSessions ?? []}
        heartShareItems={dayState.heartShareItems}
        infoCards={infoCards}
        error={recordDayError ?? error}
        onClose={closeCalendarDayModal}
        onPressInfo={openTodayTab}
        onPressChecklist={() => setModalSection("checklist")}
        onPressConversation={() => setModalSection("conversation")}
        onChangeConversationSection={(value) =>
          setConversationSection(value as ConversationSection)
        }
        onOpenSession={openConversationSession}
        onOpenToday={openTodayTab}
      />
    </PatientShell>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space.lg,
    gap: space.lg,
  },
});
