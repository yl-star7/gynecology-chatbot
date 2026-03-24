import type {
  ChatMessage,
  ChatSession,
  HomeViewData,
  MobileProfileViewData,
  RecentChatSummary,
} from "@gynecology-chatbot/app-core";

function getDaysUntilDue(dueDate?: string | null) {
  if (!dueDate) {
    return null;
  }

  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) {
    return null;
  }

  const diff = due.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function buildWebPatientHomeViewModel({
  home,
  profile,
}: {
  home: HomeViewData | null;
  profile?: Pick<MobileProfileViewData, "babyNickname" | "dueDate"> | null;
}) {
  const heroName = profile?.babyNickname?.trim() || "우리 아기";
  const daysUntilDue = getDaysUntilDue(profile?.dueDate);

  return {
    heroName,
    babyMessage: `${heroName}는 ${home?.pregnancyWeekLabel ?? "지금의 주차"}에 맞춰 차분히 자라고 있어요.`,
    pregnancyWeekLabel: home?.pregnancyWeekLabel ?? "주차 정보를 준비 중이에요",
    pregnancyDayCount: home?.pregnancyDayCount ?? 0,
    metricLabel: daysUntilDue == null ? "함께한 시간" : "만나기까지",
    metricValue: daysUntilDue == null ? `${home?.pregnancyDayCount ?? 0}일` : `${daysUntilDue}일`,
    quote: `${heroName}와 함께 보내는 오늘도 충분히 잘하고 있어요.`,
    note: "몸이 보내는 신호를 너무 급하게 판단하지 말고, 오늘 느낀 것을 차분히 살펴봐요.",
  };
}

export function buildWebPatientTodayViewModel({
  home,
  session,
  recentSessions,
}: {
  home: HomeViewData | null;
  session: ChatSession | null;
  recentSessions: RecentChatSummary[];
}) {
  const completedCount = Math.min(session?.messages.length ?? 0, 3);

  return {
    sections: [
      { id: "baby", label: "오늘 아기는요" },
      { id: "mom", label: "오늘 엄마는요" },
      { id: "checklist", label: "함께 해봐요" },
      { id: "conversation", label: "아기와 나누는 마음" },
    ],
    babyText: `${home?.pregnancyWeekLabel ?? "이번 주"}에 맞춰 오늘도 한 걸음씩 자라고 있어요.`,
    momText: "오늘 몸과 마음의 변화를 천천히 살펴보면 좋아요.",
    checklist: [
      { id: "water", label: "물 한 잔을 천천히 마셔요.", completed: completedCount > 0 },
      { id: "note", label: "몸 상태를 잠깐 기록해요.", completed: completedCount > 1 },
      { id: "talk", label: "아기에게 짧은 인사를 건네요.", completed: completedCount > 2 },
    ],
    recentSessions: recentSessions.slice(0, 3),
    messageCount: session?.messages.length ?? 0,
  };
}

export function extractTextFromMessage(message: ChatMessage) {
  const textPart = message.parts.find((part) => part.type === "text");
  return textPart?.type === "text" ? textPart.text : "이미지 또는 안내가 포함된 메시지예요.";
}

export function resolveRecordBadge(recordDay: {
  emotionTone: "calm" | "joyful" | "anxious" | "tired" | "sad" | null;
}) {
  if (recordDay.emotionTone === "joyful") return { label: "실천함", className: "bg-[#dff3e4] text-[#3d8153]" };
  if (recordDay.emotionTone === "calm") return { label: "차분", className: "bg-[#dfeaf3] text-[#567a96]" };
  if (recordDay.emotionTone === "anxious") return { label: "어려웠음", className: "bg-[#fff0d9] text-[#bd7b24]" };
  if (recordDay.emotionTone === "tired") return { label: "쉬임", className: "bg-[#f0e4d7] text-[#8c6a49]" };
  if (recordDay.emotionTone === "sad") return { label: "위로", className: "bg-[#ece7ee] text-[#7a6d82]" };
  return { label: "미기록", className: "bg-[var(--panel-muted)] text-[var(--text-soft)]" };
}
