import assert from "node:assert/strict";
import test from "node:test";
import type { CalendarDay } from "@gynecology-chatbot/app-core";
import {
  addProfileCalendarMonths,
  buildProfileCalendarModel,
  formatProfileCalendarMonthLabel,
  resolveProfileCalendarMonthKey,
} from "./patientProfileCalendar.ts";

const ACTIVE_ACTIVITY_DAYS = [18, 19] as const;
const APRIL_DAY_COUNT = 30;

test("buildProfileCalendarModel highlights only days with recorded activity", () => {
  const calendarDays: CalendarDay[] = [
    {
      isoDate: "2026-03-17",
      dayLabel: "17",
      hasChat: false,
      emotionTone: null,
    },
    {
      isoDate: "2026-03-18",
      dayLabel: "18",
      hasChat: true,
      emotionTone: null,
    },
    {
      isoDate: "2026-03-19",
      dayLabel: "19",
      hasChat: false,
      emotionTone: "calm",
    },
  ];

  const model = buildProfileCalendarModel(calendarDays, new Date(2026, 0, 1));

  assert.deepEqual([...model.activeDays], [...ACTIVE_ACTIVITY_DAYS]);
});

test("buildProfileCalendarModel uses the month from API data instead of the device month", () => {
  const calendarDays: CalendarDay[] = [
    {
      isoDate: "2026-04-01",
      dayLabel: "1",
      hasChat: false,
      emotionTone: null,
    },
  ];

  const model = buildProfileCalendarModel(calendarDays, new Date(2026, 2, 1));
  const visibleDays = model.gridDays.filter(
    (day): day is number => typeof day === "number",
  );

  assert.equal(visibleDays[0], 1);
  assert.equal(visibleDays.at(-1), APRIL_DAY_COUNT);
  assert.equal(visibleDays.length, APRIL_DAY_COUNT);
  assert.equal(model.isoDateByDay.get(1), "2026-04-01");
  assert.equal(model.isoDateByDay.get(APRIL_DAY_COUNT), "2026-04-30");
});

test("buildProfileCalendarModel builds full month dates even when activity data is empty", () => {
  const model = buildProfileCalendarModel([], new Date(2026, 4, 1));
  const visibleDays = model.gridDays.filter(
    (day): day is number => typeof day === "number",
  );

  assert.equal(visibleDays[0], 1);
  assert.equal(visibleDays.at(-1), 31);
  assert.equal(visibleDays.length, 31);
  assert.equal(model.isoDateByDay.get(1), "2026-05-01");
  assert.equal(model.isoDateByDay.get(31), "2026-05-31");
});

test("resolveProfileCalendarMonthKey returns the API month before falling back to today", () => {
  const calendarDays: CalendarDay[] = [
    {
      isoDate: "2026-04-01",
      dayLabel: "1",
      hasChat: false,
      emotionTone: null,
    },
  ];

  assert.equal(
    resolveProfileCalendarMonthKey(calendarDays, new Date(2026, 4, 1)),
    "2026-04",
  );
  assert.equal(
    resolveProfileCalendarMonthKey([], new Date(2026, 4, 1)),
    "2026-05",
  );
});

test("addProfileCalendarMonths moves across year boundaries", () => {
  assert.equal(addProfileCalendarMonths("2026-01", -1), "2025-12");
  assert.equal(addProfileCalendarMonths("2026-12", 1), "2027-01");
});

test("formatProfileCalendarMonthLabel renders a Korean month label", () => {
  assert.equal(formatProfileCalendarMonthLabel("2026-04"), "2026년 4월");
});
