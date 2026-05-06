import { formatMobilePregnancyWeekDayLabel } from "@gynecology-chatbot/app-core";

const SNIPPET_MAX_LENGTH = 220;

export type LexiconSurface = "week_overview" | "week_day";

export type LexiconItem = {
  id: string;
  title: string;
  week: number | null;
  day: number | null;
  surface: LexiconSurface;
  snippet: string;
};

export type GeneratedWeekRow = {
  id: string;
  week_number: number;
  title: string | null;
  baby_summary: string | null;
  mother_summary: string | null;
  warning_signs: string | null;
  recommended_actions: string | null;
};

export type GeneratedDaySourceRow = {
  id: string;
  week_data_id: string;
  day_number: number;
  title: string | null;
  baby_message: string | null;
  baby_development_payload: unknown;
  mother_changes_payload: unknown;
};

export type GeneratedDayRow = GeneratedDaySourceRow & {
  week_number: number;
};

export type GeneratedChecklistRow = {
  week_data_id: string;
  day_number: number | null;
  title: string;
  description: string | null;
};

export type GeneratedQuestionRow = {
  week_data_id: string;
  day_number: number | null;
  question_text: string;
};

export type GeneratedLexiconId =
  | { surface: "week_overview"; week: number }
  | { surface: "week_day"; week: number; day: number };

function cleanText(value: string | null | undefined): string | null {
  const next = value?.trim();
  return next ? next : null;
}

function readStringItems(payload: unknown): string[] {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return [];
  }
  const items = (payload as { items?: unknown }).items;
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const record = item as Record<string, unknown>;
        const raw =
          record.text ?? record.title ?? record.label ?? record.content;
        return typeof raw === "string" ? raw.trim() : "";
      }
      return "";
    })
    .filter(Boolean);
}

export function buildSnippet(content: string, limit = SNIPPET_MAX_LENGTH) {
  if (!content) return "";
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit).trim()}...`;
}

export function buildWeekDocument(week: GeneratedWeekRow): string {
  const lines = [
    `# 임신 ${week.week_number}주차 정보`,
    "",
    `제목: ${cleanText(week.title) ?? `임신 ${week.week_number}주차`}`,
  ];
  const babySummary = cleanText(week.baby_summary);
  const motherSummary = cleanText(week.mother_summary);
  const warningSigns = cleanText(week.warning_signs);
  const recommendedActions = cleanText(week.recommended_actions);

  if (babySummary) lines.push(`아기 요약: ${babySummary}`);
  if (motherSummary) lines.push(`엄마 요약: ${motherSummary}`);
  if (warningSigns) lines.push(`위험 신호: ${warningSigns}`);
  if (recommendedActions) lines.push(`권장 조치: ${recommendedActions}`);
  return lines.join("\n");
}

export function buildDayDocument(
  day: GeneratedDayRow,
  checklists: GeneratedChecklistRow[],
  questions: GeneratedQuestionRow[],
): string {
  const mobileDayLabel = formatMobilePregnancyWeekDayLabel(
    day.week_number,
    day.day_number,
  );
  const lines = [`# 임신 ${mobileDayLabel}`, ""];
  const babyMessage = cleanText(day.baby_message);

  if (babyMessage) {
    lines.push(`아기의 말: ${babyMessage}`, "");
  }

  const babyItems = readStringItems(day.baby_development_payload);
  if (babyItems.length > 0) {
    lines.push("## 태아 발달정보");
    for (const item of babyItems) lines.push(`- ${item}`);
    lines.push("");
  }

  const motherItems = readStringItems(day.mother_changes_payload);
  if (motherItems.length > 0) {
    lines.push("## 모체 변화정보");
    for (const item of motherItems) lines.push(`- ${item}`);
    lines.push("");
  }

  const dayChecklists = checklists.filter(
    (item) =>
      item.week_data_id === day.week_data_id &&
      item.day_number === day.day_number,
  );
  if (dayChecklists.length > 0) {
    lines.push("## 생활 체크리스트");
    for (const item of dayChecklists) {
      const description = cleanText(item.description);
      lines.push(`- ${item.title}${description ? `: ${description}` : ""}`);
    }
    lines.push("");
  }

  const dayQuestions = questions.filter(
    (item) =>
      item.week_data_id === day.week_data_id &&
      item.day_number === day.day_number,
  );
  if (dayQuestions.length > 0) {
    lines.push("## 태교 질문");
    for (const item of dayQuestions) lines.push(`- ${item.question_text}`);
    lines.push("");
  }

  return lines.join("\n");
}

