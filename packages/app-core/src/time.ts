export const KOREA_TIME_ZONE = "Asia/Seoul";
export const PREGNANCY_TERM_DAYS = 280;
export const MIN_PREGNANCY_WEEK = 1;
export const MAX_PREGNANCY_WEEK = 42;
export const MAX_MANUAL_PREGNANCY_DAYS = MAX_PREGNANCY_WEEK * 7;

export type PregnancyPosition = {
  weekNumber: number;
  dayNumber: number;
  postDue: boolean;
};

export function createKoreanDateKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: KOREA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

export function createKoreanMonthKey(now = new Date()) {
  return createKoreanDateKey(now).slice(0, 7);
}

export function readIsoDateKey(value: string | Date) {
  if (value instanceof Date) {
    return createKoreanDateKey(value);
  }

  const match = value.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : null;
}

export function parseIsoDateKey(isoDate: string) {
  const [yearText, monthText, dayText] = isoDate.split("-");
  return {
    year: Number(yearText),
    month: Number(monthText),
    day: Number(dayText),
  };
}

export function diffCalendarDays(targetIsoDate: string, baseIsoDate: string) {
  const target = parseIsoDateKey(targetIsoDate);
  const base = parseIsoDateKey(baseIsoDate);
  const targetTime = Date.UTC(target.year, target.month - 1, target.day);
  const baseTime = Date.UTC(base.year, base.month - 1, base.day);
  return Math.round((targetTime - baseTime) / 86_400_000);
}

function clampInteger(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.floor(value)));
}

export function calculatePregnancyPositionFromDayCount(
  pregnancyDayCount: number,
): Omit<PregnancyPosition, "postDue"> {
  const clampedDayCount = clampInteger(
    pregnancyDayCount,
    0,
    MAX_MANUAL_PREGNANCY_DAYS,
  );
  const rawWeek = Math.floor(clampedDayCount / 7);

  return {
    weekNumber: clampInteger(rawWeek, MIN_PREGNANCY_WEEK, MAX_PREGNANCY_WEEK),
    dayNumber: (clampedDayCount % 7) + 1,
  };
}

export function getMobileDayInWeekFromContentDayNumber(
  contentDayNumber: number,
) {
  if (!Number.isFinite(contentDayNumber)) return 0;
  return Math.max(0, Math.min(6, Math.floor(contentDayNumber) - 1));
}

export function formatMobilePregnancyWeekDayLabel(
  weekNumber: number,
  contentDayNumber: number,
) {
  return `${weekNumber}주 ${getMobileDayInWeekFromContentDayNumber(contentDayNumber)}일`;
}

export function getMobilePregnancyDayCountFromContentDayNumber(
  weekNumber: number,
  contentDayNumber: number,
) {
  return (
    weekNumber * 7 + getMobileDayInWeekFromContentDayNumber(contentDayNumber)
  );
}

export function calculatePregnancyPositionFromDueDate(
  dueDate: string,
  targetIsoDate = createKoreanDateKey(),
): PregnancyPosition {
  const diffDays = diffCalendarDays(dueDate, targetIsoDate);
  if (diffDays < 0) {
    return { weekNumber: 40, dayNumber: 1, postDue: true };
  }

  const pregnancyDayCount = clampInteger(
    PREGNANCY_TERM_DAYS - diffDays,
    0,
    PREGNANCY_TERM_DAYS,
  );

  return {
    ...calculatePregnancyPositionFromDayCount(pregnancyDayCount),
    postDue: false,
  };
}

export function resolvePregnancyPositionFromProfile(
  profile: {
    pregnancyDayCount?: number | null;
    pregnancyWeek?: number | null;
    pregnancyDayInWeek?: number | null;
    dueDate?: string | null;
  },
  targetIsoDate: string,
  baseIsoDate = createKoreanDateKey(),
): PregnancyPosition | null {
  if (profile.dueDate) {
    return calculatePregnancyPositionFromDueDate(
      profile.dueDate,
      targetIsoDate,
    );
  }

  let currentPregnancyDayCount: number | null = null;
  if (
    typeof profile.pregnancyWeek === "number" &&
    Number.isFinite(profile.pregnancyWeek) &&
    profile.pregnancyWeek > 0
  ) {
    const week = clampInteger(
      profile.pregnancyWeek,
      MIN_PREGNANCY_WEEK,
      MAX_PREGNANCY_WEEK,
    );
    const dayInWeek =
      typeof profile.pregnancyDayInWeek === "number" &&
      Number.isFinite(profile.pregnancyDayInWeek)
        ? clampInteger(profile.pregnancyDayInWeek, 0, 6)
        : 0;
    currentPregnancyDayCount = week * 7 + dayInWeek;
  } else if (
    typeof profile.pregnancyDayCount === "number" &&
    Number.isFinite(profile.pregnancyDayCount) &&
    profile.pregnancyDayCount > 0
  ) {
    currentPregnancyDayCount = profile.pregnancyDayCount;
  }

  if (currentPregnancyDayCount === null) {
    return null;
  }

  const selectedPregnancyDayCount =
    currentPregnancyDayCount + diffCalendarDays(targetIsoDate, baseIsoDate);
  if (selectedPregnancyDayCount <= 0) {
    return null;
  }

  return {
    ...calculatePregnancyPositionFromDayCount(selectedPregnancyDayCount),
    postDue: false,
  };
}

export function addCalendarDays(isoDate: string, amount: number) {
  const { year, month, day } = parseIsoDateKey(isoDate);
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  return date.toISOString().slice(0, 10);
}

export function createKoreanDateTime({
  isoDate,
  hour = 0,
  minute = 0,
}: {
  isoDate: string;
  hour?: number;
  minute?: number;
}) {
  const { year, month, day } = parseIsoDateKey(isoDate);
  return new Date(Date.UTC(year, month - 1, day, hour - 9, minute));
}
