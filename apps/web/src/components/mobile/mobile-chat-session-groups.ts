import type { RecentChatSummary } from "@gynecology-chatbot/app-core";
import {
  addCalendarDays,
  createKoreanDateKey,
  parseIsoDateKey,
} from "@gynecology-chatbot/app-core/time";

export interface ChatSessionGroup {
  dateKey: string;
  label: string;
  sessions: RecentChatSummary[];
}

function toDateKey(date: Date) {
  return createKoreanDateKey(date);
}

function formatGroupLabel(dateKey: string, now: Date) {
  const todayKey = toDateKey(now);
  const yesterdayKey = addCalendarDays(todayKey, -1);

  if (dateKey === todayKey) {
    return "오늘";
  }

  if (dateKey === yesterdayKey) {
    return "어제";
  }

  const { year, month, day } = parseIsoDateKey(dateKey);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "UTC",
  });
}

export function groupChatSessionsByDate(
  sessions: RecentChatSummary[],
  now = new Date(),
) {
  const groups = new Map<string, RecentChatSummary[]>();

  sessions.forEach((session) => {
    const dateKey = session.updatedAtIso
      ? toDateKey(new Date(session.updatedAtIso))
      : toDateKey(now);
    const current = groups.get(dateKey) ?? [];
    current.push(session);
    groups.set(dateKey, current);
  });

  return Array.from(groups.entries())
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([dateKey, groupedSessions]) => ({
      dateKey,
      label: formatGroupLabel(dateKey, now),
      sessions: [...groupedSessions].sort((left, right) => {
        const leftTime = left.updatedAtIso
          ? new Date(left.updatedAtIso).getTime()
          : 0;
        const rightTime = right.updatedAtIso
          ? new Date(right.updatedAtIso).getTime()
          : 0;
        return rightTime - leftTime;
      }),
    })) satisfies ChatSessionGroup[];
}
