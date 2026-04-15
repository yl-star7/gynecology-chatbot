const DEFAULT_NOTIFICATION_TIME = "08:30";
const DEFAULT_ROLLING_NOTIFICATION_DAYS = 14;
const DAILY_LOCAL_NOTIFICATION_IDENTIFIER_PREFIX = "patient-daily-tip";

export type DailyLocalNotificationRequest = {
  title: string;
  body: string;
  data: Record<string, string>;
  trigger: {
    hour: number;
    minute: number;
  };
};

export type RollingDailyLocalNotificationRequest = {
  identifier: string;
  title: string;
  body: string;
  data: Record<string, string>;
  date: Date;
};

function formatLocalDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export type DailyLocalNotificationScheduleInput = {
  notificationTime?: string | null;
  pregnancyWeekLabel?: string | null;
  pregnancyDayCount?: number | null;
};

export function buildDailyLocalNotificationScheduleKey(
  input: DailyLocalNotificationScheduleInput & {
    now?: Date;
  },
) {
  return [
    formatLocalDateKey(input.now ?? new Date()),
    input.notificationTime ?? "",
    input.pregnancyWeekLabel ?? "",
    input.pregnancyDayCount ?? "",
  ].join(":");
}

export async function syncDailyLocalNotificationSchedule(input: {
  profile: DailyLocalNotificationScheduleInput;
  previousScheduleKey?: string | null;
  scheduleLocalNotification: (
    input: DailyLocalNotificationScheduleInput,
  ) => Promise<unknown> | unknown;
  now?: Date;
}) {
  const scheduleInput: DailyLocalNotificationScheduleInput = {
    notificationTime: input.profile.notificationTime,
    pregnancyWeekLabel: input.profile.pregnancyWeekLabel,
    pregnancyDayCount: input.profile.pregnancyDayCount,
  };
  const scheduleKey = buildDailyLocalNotificationScheduleKey({
    ...scheduleInput,
    now: input.now,
  });

  if (input.previousScheduleKey === scheduleKey) {
    return {
      didSchedule: false,
      scheduleInput,
      scheduleKey,
    };
  }

  await input.scheduleLocalNotification(scheduleInput);
  return {
    didSchedule: true,
    scheduleInput,
    scheduleKey,
  };
}

export function parseDailyNotificationTime(value?: string | null) {
  const compact = (value ?? DEFAULT_NOTIFICATION_TIME)
    .trim()
    .replace(/\s+/g, "");
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

function parsePregnancyWeekParts(pregnancyWeekLabel?: string | null) {
  const match = pregnancyWeekLabel?.match(/(\d+)\s*주(?:\s*(\d+)\s*일)?/);
  if (!match) {
    return null;
  }

  const week = Number(match[1]);
  const day = Number(match[2] ?? "0");
  if (
    !Number.isInteger(week) ||
    !Number.isInteger(day) ||
    week <= 0 ||
    day < 0 ||
    day > 6
  ) {
    return null;
  }

  return { week, day };
}

function parsePregnancyWeek(pregnancyWeekLabel?: string | null) {
  return parsePregnancyWeekParts(pregnancyWeekLabel)?.week ?? null;
}

export function buildDailyLocalNotificationRequest(input: {
  notificationTime?: string | null;
  pregnancyWeekLabel?: string | null;
}): DailyLocalNotificationRequest {
  const pregnancyWeek = parsePregnancyWeek(input.pregnancyWeekLabel);

  return {
    title: pregnancyWeek
      ? `[${pregnancyWeek}주차] 오늘은 어때요?`
      : "오늘은 어때요?",
    body: "오늘의 변화를 함께 확인해보세요.",
    data: { type: "daily_tip" },
    trigger: parseDailyNotificationTime(input.notificationTime),
  };
}

function buildNotificationTitleForPregnancyDay(
  pregnancyDayCount?: number | null,
) {
  if (
    typeof pregnancyDayCount !== "number" ||
    !Number.isFinite(pregnancyDayCount) ||
    pregnancyDayCount <= 0
  ) {
    return "오늘은 어때요?";
  }

  return `[${Math.max(1, Math.floor(pregnancyDayCount / 7))}주차] 오늘은 어때요?`;
}

function resolvePregnancyDayCount(input: {
  pregnancyDayCount?: number | null;
  pregnancyWeekLabel?: string | null;
}) {
  if (
    typeof input.pregnancyDayCount === "number" &&
    Number.isFinite(input.pregnancyDayCount) &&
    input.pregnancyDayCount > 0
  ) {
    return input.pregnancyDayCount;
  }

  const parsed = parsePregnancyWeekParts(input.pregnancyWeekLabel);
  return parsed ? parsed.week * 7 + parsed.day : null;
}

function buildNextNotificationDate(input: {
  now: Date;
  dayOffset: number;
  hour: number;
  minute: number;
}) {
  const date = new Date(input.now);
  date.setSeconds(0, 0);
  date.setHours(input.hour, input.minute, 0, 0);

  if (date.getTime() <= input.now.getTime()) {
    date.setDate(date.getDate() + 1);
  }

  date.setDate(date.getDate() + input.dayOffset);
  return date;
}

export function buildRollingDailyLocalNotificationRequests(input: {
  notificationTime?: string | null;
  pregnancyWeekLabel?: string | null;
  pregnancyDayCount?: number | null;
  now?: Date;
  days?: number;
}): RollingDailyLocalNotificationRequest[] {
  const now = input.now ?? new Date();
  const { hour, minute } = parseDailyNotificationTime(input.notificationTime);
  const days = Math.max(1, input.days ?? DEFAULT_ROLLING_NOTIFICATION_DAYS);
  const pregnancyDayCount = resolvePregnancyDayCount({
    pregnancyDayCount: input.pregnancyDayCount,
    pregnancyWeekLabel: input.pregnancyWeekLabel,
  });

  return Array.from({ length: days }, (_, dayOffset) => ({
    identifier: `${DAILY_LOCAL_NOTIFICATION_IDENTIFIER_PREFIX}-${dayOffset}`,
    title: buildNotificationTitleForPregnancyDay(
      typeof pregnancyDayCount === "number"
        ? pregnancyDayCount + dayOffset
        : null,
    ),
    body: "오늘의 변화를 함께 확인해보세요.",
    data: { type: "daily_tip" },
    date: buildNextNotificationDate({
      now,
      dayOffset,
      hour,
      minute,
    }),
  }));
}
