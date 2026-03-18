import type {
  ChatMessage,
  ChatSession,
  HomeViewData,
  RecentChatSummary,
  RecordDayView,
} from "@gynecology-chatbot/app-core";

type SessionRow = {
  id: string;
  title: string;
  last_message_at: string | null;
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
};

type CalendarRow = {
  date: string;
  summary: string | null;
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
};

function normalizeDateKey(value: string | Date) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const match = value.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : value;
}

function toLocalDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatRecentChatLabel(value: string | null) {
  if (!value) {
    return "방금 전";
  }

  const date = new Date(value);
  const today = new Date();
  const todayKey = toLocalDateKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = toLocalDateKey(yesterday);
  const dateKey = toLocalDateKey(date);
  const timeLabel = date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
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
  });
}

export function toRecentChats(sessions: SessionRow[]): RecentChatSummary[] {
  return sessions.map((session) => ({
    id: session.id,
    title: session.title,
    preview: "세션 상세에서 최근 메시지를 표시합니다.",
    updatedAtLabel: formatRecentChatLabel(session.last_message_at),
    updatedAtIso: session.last_message_at,
  }));
}

export function toChatSession(
  session: SessionRow,
  messages: MessageRow[],
): ChatSession {
  return {
    id: session.id,
    title: session.title,
    messages: messages.map((message) => ({
      id: message.id,
      role: message.role === "system" ? "assistant" : message.role,
      createdAtLabel: new Date(message.created_at).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
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
}): HomeViewData {
  const daysInMonth =
    new Date(`${input.month}-01T00:00:00`).getMonth() === 1 ? 28 : 31;
  const calendarMap = new Map(
    input.calendarRows.map((row) => [normalizeDateKey(row.date), row]),
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
      emotionTone: emotionMap.get(isoDate) ?? null,
      summary: calendarMap.get(isoDate)?.summary ?? undefined,
    };
  });

  const week = input.profile?.pregnancy_week;
  const dayInWeek = input.profile?.pregnancy_day_in_week;

  return {
    userName: input.user.display_name,
    pregnancyDayCount: input.profile?.pregnancy_day_count ?? 0,
    pregnancyWeekLabel: week ? `${week}주 ${dayInWeek ?? 0}일` : "정보 없음",
    currentMonthLabel: new Date(
      `${input.month}-01T00:00:00`,
    ).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
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
  };
}

export function toRecordDayView(input: {
  isoDate: string;
  emotionTone: HomeViewData["calendarDays"][number]["emotionTone"];
  records: RecordDayRow[];
  relatedSessions: SessionRow[];
}): RecordDayView {
  return {
    isoDate: input.isoDate,
    dateLabel: new Date(`${input.isoDate}T00:00:00`).toLocaleDateString(
      "ko-KR",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      },
    ),
    emotionTone: input.emotionTone,
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
