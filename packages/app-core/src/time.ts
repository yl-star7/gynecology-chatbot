export const KOREA_TIME_ZONE = "Asia/Seoul";

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
