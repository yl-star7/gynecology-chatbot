import type { CalendarDay, RecordDayView } from "@gynecology-chatbot/app-core";
import {
  createPregnancyWeekState,
  getPregnancyWeekImageLabel,
} from "./pregnancyWeek.model.ts";

type InfoCard = {
  id: string;
  title: string;
  body: string;
};

type StatusTone = "success" | "active" | "muted" | "idle";

type StatusBadge = {
  label: string;
  tone: StatusTone;
};

export function resolveProfileBabyImageWeekLabel(input: {
  homePregnancyWeekLabel?: string | null;
  profilePregnancyWeekLabel?: string | null;
  dueDate?: string | null;
  now?: Date;
}) {
  return getPregnancyWeekImageLabel(
    createPregnancyWeekState({
      homePregnancyWeekLabel: input.homePregnancyWeekLabel,
      profilePregnancyWeekLabel: input.profilePregnancyWeekLabel,
      dueDate: input.dueDate,
      now: input.now,
    }),
  );
}

function isSameIsoDate(isoDate: string, now: Date) {
  const todayIsoDate = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  return isoDate === todayIsoDate;
}

function resolveChecklistStatus(recordDay: RecordDayView | null): StatusBadge {
  const checklistItems = recordDay?.checklistItems ?? [];

  if (checklistItems.length === 0) {
    return { label: "안함", tone: "idle" };
  }

  const completedCount = checklistItems.filter((item) => item.completed).length;

  if (completedCount === checklistItems.length) {
    return { label: "완료", tone: "success" };
  }

  return { label: "미완", tone: "muted" };
}

function resolveInfoStatus(
  selectedDay: CalendarDay | null,
  isToday: boolean,
): StatusBadge {
  if (isToday || selectedDay?.hasInfo || selectedDay?.summary) {
    return { label: "확인함", tone: "success" };
  }

  return { label: "안함", tone: "idle" };
}

function buildConversationSummary(recordDay: RecordDayView | null) {
  if (recordDay?.conversationSummary) {
    return recordDay.conversationSummary;
  }

  const sessions = recordDay?.relatedSessions ?? [];
  if (sessions.length === 0) {
    return "이 날짜에 남겨진 대화가 아직 없어요.";
  }

  return `${sessions.length}개의 대화가 있었어요. 다음 날 정리되는 하루 요약이 준비되면 여기에서 함께 보여드릴게요.`;
}

function buildHeartShareItems(recordDay: RecordDayView | null) {
  if (recordDay?.dailyQuestion) {
    return [
      {
        id: "question",
        question: recordDay.dailyQuestion.question,
        answer: recordDay.dailyQuestion.answer ?? "아직 남긴 답변이 없어요.",
        summary:
          recordDay.dailyQuestion.aiSummary ?? "대화 요약을 준비 중이에요.",
      },
    ];
  }

  const aiSummary = recordDay?.records.find(
    (item) => item.entryType === "ai_summary",
  );
  const linkedSession = recordDay?.relatedSessions[0] ?? null;

  if (!aiSummary && !linkedSession) {
    return [];
  }

  return [
    {
      id: "question",
      question: "하루 질문",
      answer: aiSummary?.title ?? "이날의 질문 기록을 준비 중이에요.",
      summary:
        aiSummary?.summary ??
        linkedSession?.preview ??
        "대화 요약을 준비 중이에요.",
    },
  ];
}

function hasConversation(recordDay: RecordDayView | null) {
  if (!recordDay) {
    return false;
  }

  if ((recordDay.relatedSessions?.length ?? 0) > 0) {
    return true;
  }

  if (recordDay.dailyQuestion?.answer || recordDay.dailyQuestion?.aiSummary) {
    return true;
  }

  return recordDay.records.some(
    (item) => item.entryType === "ai_summary" || item.linkedSessionId,
  );
}

export function buildProfileDayState(input: {
  selectedIsoDate?: string | null;
  selectedDay?: CalendarDay | null;
  selectedRecordDay?: RecordDayView | null;
  hasRecordDayError?: boolean;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const selectedIsToday = input.selectedIsoDate
    ? isSameIsoDate(input.selectedIsoDate, now)
    : false;

  if (input.hasRecordDayError) {
    return {
      selectedIsToday,
      checklistStatus: { label: "불러오는 중", tone: "idle" } as StatusBadge,
      infoStatus: { label: "불러오는 중", tone: "idle" } as StatusBadge,
      conversationStatus: {
        label: "불러오는 중",
        tone: "idle",
      } as StatusBadge,
      conversationSummary: "이 날짜 기록을 다시 불러오는 중이에요.",
      heartShareItems: [],
    };
  }

  const mergedSelectedDay = input.selectedRecordDay
    ? ({
        ...(input.selectedDay ?? {
          isoDate: input.selectedIsoDate ?? "",
          dayLabel: "",
          hasChat: false,
          hasInfo: false,
          emotionTone: null,
        }),
        hasInfo: input.selectedRecordDay.infoViewed,
      } as CalendarDay)
    : (input.selectedDay ?? null);

  return {
    selectedIsToday,
    checklistStatus: resolveChecklistStatus(input.selectedRecordDay ?? null),
    infoStatus: resolveInfoStatus(mergedSelectedDay, selectedIsToday),
    conversationStatus: {
      label: hasConversation(input.selectedRecordDay ?? null) ? "했음" : "안함",
      tone: hasConversation(input.selectedRecordDay ?? null) ? "active" : "idle",
    } as StatusBadge,
    conversationSummary: buildConversationSummary(input.selectedRecordDay ?? null),
    heartShareItems: buildHeartShareItems(input.selectedRecordDay ?? null),
  };
}

export function buildProfileInfoCards(input: {
  today: {
    babyBody?: string | null;
    momBody?: string | null;
  } | null;
  recordDay:
    | {
        infoCards?: InfoCard[] | null;
      }
    | null;
}) {
  if (input.recordDay) {
    if ((input.recordDay.infoCards?.length ?? 0) > 0) {
      return input.recordDay.infoCards!;
    }

    return [
      {
        id: "baby",
        title: "이 날 아기는요",
        body: "이 날짜의 아기 정보를 아직 준비하지 못했어요.",
      },
      {
        id: "mom",
        title: "이 날 엄마는요",
        body: "이 날짜의 엄마 정보를 아직 준비하지 못했어요.",
      },
    ];
  }

  return [
    {
      id: "baby",
      title: "오늘 아기는요",
      body: input.today?.babyBody ?? "오늘 아기의 변화를 아직 준비하지 못했어요.",
    },
    {
      id: "mom",
      title: "오늘 엄마는요",
      body: input.today?.momBody ?? "오늘 엄마의 변화를 아직 준비하지 못했어요.",
    },
  ];
}
