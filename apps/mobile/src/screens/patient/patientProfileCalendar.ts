import type { CalendarDay } from "@gynecology-chatbot/app-core";
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

export function buildMonthGrid(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
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
  const monthDate = resolvedMonth
    ? new Date(resolvedMonth.year, resolvedMonth.monthIndex, 1)
    : new Date(fallbackDate.getFullYear(), fallbackDate.getMonth(), 1);
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
