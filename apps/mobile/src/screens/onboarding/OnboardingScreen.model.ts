export const ONBOARDING_LAYOUT = {
  progressHeight: 4,
  sectionGap: 20,
  titleGap: 4,
  choiceGap: 8,
  rowGap: 12,
  chipRadius: 18,
  cardRadius: 20,
} as const;

function normalizeDueDateToIsoDate(input: string) {
  const trimmed = input.trim();
  const ymdMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (ymdMatch?.[1]) {
    return ymdMatch[1];
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return trimmed;
  }

  return parsed.toISOString().slice(0, 10);
}

export function buildOnboardingCompletionInput(input: {
  dueDate: string;
  babyNickname: string;
  tonePreference: string;
}) {
  const dueDate = normalizeDueDateToIsoDate(input.dueDate);
  const babyNickname = input.babyNickname.trim() || null;

  return {
    pregnancyWeekOrDueDate: dueDate,
    babyNickname,
    tonePreference: input.tonePreference || "친근하게",
  };
}
