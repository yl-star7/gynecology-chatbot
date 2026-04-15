const DEFAULT_NOTIFICATION_TIME = "08:30";

export type DailyLocalNotificationRequest = {
  title: string;
  body: string;
  data: Record<string, string>;
  trigger: {
    hour: number;
    minute: number;
  };
};

export function parseDailyNotificationTime(value?: string | null) {
  const compact = (value ?? DEFAULT_NOTIFICATION_TIME).trim().replace(/\s+/g, "");
  const match =
    compact.match(/^(\d{1,2}):(\d{1,2})$/) ??
    compact.match(/^(\d{1,2})(\d{2})$/);

  if (!match) {
    return { hour: 8, minute: 30 };
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return { hour: 8, minute: 30 };
  }

  return { hour, minute };
}

function parsePregnancyWeek(pregnancyWeekLabel?: string | null) {
  const match = pregnancyWeekLabel?.match(/(\d+)\s*주/);
  if (!match) {
    return null;
  }

  const week = Number(match[1]);
  return Number.isInteger(week) && week > 0 ? week : null;
}

export function buildDailyLocalNotificationRequest(input: {
  notificationTime?: string | null;
  pregnancyWeekLabel?: string | null;
}): DailyLocalNotificationRequest {
  const pregnancyWeek = parsePregnancyWeek(input.pregnancyWeekLabel);

  return {
    title: pregnancyWeek ? `[${pregnancyWeek}주차] 오늘은 어때요?` : "오늘은 어때요?",
    body: "오늘의 변화를 함께 확인해보세요.",
    data: { type: "daily_tip" },
    trigger: parseDailyNotificationTime(input.notificationTime),
  };
}
