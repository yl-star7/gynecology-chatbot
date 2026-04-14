import { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import type { ChatMessage, RecentChatSummary, TodayViewData } from "@gynecology-chatbot/app-core";
import { useMobileServices } from "../../core/MobileServicesProvider";
import { buildPatientTodayViewModel } from "./view-models";

const EMPTY_BABY_BODY = "오늘 아기의 변화를 준비 중이에요.";

export function appendAssistantMessages(
  currentMessages: ChatMessage[],
  assistantMessages: ChatMessage[],
) {
  return [...currentMessages, ...assistantMessages];
}

export function usePatientTodayScreenModel() {
  const router = useRouter();
  const services = useMobileServices();
  const [today, setToday] = useState<TodayViewData | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentChatSummary[]>([]);
  const [activeSection, setActiveSection] = useState("info");
  const [pendingChecklistIds, setPendingChecklistIds] = useState<string[]>([]);
  const [hasAttemptedInfoViewed, setHasAttemptedInfoViewed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      Promise.all([
        services.todayPort.getTodayView(),
        services.chatPort.listRecentChats(),
      ])
        .then(([nextToday, nextRecentSessions]) => {
          setToday(nextToday);
          setRecentSessions(nextRecentSessions);
          setHasAttemptedInfoViewed(false);
        })
        .catch(() => undefined);
    }, [services]),
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
    setToday((current) =>
      current ? { ...current, infoViewed: true } : current,
    );

    services.todayPort.markInfoViewed().catch(() => {
      setToday((current) =>
        current ? { ...current, infoViewed: false } : current,
      );
    });
  }, [
    activeSection,
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
    setToday((current) =>
      current
        ? {
            ...current,
            checklistItems: current.checklistItems.map((item) =>
              item.id === checklistId ? { ...item, completed } : item,
            ),
          }
        : current,
    );

    services.todayPort
      .setChecklistItemCompleted({
        checklistId,
        completed,
      })
      .catch(() => {
        setToday((current) =>
          current
            ? {
                ...current,
                checklistItems: current.checklistItems.map((item) =>
                  item.id === checklistId
                    ? { ...item, completed: !completed }
                    : item,
                ),
              }
            : current,
        );
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
    router.push(`/chat/${sessionId}`);
  }

  function openOnboarding() {
    router.push("/onboarding");
  }

  return {
    activeSection,
    setActiveSection,
    pendingChecklistIds,
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
