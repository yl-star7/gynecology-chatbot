const MIN_DISPLAY_WEEK = 1;
const MAX_DISPLAY_WEEK = 42;
const MIN_IMAGE_WEEK = 5;
const MAX_IMAGE_WEEK = 40;
const MAX_PREGNANCY_DAYS = 294;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

type PregnancyWeekKnownState = {
  kind: "week";
  week: number;
  day: number;
  isPostDue: boolean;
};

type PregnancyWeekUnknownState = {
  kind: "unknown";
};

export type PregnancyWeekState = PregnancyWeekKnownState | PregnancyWeekUnknownState;

function parseWeekLabel(label?: string | null) {
  if (!label) return null;
  const match = label.match(/(\d{1,2})\s*주(?:\s*(\d{1,2})\s*일)?/);
  if (!match) return null;
  const week = Number(match[1]);
  const day = Number(match[2] ?? "0");
  if (!Number.isInteger(week) || !Number.isInteger(day)) return null;
  if (week < MIN_DISPLAY_WEEK || week > MAX_DISPLAY_WEEK) return null;
  if (day < 0 || day > 6) return null;
  return { week, day };
}

function computePregnancyDayFromDueDate(dueDate?: string | null, now?: Date) {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return null;
  const base = now ?? new Date();
  const startOfBase = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const diff = Math.round((due.getTime() - startOfBase.getTime()) / MS_PER_DAY);
  return Math.max(0, Math.min(MAX_PREGNANCY_DAYS, MAX_PREGNANCY_DAYS - diff));
}

function computeWeekFromDueDate(dueDate?: string | null, now?: Date) {
  const dayCount = computePregnancyDayFromDueDate(dueDate, now);
  if (dayCount == null || dayCount <= 0) return null;
  const week = Math.max(MIN_DISPLAY_WEEK, Math.floor(dayCount / 7));
  const day = dayCount % 7;
  if (week > MAX_DISPLAY_WEEK) return null;
  return { week, day };
}

function isPostDue(dueDate?: string | null, now?: Date) {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return false;
  return due.getTime() < (now ?? new Date()).getTime();
}

export function createPregnancyWeekState(input: {
  homePregnancyWeekLabel?: string | null;
  profilePregnancyWeekLabel?: string | null;
  dueDate?: string | null;
  now?: Date;
}): PregnancyWeekState {
  const parsed =
    parseWeekLabel(input.homePregnancyWeekLabel) ??
    parseWeekLabel(input.profilePregnancyWeekLabel) ??
    computeWeekFromDueDate(input.dueDate, input.now);

  if (!parsed) {
    return { kind: "unknown" };
  }

  return {
    kind: "week",
    week: parsed.week,
    day: parsed.day,
    isPostDue: isPostDue(input.dueDate, input.now),
  };
}

export function getPregnancyWeekDisplayLabel(state: PregnancyWeekState) {
  if (state.kind === "unknown") {
    return "주차 정보를 준비 중이에요";
  }
  if (state.isPostDue) {
    return "출산 예정일이 지났어요";
  }
  return `${state.week}주 ${state.day}일`;
}

export function getPregnancyWeekImageLabel(state: PregnancyWeekState) {
  if (state.kind === "unknown") {
    return null;
  }
  const imageWeek = Math.max(MIN_IMAGE_WEEK, Math.min(MAX_IMAGE_WEEK, state.week));
  return `${imageWeek}주 ${state.day}일`;
}
