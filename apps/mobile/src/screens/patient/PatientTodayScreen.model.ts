import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { InteractionManager } from "react-native";
import type {
  RecentChatSummary,
  TodayViewData,
} from "@gynecology-chatbot/app-core";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { useMobileServices } from "../../core/MobileServicesProvider";
import { useChatSessions } from "../../chat/store";
import { createPatientCacheDateKey } from "../../core/patientViewCacheFreshness.model";
import {
  cacheTodayView,
  clearCachedHomeView,
  clearCachedRecentChats,
  clearCachedRecordDayView,
  hasFreshCachedChatSession,
  hasFreshCachedRecordDayView,
  hasFreshCachedTodayView,
  readCachedRecordDayView,
  readCachedTodayView,
} from "../../core/patientViewCache";
import { warmConversationSessions } from "./patientConversationNavigation.model";
import { buildTodayConversationSessionsState } from "./PatientTodayConversationSessions.model";
import {
  confirmChecklistRequest,
  createChecklistSyncTracker,
  hydrateChecklistSyncTracker,
  rememberChecklistDesiredState,
  resolveChecklistRequest,
  rollbackChecklistRequest,
  updateTodayChecklistItems,
  type ChecklistSyncTracker,
} from "./PatientTodayScreen.helpers";
import { buildPatientTodayViewModel } from "./view-models";

const EMPTY_BABY_BODY = "오늘 아기의 변화를 준비 중이에요.";

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
  const [isLoadingConversationSessions, setIsLoadingConversationSessions] =
    useState(false);
  const [hasAttemptedInfoViewed, setHasAttemptedInfoViewed] = useState(false);
  const checklistSyncRef = useRef<ChecklistSyncTracker>(
    createChecklistSyncTracker([]),
  );
  const pendingChecklistIdsRef = useRef<string[]>([]);
  const openingSessionIdRef = useRef<string | null>(null);
  const todayIsoDate = createPatientCacheDateKey();

  const warmRecentSessionDetails = useCallback(
    (sessions: RecentChatSummary[]) => {
      if (!currentUser || sessions.length === 0) {
        return;
      }

      void warmConversationSessions({
        sessionIds: sessions.map((session) => session.id),
        getSession: services.chatPort.getSession.bind(services.chatPort),
        replaceSession,
        hasFreshSession: (sessionId) =>
          hasFreshCachedChatSession(currentUser.id, sessionId),
      });
    },
    [currentUser, replaceSession, services.chatPort],
  );

  const applyConversationSessionsState = useCallback(
    ({
      recordDay,
      isLoadingRecordDay,
    }: {
      recordDay: Parameters<
        typeof buildTodayConversationSessionsState
      >[0]["recordDay"];
      isLoadingRecordDay: boolean;
    }) => {
      const nextState = buildTodayConversationSessionsState({
        recordDay,
        todayIsoDate,
        isLoadingRecordDay,
      });

      setRecentSessions(nextState.recentSessions);
      setIsLoadingConversationSessions(nextState.isLoadingRecentSessions);
      warmRecentSessionDetails(nextState.recentSessions);
    },
    [todayIsoDate, warmRecentSessionDetails],
  );

  useEffect(() => {
    pendingChecklistIdsRef.current = pendingChecklistIds;
  }, [pendingChecklistIds]);

  useEffect(() => {
    if (!currentUser) {
      setToday(null);
      setRecentSessions([]);
      return;
    }

    const cachedToday = readCachedTodayView(currentUser.id);
    const cachedRecordDay = readCachedRecordDayView(
      currentUser.id,
      todayIsoDate,
    );

    setToday(cachedToday);
    hydrateChecklistSyncTracker(
      checklistSyncRef.current,
      cachedToday?.checklistItems ?? [],
    );
    applyConversationSessionsState({
      recordDay: cachedRecordDay,
      isLoadingRecordDay: false,
    });
  }, [applyConversationSessionsState, currentUser, todayIsoDate]);

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

      setHasAttemptedInfoViewed(false);

      if (!hasFreshCachedTodayView(currentUser.id)) {
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
      }

      const cachedRecordDay = readCachedRecordDayView(
        currentUser.id,
        todayIsoDate,
      );
      const shouldLoadRecordDay = !hasFreshCachedRecordDayView(
        currentUser.id,
        todayIsoDate,
      );

      applyConversationSessionsState({
        recordDay: cachedRecordDay,
        isLoadingRecordDay: shouldLoadRecordDay,
      });

      if (shouldLoadRecordDay) {
        void services.homePort
          .getRecordDay(todayIsoDate)
          .then((nextRecordDay) => {
            applyConversationSessionsState({
              recordDay: nextRecordDay,
              isLoadingRecordDay: false,
            });
          })
          .catch(() => {
            applyConversationSessionsState({
              recordDay: cachedRecordDay,
              isLoadingRecordDay: false,
            });
          });
      }
    }, [
      applyConversationSessionsState,
      currentUser,
      isRestoringSession,
      router,
      services,
      todayIsoDate,
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
    if (openingSessionIdRef.current === sessionId) {
      return;
    }

    openingSessionIdRef.current = sessionId;
    setConversationOpenError(null);
    const prefetch = services.chatPort
      .getSession(sessionId)
      .then((session) => {
        replaceSession(sessionId, session);
      })
      .catch(() => {
        // 채팅 화면에서 상세 불러오기를 다시 시도합니다.
      });

    requestAnimationFrame(() => {
      InteractionManager.runAfterInteractions(() => {
        router.push(`/chat/${sessionId}`);
        void prefetch.finally(() => {
          setTimeout(() => {
            openingSessionIdRef.current = null;
          }, 400);
        });
      });
    });
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
    isLoadingConversationSessions,
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
