import {
  calculatePregnancyPositionFromDueDate,
  createKoreanDateKey,
} from "@gynecology-chatbot/app-core/time";

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
  const position = calculatePregnancyPositionFromDueDate(dueDate, todayIsoDate);
  return {
    week: position.weekNumber,
    dayInWeek: position.dayNumber - 1,
    postDue: position.postDue,
  };
}
