import { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import type {
  ChatMessage,
  RecentChatSummary,
  TodayViewData,
} from "@gynecology-chatbot/app-core";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { useMobileServices } from "../../core/MobileServicesProvider";
import { useChatSessions } from "../../chat/store";
import {
  cacheRecordDayView,
  cacheTodayView,
  clearCachedHomeView,
  hasFreshCachedChatSession,
  hasFreshCachedRecentChats,
  hasFreshCachedRecordDayView,
  hasFreshCachedTodayView,
  readCachedRecentChats,
  readCachedRecordDayView,
  readCachedTodayView,
} from "../../core/patientViewCache";
import { warmConversationSessions } from "./patientConversationNavigation.model";
import { buildPatientTodayViewModel } from "./view-models";

const EMPTY_BABY_BODY = "오늘 아기의 변화를 준비 중이에요.";

function createTodayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function appendAssistantMessages(
  currentMessages: ChatMessage[],
  assistantMessages: ChatMessage[],
) {
  return [...currentMessages, ...assistantMessages];
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
  const todayIsoDate = createTodayIsoDate();

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
    const cachedRecentChats = readCachedRecentChats(currentUser.id);

    setToday(cachedToday);
    const nextRecentSessions =
      cachedRecordDay?.relatedSessions ?? cachedRecentChats ?? [];
    setRecentSessions(nextRecentSessions);
    warmRecentSessionDetails(nextRecentSessions);
  }, [currentUser, todayIsoDate, warmRecentSessionDetails]);

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
        hasFreshCachedTodayView(currentUser.id) &&
        (hasFreshCachedRecordDayView(currentUser.id, todayIsoDate) ||
          hasFreshCachedRecentChats(currentUser.id))
      ) {
        setToday(readCachedTodayView(currentUser.id));
        setRecentSessions(
          readCachedRecordDayView(currentUser.id, todayIsoDate)
            ?.relatedSessions ??
            readCachedRecentChats(currentUser.id) ??
            [],
        );
        warmRecentSessionDetails(
          readCachedRecordDayView(currentUser.id, todayIsoDate)
            ?.relatedSessions ??
            readCachedRecentChats(currentUser.id) ??
            [],
        );
        setHasAttemptedInfoViewed(false);
        return;
      }

      Promise.all([
        services.todayPort.getTodayView(),
        services.homePort.getRecordDay(todayIsoDate),
        services.chatPort.listRecentChats(),
      ])
        .then(([nextToday, nextRecordDay, nextRecentChats]) => {
          setToday(nextToday);
          const nextRecentSessions =
            nextRecordDay.relatedSessions.length > 0
              ? nextRecordDay.relatedSessions
              : nextRecentChats;
          setRecentSessions(nextRecentSessions);
          warmRecentSessionDetails(nextRecentSessions);
          setHasAttemptedInfoViewed(false);
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
    if (!today || pendingChecklistIds.includes(checklistId)) {
      return;
    }

    setPendingChecklistIds((current) => [...current, checklistId]);
    setToday((current) => {
      if (!currentUser || !current) {
        return current;
      }

      const nextToday = {
        ...current,
        checklistItems: current.checklistItems.map((item) =>
          item.id === checklistId ? { ...item, completed } : item,
        ),
      };
      cacheTodayView(currentUser.id, nextToday);
      return nextToday;
    });

    if (currentUser) {
      const cachedRecordDay = readCachedRecordDayView(
        currentUser.id,
        todayIsoDate,
      );
      if (cachedRecordDay) {
        cacheRecordDayView(currentUser.id, todayIsoDate, {
          ...cachedRecordDay,
          checklistItems: cachedRecordDay.checklistItems.map((item) =>
            item.id === checklistId ? { ...item, completed } : item,
          ),
        });
      }
      clearCachedHomeView(currentUser.id);
    }

    services.todayPort
      .setChecklistItemCompleted({
        checklistId,
        completed,
      })
      .catch(() => {
        setToday((current) => {
          if (!currentUser || !current) {
            return current;
          }

          const nextToday = {
            ...current,
            checklistItems: current.checklistItems.map((item) =>
              item.id === checklistId
                ? { ...item, completed: !completed }
                : item,
            ),
          };
          cacheTodayView(currentUser.id, nextToday);
          return nextToday;
        });

        if (currentUser) {
          const cachedRecordDay = readCachedRecordDayView(
            currentUser.id,
            todayIsoDate,
          );
          if (cachedRecordDay) {
            cacheRecordDayView(currentUser.id, todayIsoDate, {
              ...cachedRecordDay,
              checklistItems: cachedRecordDay.checklistItems.map((item) =>
                item.id === checklistId
                  ? { ...item, completed: !completed }
                  : item,
              ),
            });
          }
        }
      })
      .finally(() => {
        setPendingChecklistIds((current) =>
          current.filter((id) => id !== checklistId),
        );
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
