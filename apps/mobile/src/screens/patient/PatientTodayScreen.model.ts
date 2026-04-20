import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import type {
  RecentChatSummary,
  TodayViewData,
} from "@gynecology-chatbot/app-core";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { useMobileServices } from "../../core/MobileServicesProvider";
import { useChatSessions } from "../../chat/store";
import {
  cacheTodayView,
  clearCachedHomeView,
  clearCachedRecentChats,
  clearCachedRecordDayView,
  hasFreshCachedTodayView,
  readCachedTodayView,
} from "../../core/patientViewCache";
import { warmConversationSessions } from "./patientConversationNavigation.model";
import {
  confirmChecklistRequest,
  createChecklistSyncTracker,
  hydrateChecklistSyncTracker,
  rememberChecklistDesiredState,
  resolveChecklistRequest,
  rollbackChecklistRequest,
  updateRecordDayChecklistItems,
  updateTodayChecklistItems,
  type ChecklistSyncTracker,
} from "./PatientTodayScreen.helpers";
import { buildPatientTodayViewModel } from "./view-models";

const EMPTY_BABY_BODY = "오늘 아기의 변화를 준비 중이에요.";

function createTodayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function usePatientTodayScreenModel() {
  const router = useRouter();
  const { currentUser, isRestoringSession } = useMobileAppSession();
  const services = useMobileServices();
  const { replaceSession } = useChatSessions();
  const [today, setToday] = useState<TodayViewData | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentChatSummary[]>([]);
  const [activeSection, setActiveSection] = useState("info");
  const [pendingChecklistIds, setPendingChecklistIds] = useState<string[]>([]);
  const [conversationOpenError, setConversationOpenError] = useState<
    string | null
  >(null);
  const [hasAttemptedInfoViewed, setHasAttemptedInfoViewed] = useState(false);
  const checklistSyncRef = useRef<ChecklistSyncTracker>(
    createChecklistSyncTracker([]),
  );
  const pendingChecklistIdsRef = useRef<string[]>([]);
  const todayIsoDate = createTodayIsoDate();

  useEffect(() => {
    pendingChecklistIdsRef.current = pendingChecklistIds;
  }, [pendingChecklistIds]);

  const warmRecentSessionDetails = useCallback(
    (sessions: RecentChatSummary[]) => {
      if (!currentUser || sessions.length === 0) {
        return;
      }

      void warmConversationSessions({
        sessionIds: sessions.map((session) => session.id),
        getSession: services.chatPort.getSession.bind(services.chatPort),
        replaceSession,
        hasFreshSession: () => false,
      });
    },
    [currentUser, replaceSession, services.chatPort],
  );

  useEffect(() => {
    if (!currentUser) {
      setToday(null);
      setRecentSessions([]);
      return;
    }

    const cachedToday = readCachedTodayView(currentUser.id);

    setToday(cachedToday);
    hydrateChecklistSyncTracker(
      checklistSyncRef.current,
      cachedToday?.checklistItems ?? [],
    );
    setRecentSessions([]);
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

      if (hasFreshCachedTodayView(currentUser.id)) {
        const cachedToday = readCachedTodayView(currentUser.id);
        setToday(cachedToday);
        hydrateChecklistSyncTracker(
          checklistSyncRef.current,
          cachedToday?.checklistItems ?? [],
        );
      }

      setRecentSessions([]);
      setHasAttemptedInfoViewed(false);

      void services.todayPort
        .getTodayView()
        .then((nextToday) => {
          setToday(nextToday);
          hydrateChecklistSyncTracker(
            checklistSyncRef.current,
            nextToday.checklistItems,
          );
        })
        .catch(() => undefined);

      void services.homePort
        .getRecordDay(todayIsoDate)
        .then((nextRecordDay) => {
          if (nextRecordDay.relatedSessions.length > 0) {
            setRecentSessions(nextRecordDay.relatedSessions);
            warmRecentSessionDetails(nextRecordDay.relatedSessions);
          }
        })
        .catch(() => undefined);

      void services.chatPort
        .listRecentChats()
        .then((nextRecentChats) => {
          setRecentSessions(nextRecentChats);
          warmRecentSessionDetails(nextRecentChats);
        })
        .catch(() => undefined);
    }, [
      currentUser,
      isRestoringSession,
      router,
      services,
      todayIsoDate,
      warmRecentSessionDetails,
    ]),
  );

  useEffect(() => {
    if (
      activeSection !== "info" ||
      today?.infoViewed ||
      hasAttemptedInfoViewed ||
      !today
    ) {
      return;
    }

    setHasAttemptedInfoViewed(true);
    setToday((current) => {
      if (!currentUser || !current) {
        return current;
      }

      const nextToday = { ...current, infoViewed: true };
      cacheTodayView(currentUser.id, nextToday);
      return nextToday;
    });

    services.todayPort.markInfoViewed().catch(() => {
      setToday((current) => {
        if (!currentUser || !current) {
          return current;
        }

        const nextToday = { ...current, infoViewed: false };
        cacheTodayView(currentUser.id, nextToday);
        return nextToday;
      });
    });
  }, [
    activeSection,
    currentUser,
    hasAttemptedInfoViewed,
    services.todayPort,
    today,
    today?.infoViewed,
  ]);

  function handleToggleChecklistItem(checklistId: string, completed: boolean) {
    if (!today) {
      return;
    }

    rememberChecklistDesiredState(
      checklistSyncRef.current,
      checklistId,
      completed,
    );
    setToday((current) => {
      if (!currentUser || !current) {
        return current;
      }

      const nextToday = updateTodayChecklistItems(
        current,
        checklistId,
        completed,
      );
      if (!nextToday) {
        return current;
      }
      cacheTodayView(currentUser.id, nextToday);
      return nextToday;
    });

    if (currentUser) {
      clearCachedRecordDayView(currentUser.id, todayIsoDate);
      clearCachedRecentChats(currentUser.id);
      clearCachedHomeView(currentUser.id);
    }

    if (pendingChecklistIdsRef.current.includes(checklistId)) {
      return;
    }

    const request = resolveChecklistRequest(
      checklistSyncRef.current,
      checklistId,
    );
    if (!request) {
      return;
    }

    pendingChecklistIdsRef.current = [
      ...pendingChecklistIdsRef.current,
      checklistId,
    ];
    setPendingChecklistIds((current) => [...current, checklistId]);
    services.todayPort
      .setChecklistItemCompleted(request)
      .then(() => {
        confirmChecklistRequest(
          checklistSyncRef.current,
          checklistId,
          request.completed,
        );
      })
      .catch(() => {
        const rollbackCompleted = rollbackChecklistRequest(
          checklistSyncRef.current,
          checklistId,
        );
        setToday((current) => {
          if (!currentUser || !current) {
            return current;
          }

          const nextToday = updateTodayChecklistItems(
            current,
            checklistId,
            rollbackCompleted,
          );
          if (!nextToday) {
            return current;
          }
          cacheTodayView(currentUser.id, nextToday);
          return nextToday;
        });

        if (currentUser) {
          clearCachedRecordDayView(currentUser.id, todayIsoDate);
          clearCachedRecentChats(currentUser.id);
        }
      })
      .finally(() => {
        pendingChecklistIdsRef.current = pendingChecklistIdsRef.current.filter(
          (id) => id !== checklistId,
        );
        setPendingChecklistIds((current) =>
          current.filter((id) => id !== checklistId),
        );

        const nextRequest = resolveChecklistRequest(
          checklistSyncRef.current,
          checklistId,
        );
        if (nextRequest) {
          handleToggleChecklistItem(checklistId, nextRequest.completed);
        }
      });
  }

  function openNewChat() {
    router.push("/chat/new");
  }

  function openRecentSession(sessionId: string) {
    setConversationOpenError(null);
    router.push(`/chat/${sessionId}`);
  }

  function openOnboarding() {
    router.push("/onboarding");
  }

  return {
    activeSection,
    setActiveSection,
    pendingChecklistIds,
    conversationOpenError,
    recentSessions,
    today,
    viewModel: buildPatientTodayViewModel({ today }),
    shouldShowOnboardingNudge:
      activeSection === "conversation" &&
      (!today || today.babyBody === EMPTY_BABY_BODY),
    handleToggleChecklistItem,
    openNewChat,
    openRecentSession,
    openOnboarding,
  };
}
