import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  hasFreshCachedRecordDayView,
  hasFreshCachedTodayView,
  readCachedHomeView,
  readCachedProfileView,
  readCachedRecordDayView,
  readCachedTodayView,
} from "../../core/patientViewCache";
import {
  mergePatientProfileSyncSnapshot,
  usePatientProfileSyncSnapshot,
} from "./patientProfileSyncStore";
import { space } from "../../theme";
import { buildProfileCalendarModel } from "./patientProfileCalendar";
import { buildPatientTabContentInsets } from "./patientScreenLayout.model";
import { normalizeSurveyFormUrl } from "./patientSurveyFormUrl.model";
import {
  buildProfileDayState,
  buildProfileInfoCards,
} from "./PatientProfileScreen.model";
import {
  resolvePatientConversationLoadError,
  resolvePatientProfileLoadError,
  resolvePatientRecordDayLoadError,
} from "./patientErrorCopy.model";
import { prefetchConversationSession } from "./patientConversationNavigation.model";
import { buildPatientHomeViewModel } from "./view-models";

type ModalSection = "conversation" | "checklist" | "info";
type ConversationSection = "summary" | "heart";

export function PatientProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser, isRestoringSession, signOut } = useMobileAppSession();
  const { profilePort, homePort, todayPort, chatPort } = useMobileServices();
  const { replaceSession } = useChatSessions();
  const syncSnapshot = usePatientProfileSyncSnapshot();
  const [profile, setProfile] = useState<MobileProfileViewData | null>(null);
  const [home, setHome] = useState<HomeViewData | null>(null);
  const [today, setToday] = useState<TodayViewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [surveyFormUrl, setSurveyFormUrl] = useState<string | null>(null);
  const [selectedIsoDate, setSelectedIsoDate] = useState<string | null>(null);
  const [selectedRecordDay, setSelectedRecordDay] =
    useState<RecordDayView | null>(null);
  const [recordDayError, setRecordDayError] = useState<string | null>(null);
  const [modalSection, setModalSection] =
    useState<ModalSection>("conversation");
  const [conversationSection, setConversationSection] =
    useState<ConversationSection>("summary");

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

      if (
        hasFreshCachedProfileView(currentUser.id) &&
        hasFreshCachedHomeView(currentUser.id) &&
        hasFreshCachedTodayView(currentUser.id)
      ) {
        setProfile(readCachedProfileView(currentUser.id));
        setHome(readCachedHomeView(currentUser.id));
        setToday(readCachedTodayView(currentUser.id));
        setError(null);
        return;
      }

      Promise.all([
        profilePort.getProfile(),
        homePort.getHomeView(),
        todayPort.getTodayView(),
      ])
        .then(([nextProfile, nextHome, nextToday]) => {
          setProfile(nextProfile);
          setHome(nextHome);
          setToday(nextToday);
          setError(null);
        })
        .catch((nextError) => {
          setError(resolvePatientProfileLoadError(nextError));
        });
    }, [
      currentUser,
      homePort,
      isRestoringSession,
      profilePort,
      router,
      todayPort,
    ]),
  );

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
        setSurveyFormUrl(normalizeSurveyFormUrl(branding.surveyFormUrl));
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setSurveyFormUrl(null);
      });

    return () => {
      isMounted = false;
    };
  }, [profilePort]);

  useEffect(() => {
    if (!selectedIsoDate) {
      return;
    }

    const cachedRecordDay = currentUser
      ? readCachedRecordDayView(currentUser.id, selectedIsoDate)
      : null;
    setSelectedRecordDay(cachedRecordDay);
    setRecordDayError(null);

    if (!currentUser) {
      return;
    }

    if (hasFreshCachedRecordDayView(currentUser.id, selectedIsoDate)) {
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
          setSelectedRecordDay(cachedRecordDay);
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
    setSelectedIsoDate(isoDate);
    setModalSection("conversation");
    setConversationSection("summary");
  }

  function closeCalendarDayModal() {
    setSelectedIsoDate(null);
    setSelectedRecordDay(null);
    setRecordDayError(null);
  }

  function openTodayTab() {
    closeCalendarDayModal();
    router.navigate("/(tabs)/today");
  }

  function openConversationSession(sessionId: string) {
    setRecordDayError(null);
    closeCalendarDayModal();
    router.push(`/chat/${sessionId}`);

    void prefetchConversationSession({
      sessionId,
      getSession: chatPort.getSession.bind(chatPort),
      replaceSession,
    }).catch(() => {
      // 채팅 화면 자체가 loadSessionDetail 로 재시도하므로 여기선 조용히 실패
    });
  }

  const calendarModel = useMemo(
    () => buildProfileCalendarModel(home?.calendarDays),
    [home?.calendarDays],
  );
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
    bottomInset: insets.bottom,
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
      title="마이페이지"
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
            currentMonthLabel={home?.currentMonthLabel}
            gridDays={calendarModel.gridDays}
            activeDays={calendarModel.activeDays}
            isoDateByDay={calendarModel.isoDateByDay}
            onSelectDay={openCalendarDay}
          />

          <PatientExternalSurveyCard
            hasSurveyFormUrl={Boolean(surveyFormUrl)}
            onOpenSurvey={() => router.push("/profile-survey")}
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
