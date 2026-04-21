import type { CalendarDay, RecordDayView } from "@gynecology-chatbot/app-core";
import { createKoreanDateKey } from "@gynecology-chatbot/app-core";

type RecordDayWithInfoCards = RecordDayView & {
  infoCards?: ProfileInfoCard[] | null;
};

export type ProfileInfoCard = {
  id: string;
  title: string;
  body: string;
};

export type ProfileStatusTone = "success" | "active" | "muted" | "idle";

export type ProfileStatusBadge = {
  label: string;
  tone: ProfileStatusTone;
};

export type ProfileHeartShareItem = {
  id: string;
  question: string;
  answer: string;
  summary: string;
};

export type ProfileEncyclopediaEntry = {
  sectionTitle: string;
  showCurrentWeekEntry: boolean;
  currentWeekLabel: string;
  currentActionLabel: string;
  currentDescription: string;
  browseActionLabel: string;
  browseDescription: string;
};

const MIN_VISIBLE_WEEK = 5;
const MAX_PREGNANCY_WEEK = 42;

function parsePregnancyWeekNumber(label?: string | null) {
  if (!label) return null;
  const match = label.match(/(\d{1,2})\s*주/);
  if (!match) return null;
  const week = Number(match[1]);
  if (!Number.isInteger(week) || week < 1 || week > MAX_PREGNANCY_WEEK) {
    return null;
  }
  return week;
}

export function buildProfileEncyclopediaEntry(input: {
  pregnancyWeekLabel?: string | null;
}): ProfileEncyclopediaEntry {
  const week = parsePregnancyWeekNumber(input.pregnancyWeekLabel);
  const showCurrentWeekEntry =
    typeof week === "number" && week >= MIN_VISIBLE_WEEK;
  const currentWeekLabel = showCurrentWeekEntry ? `${week}주차` : "주";

  return {
    sectionTitle: "임신백과",
    showCurrentWeekEntry,
    currentWeekLabel,
    currentActionLabel: "이번 주 백과 보기",
    currentDescription: showCurrentWeekEntry
      ? `${currentWeekLabel} 태아 발달, 엄마 몸 변화, 생활 가이드를 차분히 읽어봐요.`
      : "5주차부터 주차별 정보를 차분히 찾아볼 수 있어요.",
    browseActionLabel: "다른 주차 찾아보기",
    browseDescription:
      "5주차부터 이전 주차와 다음 주차 정보도 사전처럼 확인해요.",
  };
}

export function buildProfileChecklistItemState(item: {
  label: string;
  completed: boolean;
}) {
  return {
    accessibilityLabel: `${item.label} ${item.completed ? "완료됨" : "미완료"}`,
    statusLabel: item.completed ? "완료" : "아직",
  };
}

function isSameIsoDate(isoDate: string, now: Date) {
  return isoDate === createKoreanDateKey(now);
}

function resolveChecklistStatus(
  recordDay: RecordDayView | null,
): ProfileStatusBadge {
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
): ProfileStatusBadge {
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

function buildHeartShareItems(
  recordDay: RecordDayView | null,
): ProfileHeartShareItem[] {
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
      checklistStatus: {
        label: "불러오는 중",
        tone: "idle",
      } as ProfileStatusBadge,
      infoStatus: { label: "불러오는 중", tone: "idle" } as ProfileStatusBadge,
      conversationStatus: {
        label: "불러오는 중",
        tone: "idle",
      } as ProfileStatusBadge,
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
      tone: hasConversation(input.selectedRecordDay ?? null)
        ? "active"
        : "idle",
    } as ProfileStatusBadge,
    conversationSummary: buildConversationSummary(
      input.selectedRecordDay ?? null,
    ),
    heartShareItems: buildHeartShareItems(input.selectedRecordDay ?? null),
  };
}

export function buildProfileInfoCards(input: {
  today: {
    babyBody?: string | null;
    momBody?: string | null;
  } | null;
  recordDay: RecordDayView | null;
}): ProfileInfoCard[] {
  const recordDay = input.recordDay as RecordDayWithInfoCards | null;

  if (recordDay) {
    if ((recordDay.infoCards?.length ?? 0) > 0) {
      return recordDay.infoCards ?? [];
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
      body:
        input.today?.babyBody ?? "오늘 아기의 변화를 아직 준비하지 못했어요.",
    },
    {
      id: "mom",
      title: "오늘 엄마는요",
      body:
        input.today?.momBody ?? "오늘 엄마의 변화를 아직 준비하지 못했어요.",
    },
  ];
}
