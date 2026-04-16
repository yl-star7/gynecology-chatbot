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
  cacheTodayView,
  hasFreshCachedRecentChats,
  hasFreshCachedRecordDayView,
  hasFreshCachedTodayView,
  readCachedRecentChats,
  readCachedRecordDayView,
  readCachedTodayView,
} from "../../core/patientViewCache";
import { prefetchConversationSession } from "./patientConversationNavigation.model";
import { resolvePatientConversationLoadError } from "./patientErrorCopy.model";
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
    setRecentSessions(
      cachedRecordDay?.relatedSessions ?? cachedRecentChats ?? [],
    );
  }, [currentUser, todayIsoDate]);

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
          setRecentSessions(
            nextRecordDay.relatedSessions.length > 0
              ? nextRecordDay.relatedSessions
              : nextRecentChats,
          );
          setHasAttemptedInfoViewed(false);
        })
        .catch(() => undefined);
    }, [currentUser, isRestoringSession, router, services, todayIsoDate]),
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

  async function openRecentSession(sessionId: string) {
    setConversationOpenError(null);

    try {
      await prefetchConversationSession({
        sessionId,
        getSession: services.chatPort.getSession.bind(services.chatPort),
        replaceSession,
      });
      router.push(`/chat/${sessionId}`);
    } catch (error: unknown) {
      setConversationOpenError(resolvePatientConversationLoadError(error));
    }
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
