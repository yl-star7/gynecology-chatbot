import type { CalendarDay } from "@gynecology-chatbot/app-core";
import {
  createKoreanDateKey,
  parseIsoDateKey,
} from "@gynecology-chatbot/app-core";
import type { DimensionValue } from "react-native";

const CALENDAR_COLUMN_WIDTH: DimensionValue = `${100 / 7}%`;

function formatIsoDate(year: number, monthIndex: number, day: number) {
  return [
    String(year),
    String(monthIndex + 1).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function parseCalendarMonth(calendarDays: CalendarDay[] | null | undefined) {
  const firstIsoDate = calendarDays?.[0]?.isoDate;
  if (!firstIsoDate) {
    return null;
  }

  const match = firstIsoDate.match(/^(\d{4})-(\d{2})-\d{2}$/);
  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    monthIndex: Number(match[2]) - 1,
  };
}

export function createProfileCalendarMonthKey(date = new Date()) {
  const { year, month } = parseIsoDateKey(createKoreanDateKey(date));
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function resolveProfileCalendarMonthKey(
  calendarDays: CalendarDay[] | null | undefined,
  fallbackDate = new Date(),
) {
  const resolvedMonth = parseCalendarMonth(calendarDays);
  if (resolvedMonth) {
    return `${resolvedMonth.year}-${String(resolvedMonth.monthIndex + 1).padStart(
      2,
      "0",
    )}`;
  }

  return createProfileCalendarMonthKey(fallbackDate);
}

export function addProfileCalendarMonths(monthKey: string, offset: number) {
  const match = monthKey.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return createProfileCalendarMonthKey();
  }

  const date = new Date(Number(match[1]), Number(match[2]) - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatProfileCalendarMonthLabel(monthKey: string) {
  const match = monthKey.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return "";
  }

  return `${Number(match[1])}년 ${Number(match[2])}월`;
}

export function buildMonthGrid(date: Date) {
  const { year, month } = parseIsoDateKey(createKoreanDateKey(date));
  const monthIndex = month - 1;
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const leadingEmpty = firstDay.getDay();
  const days: (number | null)[] = [];

  for (let index = 0; index < leadingEmpty; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(day);
  }

  return days;
}

export function buildProfileCalendarModel(
  calendarDays: CalendarDay[] | null | undefined,
  fallbackDate = new Date(),
) {
  const resolvedMonth = parseCalendarMonth(calendarDays);
  const fallbackMonth = parseIsoDateKey(createKoreanDateKey(fallbackDate));
  const monthDate = resolvedMonth
    ? new Date(resolvedMonth.year, resolvedMonth.monthIndex, 1)
    : new Date(fallbackMonth.year, fallbackMonth.month - 1, 1);
  const year = monthDate.getFullYear();
  const monthIndex = monthDate.getMonth();
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const isoDateByDay = new Map<number, string>();

  for (let day = 1; day <= lastDay; day += 1) {
    isoDateByDay.set(day, formatIsoDate(year, monthIndex, day));
  }

  return {
    activeDays: new Set(
      (calendarDays ?? [])
        .filter((day) => day.hasChat || day.emotionTone)
        .map((day) => Number(day.dayLabel))
        .filter((day) => Number.isInteger(day)),
    ),
    isoDateByDay,
    columnWidth: CALENDAR_COLUMN_WIDTH,
    gridDays: buildMonthGrid(monthDate),
  };
}
