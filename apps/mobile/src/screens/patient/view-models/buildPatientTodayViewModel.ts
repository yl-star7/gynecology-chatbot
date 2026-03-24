import type {
  ChatSession,
  HomeViewData,
  MobileProfileViewData,
  RecentChatSummary,
} from "@gynecology-chatbot/app-core";
import {
  DEFAULT_BABY_NAME,
  DEFAULT_CHECKLIST,
  DEFAULT_TODAY_GUIDE,
} from "./patient-copy";

function buildChecklist(session: ChatSession | null) {
  const completedCount = Math.min(session?.messages.length ?? 0, DEFAULT_CHECKLIST.length);

  return DEFAULT_CHECKLIST.map((label, index) => ({
    id: `today-check-${index + 1}`,
    label,
    completed: index < completedCount,
  }));
}

export function buildPatientTodayViewModel({
  home,
  profile,
  session,
  recentSessions,
}: {
  home: HomeViewData | null;
  profile: MobileProfileViewData | null;
  session: ChatSession | null;
  recentSessions: RecentChatSummary[];
}) {
  const babyName = profile?.babyNickname?.trim() || DEFAULT_BABY_NAME;
  const checklistItems = buildChecklist(session);
  const completedCount = checklistItems.filter((item) => item.completed).length;
  const progressLabel = `${completedCount}/${checklistItems.length}`;

  return {
    heroTitle: "오늘,우리",
    heroDescription: DEFAULT_TODAY_GUIDE,
    sections: [
      { id: "baby", label: "오늘 아기는요" },
      { id: "mom", label: "오늘 엄마는요" },
      { id: "checklist", label: "함께 해봐요" },
      { id: "conversation", label: "아기와 나누는 마음" },
    ],
    babyCard: {
      title: "오늘 아기는요",
      body: `${babyName}는 ${home?.pregnancyWeekLabel ?? profile?.pregnancyWeekLabel ?? "지금의 주차"}에 맞춰 조금씩 자라고 있어요.`,
    },
    momCard: {
      title: "오늘 엄마는요",
      body:
        profile?.tonePreference?.trim()
          ? `오늘은 ${profile.tonePreference} 톤으로 몸 상태를 정리해드릴게요.`
          : "오늘 몸과 마음의 변화를 천천히 살펴보면 좋아요.",
    },
    checklistTitle: "함께 해봐요",
    checklistItems,
    checklistProgressLabel: progressLabel,
    conversationTitle: "아기와 나누는 마음",
    conversationDescription:
      session?.messages?.length
        ? "오늘 남긴 대화를 이어서 정리해볼 수 있어요."
        : "아기에게 하고 싶은 말을 먼저 적어보면 오늘 흐름이 더 자연스럽게 이어져요.",
    sessionTitle: session?.title ?? "오늘의 대화",
    recentSessions: recentSessions.slice(0, 3),
  };
}
