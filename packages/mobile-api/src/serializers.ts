import type {
  ChatMessage,
  ChatSession,
  HomeViewData,
  RecentChatSummary,
  RecordDayView,
  TodayChecklistItem,
} from "@gynecology-chatbot/app-core";
import {
  addCalendarDays,
  calculatePregnancyPositionFromDueDate,
  createKoreanDateKey,
  diffCalendarDays,
  MAX_MANUAL_PREGNANCY_DAYS,
  PREGNANCY_TERM_DAYS,
} from "@gynecology-chatbot/app-core/time";

function getKstDateKey(now = new Date()) {
  return createKoreanDateKey(now);
}

function computePregnancyDayCountFromDueDate(
  dueDate?: string | null,
  fallback?: number,
): number {
  if (dueDate) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      const diffDays = diffCalendarDays(dueDate, getKstDateKey());
      return Math.max(
        0,
        Math.min(PREGNANCY_TERM_DAYS, PREGNANCY_TERM_DAYS - diffDays),
      );
    }
  }
  const raw = fallback ?? 0;
  return Math.max(0, Math.min(MAX_MANUAL_PREGNANCY_DAYS, raw));
}

type SessionRow = {
  id: string;
  title: string;
  last_message_at: string | null;
  last_message_preview?: string | null;
};

type MessagePreviewPart = {
  type?: string;
  text?: string;
  choices?: unknown[] | null;
};

type MessageRow = {
  id: string;
  role: "user" | "assistant" | "system";
  parts: ChatMessage["parts"];
  created_at: string;
};

type UserRow = {
  display_name: string;
};

type PregnancyProfileRow = {
  pregnancy_day_count: number;
  pregnancy_week: number | null;
  pregnancy_day_in_week: number | null;
  due_date?: string | null;
};

type CalendarRow = {
  date: string;
  summary: string | null;
  entry_type?: string | null;
};

type EmotionRow = {
  date: string;
  emotion_tone: HomeViewData["calendarDays"][number]["emotionTone"];
};

type RecordDayRow = {
  id: string;
  title: string;
  summary: string | null;
  entry_type: string;
  session_id: string | null;
  payload?: Record<string, unknown> | null;
};

function computePregnancyWeekLabelFromDueDate(dueDate?: string | null) {
  if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return null;
  }

  const position = calculatePregnancyPositionFromDueDate(dueDate);
  return `${position.weekNumber}주 ${position.dayNumber - 1}일`;
}

function normalizeDateKey(value: string | Date) {
  if (value instanceof Date) {
    return getKstDateKey(value);
  }

  const match = value.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : value;
}

function parseMonth(value: string) {
  const [yearText, monthText] = value.split("-");
  return {
    year: Number(yearText),
    monthIndex: Number(monthText) - 1,
  };
}

function getMonthStartDate(value: string) {
  const { year, monthIndex } = parseMonth(value);
  return new Date(Date.UTC(year, monthIndex, 1));
}

function getDaysInMonth(value: string) {
  const { year, monthIndex } = parseMonth(value);
  return new Date(year, monthIndex + 1, 0).getDate();
}

function formatRecentChatLabel(value: string | null) {
  if (!value) {
    return "방금 전";
  }

  const date = new Date(value);
  const todayKey = getKstDateKey();
  const yesterdayKey = addCalendarDays(todayKey, -1);
  const dateKey = getKstDateKey(date);
  const timeLabel = date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  });

  if (dateKey === todayKey) {
    return `오늘 ${timeLabel}`;
  }

  if (dateKey === yesterdayKey) {
    return `어제 ${timeLabel}`;
  }

  return date.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  });
}

export function resolveRecentChatPreview(input: {
  plainText?: string | null;
  parts?: MessagePreviewPart[] | null;
}) {
  const plainText = input.plainText?.replace(/\s+/g, " ").trim();
  if (plainText) {
    return plainText;
  }

  const quickRepliesCount = input.parts?.find(
    (part) =>
      part?.type === "quickReplies" &&
      Array.isArray(part.choices) &&
      part.choices.length > 0,
  )?.choices?.length;
  if (typeof quickRepliesCount === "number" && quickRepliesCount > 0) {
    return `event {actions(${quickRepliesCount})}`;
  }

  const surveyCount = input.parts?.find(
    (part) =>
      part?.type === "survey" &&
      Array.isArray(part.choices) &&
      part.choices.length > 0,
  )?.choices?.length;
  if (typeof surveyCount === "number" && surveyCount > 0) {
    return `event {actions(${surveyCount})}`;
  }

  const partsText = (input.parts ?? [])
    .flatMap((part) =>
      part.type === "text" && typeof part.text === "string" ? [part.text] : [],
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (partsText) {
    return partsText;
  }

  const firstEventPart = input.parts?.find(
    (part) => typeof part?.type === "string" && part.type !== "text",
  );
  if (firstEventPart?.type) {
    return `event {${firstEventPart.type}}`;
  }

  return null;
}

export function toRecentChats(sessions: SessionRow[]): RecentChatSummary[] {
  return [...sessions]
    .sort((left, right) => {
      const leftTime = left.last_message_at
        ? new Date(left.last_message_at).getTime()
        : 0;
      const rightTime = right.last_message_at
        ? new Date(right.last_message_at).getTime()
        : 0;
      return rightTime - leftTime;
    })
    .map((session) => ({
      id: session.id,
      title: session.title,
      preview:
        resolveRecentChatPreview({
          plainText: session.last_message_preview,
        }) || "",
      updatedAtLabel: formatRecentChatLabel(session.last_message_at),
      updatedAtIso: session.last_message_at,
    }));
}

export function toChatSession(
  session: SessionRow,
  messages: MessageRow[],
): ChatSession {
  const fallbackLastMessageAt =
    messages.length > 0 ? messages[messages.length - 1].created_at : null;

  return {
    id: session.id,
    title: session.title,
    lastMessageAtIso: session.last_message_at ?? fallbackLastMessageAt,
    messages: messages.map((message) => ({
      id: message.id,
      role: message.role === "system" ? "assistant" : message.role,
      createdAtLabel: new Date(message.created_at).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Seoul",
      }),
      parts: message.parts,
    })),
  };
}