export function buildWeekLexiconItem(week: GeneratedWeekRow): LexiconItem {
  const content = buildWeekDocument(week);
  return {
    id: `week-${week.week_number}-overview`,
    title: `임신 ${week.week_number}주차 정보`,
    week: week.week_number,
    day: null,
    surface: "week_overview",
    snippet: buildSnippet(content),
  };
}

export function buildDayLexiconItem(
  day: GeneratedDayRow,
  checklists: GeneratedChecklistRow[],
  questions: GeneratedQuestionRow[],
): LexiconItem {
  const content = buildDayDocument(day, checklists, questions);
  const titleSuffix = cleanText(day.title);
  const mobileDayLabel = formatMobilePregnancyWeekDayLabel(
    day.week_number,
    day.day_number,
  );
  return {
    id: `week-${day.week_number}-day-${day.day_number}`,
    title: titleSuffix
      ? `임신 ${mobileDayLabel}: ${titleSuffix}`
      : `임신 ${mobileDayLabel}`,
    week: day.week_number,
    day: day.day_number,
    surface: "week_day",
    snippet: buildSnippet(content),
  };
}

export function buildGeneratedLexiconItems(input: {
  weeks: GeneratedWeekRow[];
  days: GeneratedDaySourceRow[];
  checklists: GeneratedChecklistRow[];
  questions: GeneratedQuestionRow[];
}): LexiconItem[] {
  const weekNumberById = new Map(
    input.weeks.map((week) => [week.id, week.week_number]),
  );
  const items: LexiconItem[] = [];

  for (const week of input.weeks) {
    items.push(buildWeekLexiconItem(week));
  }

  for (const day of input.days) {
    const weekNumber = weekNumberById.get(day.week_data_id);
    if (typeof weekNumber !== "number") continue;
    items.push(
      buildDayLexiconItem(
        { ...day, week_number: weekNumber },
        input.checklists,
        input.questions,
      ),
    );
  }

  return items.sort((a, b) => {
    const weekDelta = (a.week ?? 999) - (b.week ?? 999);
    if (weekDelta !== 0) return weekDelta;
    if (a.surface !== b.surface) {
      return a.surface === "week_overview" ? -1 : 1;
    }
    return (a.day ?? 0) - (b.day ?? 0);
  });
}

export function filterLexiconItems(
  items: LexiconItem[],
  filters: {
    week?: number | null;
    surface?: string | null;
    query?: string | null;
  },
): LexiconItem[] {
  let next = items;
  if (typeof filters.week === "number" && Number.isFinite(filters.week)) {
    const week = filters.week;
    next = next.filter((item) => item.week === week);
  }
  if (filters.surface) {
    const surface = filters.surface;
    next = next.filter((item) => item.surface === surface);
  }
  if (filters.query && filters.query.trim()) {
    const q = filters.query.trim().toLowerCase();
    next = next.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.snippet.toLowerCase().includes(q),
    );
  }
  return next;
}

export function parseWeekParam(raw: string | null): number | null {
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 1 || parsed > 42) return null;
  return parsed;
}

export function parseGeneratedLexiconId(id: string): GeneratedLexiconId | null {
  const overview = /^week-(\d{1,2})-overview$/.exec(id);
  if (overview) {
    const week = Number.parseInt(overview[1], 10);
    return Number.isFinite(week) && week >= 1 && week <= 42
      ? { surface: "week_overview", week }
      : null;
  }

  const day = /^week-(\d{1,2})-day-(\d{1,2})$/.exec(id);
  if (day) {
    const week = Number.parseInt(day[1], 10);
    const dayNumber = Number.parseInt(day[2], 10);
    return Number.isFinite(week) &&
      week >= 1 &&
      week <= 42 &&
      Number.isFinite(dayNumber) &&
      dayNumber >= 1 &&
      dayNumber <= 7
      ? { surface: "week_day", week, day: dayNumber }
      : null;
  }

  return null;
}
