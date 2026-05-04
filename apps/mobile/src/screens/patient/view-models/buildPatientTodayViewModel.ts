import type {
  TodayViewData,
} from "@gynecology-chatbot/app-core";
import { DEFAULT_TODAY_GUIDE } from "./patient-copy.ts";

export function buildPatientTodayViewModel({
  today,
}: {
  today: TodayViewData | null;
}) {
  const checklistItems = today?.checklistItems ?? [];
  const completedCount = checklistItems.filter((item) => item.completed).length;
  const progressLabel = `${completedCount}/${checklistItems.length}`;
  const progressPercent = checklistItems.length
    ? Math.round((completedCount / checklistItems.length) * 100)
    : 0;

  return {
    heroTitle: "오늘,우리",
    heroDescription: DEFAULT_TODAY_GUIDE,
    sections: [
      { id: "info", label: "아기와 엄마" },
      { id: "checklist", label: "체크리스트" },
      { id: "conversation", label: "아기와 대화" },
    ],
    babyCard: {
      title: "오늘 아기는요",
      body: today?.babyBody ?? "오늘 아기의 변화를 준비 중이에요.",
    },
    momCard: {
      title: "오늘 엄마는요",
      body: today?.momBody ?? "오늘 엄마의 변화를 준비 중이에요.",
    },
    checklistTitle: "오늘의 체크리스트",
    checklistItems,
    checklistProgressLabel: progressLabel,
    checklistProgressPercent: progressPercent,
    conversationTitle: "아기와 대화",
    conversationDescription: "아기에게 하고 싶은 이야기를 나눠보세요.",
  };
}