export function toHomeViewData(input: {
  user: UserRow;
  profile: PregnancyProfileRow | null;
  calendarRows: CalendarRow[];
  emotionRows?: EmotionRow[];
  month: string;
  homeCopyItems?: HomeViewData["homeCopyItems"];
}): HomeViewData {
  const monthDate = getMonthStartDate(input.month);
  const daysInMonth = getDaysInMonth(input.month);
  const calendarMap = new Map(
    input.calendarRows.map((row) => [normalizeDateKey(row.date), row]),
  );
  const infoDates = new Set(
    input.calendarRows
      .filter((row) => row.entry_type === "today_info_view")
      .map((row) => normalizeDateKey(row.date)),
  );
  const emotionMap = new Map(
    (input.emotionRows ?? []).map((row) => [
      normalizeDateKey(row.date),
      row.emotion_tone,
    ]),
  );

  const calendarDays = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const isoDate = `${input.month}-${String(day).padStart(2, "0")}`;
    return {
      isoDate,
      dayLabel: String(day),
      hasChat: calendarMap.has(isoDate),
      hasInfo: infoDates.has(isoDate),
      emotionTone: emotionMap.get(isoDate) ?? null,
      summary: calendarMap.get(isoDate)?.summary ?? undefined,
    };
  });

  const week = input.profile?.pregnancy_week;
  const dayInWeek = input.profile?.pregnancy_day_in_week;
  const pregnancyDayCount = computePregnancyDayCountFromDueDate(
    input.profile?.due_date,
    input.profile?.pregnancy_day_count ?? 0,
  );

  const pregnancyWeekLabel = input.profile?.due_date
    ? computePregnancyWeekLabelFromDueDate(input.profile.due_date)
    : week
      ? `${week}주 ${dayInWeek ?? 0}일`
      : null;

  return {
    userName: input.user.display_name,
    pregnancyDayCount,
    pregnancyWeekLabel: pregnancyWeekLabel ?? "정보 없음",
    currentMonthLabel: monthDate.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      timeZone: "UTC",
    }),
    calendarDays,
    notebookCard: {
      id: "notebook",
      title: "임신수첩",
      description: "저장 답변과 체크리스트를 확인합니다.",
      href: "/(tabs)/notebook",
    },
    knowledgeCard: {
      id: "knowledge",
      title: "임신 지식",
      description: "임신 주차별 지식 문서를 확인합니다.",
      href: "/(tabs)/knowledge",
    },
    homeCopyItems: input.homeCopyItems ?? [],
  };
}

export function toRecordDayView(input: {
  isoDate: string;
  infoViewed: boolean;
  emotionTone: HomeViewData["calendarDays"][number]["emotionTone"];
  checklistItems: TodayChecklistItem[];
  conversationSummary?: string | null;
  dailyQuestion?: {
    question: string;
    answer: string | null;
    aiSummary: string | null;
  } | null;
  dailyQuestions?: RecordDayView["dailyQuestions"];
  records: RecordDayRow[];
  relatedSessions: SessionRow[];
}): RecordDayView {
  const dailyQuestions =
    input.dailyQuestions ??
    (input.dailyQuestion
      ? [
          {
            id: "daily-question",
            question: input.dailyQuestion.question,
            answerSummary:
              input.dailyQuestion.aiSummary ?? input.dailyQuestion.answer,
          },
        ]
      : []);

  return {
    isoDate: input.isoDate,
    dateLabel: new Date(`${input.isoDate}T00:00:00.000Z`).toLocaleDateString(
      "ko-KR",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
        timeZone: "UTC",
      },
    ),
    infoViewed: input.infoViewed,
    emotionTone: input.emotionTone,
    checklistItems: input.checklistItems,
    conversationSummary: input.conversationSummary ?? undefined,
    dailyQuestion:
      input.dailyQuestion ??
      (dailyQuestions[0]
        ? {
            question: dailyQuestions[0].question,
            answer: dailyQuestions[0].answerSummary,
            aiSummary: dailyQuestions[0].answerSummary,
          }
        : null),
    dailyQuestions,
    records: input.records.map((record) => ({
      id: record.id,
      title: record.title,
      summary: record.summary ?? undefined,
      entryType: record.entry_type,
      linkedSessionId: record.session_id,
    })),
    relatedSessions: toRecentChats(input.relatedSessions),
  };
}
