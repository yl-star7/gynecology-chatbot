import type { MobilePregnancyWeekSummary } from "@gynecology-chatbot/app-core";

const MIN_WEEK = 5;
const MAX_WEEK = 40;

export type WeeklyEncyclopediaWeekCellState =
  | "ready"
  | "current"
  | "selected"
  | "preparing";

export type WeeklyEncyclopediaWeekCell = {
  weekNumber: number;
  label: string;
  state: WeeklyEncyclopediaWeekCellState;
};

function parsePregnancyWeek(label?: string | null) {
  if (!label) return null;
  const match = label.match(/(\d{1,2})\s*주/);
  if (!match) return null;
  const week = Number(match[1]);
  if (!Number.isInteger(week) || week < MIN_WEEK || week > MAX_WEEK) {
    return null;
  }
  return week;
}

function sortWeeks(weeks: MobilePregnancyWeekSummary[]) {
  return [...weeks].sort((a, b) => a.weekNumber - b.weekNumber);
}

function findReadyWeek(
  weeks: MobilePregnancyWeekSummary[],
  weekNumber: number | null,
) {
  if (!weekNumber) return null;
  return weeks.find((week) => week.weekNumber === weekNumber) ?? null;
}

export function resolveWeeklyEncyclopediaSelectedWeek(input: {
  weeks: MobilePregnancyWeekSummary[];
  profilePregnancyWeekLabel?: string | null;
  selectedWeekNumber?: number | null;
}) {
  const sortedWeeks = sortWeeks(input.weeks);
  const selectedWeek = findReadyWeek(
    sortedWeeks,
    input.selectedWeekNumber ?? null,
  );
  if (selectedWeek) return selectedWeek;

  const profileWeek = findReadyWeek(
    sortedWeeks,
    parsePregnancyWeek(input.profilePregnancyWeekLabel),
  );
  if (profileWeek) return profileWeek;

  return sortedWeeks[0] ?? null;
}

export function buildWeeklyEncyclopediaViewModel(input: {
  weeks: MobilePregnancyWeekSummary[];
  profilePregnancyWeekLabel?: string | null;
  selectedWeekNumber?: number | null;
}) {
  const sortedWeeks = sortWeeks(input.weeks);
  const readyWeekNumbers = new Set(sortedWeeks.map((week) => week.weekNumber));
  const profileWeekNumber = parsePregnancyWeek(input.profilePregnancyWeekLabel);
  const requestedWeekNumber = input.selectedWeekNumber ?? null;
  const selectedWeek = resolveWeeklyEncyclopediaSelectedWeek(input);
  const requestedMissing =
    requestedWeekNumber != null && !readyWeekNumbers.has(requestedWeekNumber);

  const weekCells: WeeklyEncyclopediaWeekCell[] = [];
  for (let weekNumber = MIN_WEEK; weekNumber <= MAX_WEEK; weekNumber += 1) {
    let state: WeeklyEncyclopediaWeekCellState = readyWeekNumbers.has(
      weekNumber,
    )
      ? "ready"
      : "preparing";

    if (weekNumber === profileWeekNumber && state === "ready") {
      state = "current";
    }
    if (
      weekNumber === selectedWeek?.weekNumber &&
      weekNumber !== profileWeekNumber
    ) {
      state = "selected";
    }

    weekCells.push({
      weekNumber,
      label: `${weekNumber}주`,
      state,
    });
  }

  const preparingWeekNumber = requestedMissing ? requestedWeekNumber : null;
  const lifeGuideItems =
    selectedWeek?.lifeGuide?.items
      ?.map((item) => (typeof item === "string" ? item : null))
      .filter((item): item is string => Boolean(item)) ?? [];
  const cautionItems =
    selectedWeek?.caution?.items
      ?.map((item) => (typeof item === "string" ? item : null))
      .filter((item): item is string => Boolean(item)) ?? [];
  const faqItems =
    selectedWeek?.faq?.items
      ?.map((item) => {
        if (!item || typeof item !== "object") return null;
        const record = item as { question?: unknown; answer?: unknown };
        if (
          typeof record.question !== "string" ||
          typeof record.answer !== "string"
        ) {
          return null;
        }
        return {
          question: record.question,
          answer: record.answer,
        };
      })
      .filter((item): item is { question: string; answer: string } =>
        Boolean(item),
      ) ?? [];

  return {
    selectedWeek: requestedMissing ? null : selectedWeek,
    preparingWeekNumber,
    weekCells,
    heroTitle: selectedWeek?.title ?? "임신백과",
    heroSubtitle: selectedWeek?.babySizeLabel
      ? `아기는 ${selectedWeek.babySizeLabel}만큼 자라고 있어요.`
      : "주차별 정보를 차분히 살펴봐요.",
    emptyTitle: preparingWeekNumber
      ? `${preparingWeekNumber}주차 정보는 정리 중이에요`
      : "이 주차 정보는 정리 중이에요",
    emptyDescription: "준비되는 대로 차분히 읽을 수 있게 보여드릴게요.",
    lifeGuideTitle: selectedWeek?.lifeGuide?.title ?? "생활 가이드",
    lifeGuideSummary: selectedWeek?.lifeGuide?.summary ?? null,
    lifeGuideBody: selectedWeek?.lifeGuide?.body ?? null,
    lifeGuideItems,
    cautionTitle: selectedWeek?.caution?.title ?? "주의할 점",
    cautionSummary: selectedWeek?.caution?.summary ?? null,
    cautionBody: selectedWeek?.caution?.body ?? null,
    cautionItems,
    faqTitle: selectedWeek?.faq?.title ?? "궁금해요",
    faqItems,
  };
}
