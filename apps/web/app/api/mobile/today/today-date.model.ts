import {
  createKoreanDateKey,
  diffCalendarDays,
} from "@gynecology-chatbot/app-core/time";

const MAX_PREGNANCY_DAYS = 294;

export function createKstDateKey(now = new Date()) {
  return createKoreanDateKey(now);
}

export function calculateCurrentPregnancyWeek(
  dueDate: string,
  todayIsoDate = createKstDateKey(),
): {
  week: number;
  dayInWeek: number;
  postDue: boolean;
} {
  const diffDays = diffCalendarDays(dueDate, todayIsoDate);
  const pregnancyDayCount = Math.max(
    0,
    Math.min(MAX_PREGNANCY_DAYS, MAX_PREGNANCY_DAYS - diffDays),
  );
  const postDue = diffDays < 0;

  if (postDue) {
    return { week: 40, dayInWeek: 0, postDue: true };
  }

  const rawWeek = Math.floor(pregnancyDayCount / 7);
  const week = Math.max(1, Math.min(42, rawWeek));
  const dayInWeek = pregnancyDayCount % 7;
  return { week, dayInWeek, postDue: false };
}
