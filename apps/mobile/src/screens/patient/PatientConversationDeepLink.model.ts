export type ConversationDeepLinkMeta = {
  title?: string;
  description?: string;
  weekNumber?: number | null;
};

type ConversationDeepLinkInput = ConversationDeepLinkMeta & {
  target: string;
  entityId?: string;
};

export type ConversationDeepLinkAction =
  | { type: "encyclopedia"; href: string }
  | { type: "sheet"; target: string; entityId?: string };

const MIN_PREGNANCY_WEEK = 1;
const MAX_PREGNANCY_WEEK = 42;
const syntheticWeekEntityIdPattern = /^week[-_]?(\d{1,2})$/i;
const koreanWeekPattern = /(?:^|[^\d])(\d{1,2})\s*주(?:차)?/u;

function normalizePregnancyWeek(value: unknown) {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  if (
    !Number.isInteger(numericValue) ||
    numericValue < MIN_PREGNANCY_WEEK ||
    numericValue > MAX_PREGNANCY_WEEK
  ) {
    return null;
  }

  return numericValue;
}

export function resolvePregnancyWeekFromDeepLink({
  entityId,
  title,
  description,
  weekNumber,
}: ConversationDeepLinkMeta & { entityId?: string }) {
  const explicitWeek = normalizePregnancyWeek(weekNumber);
  if (explicitWeek) {
    return explicitWeek;
  }

  const entityWeekMatch = entityId?.trim().match(syntheticWeekEntityIdPattern);
  const entityWeek = normalizePregnancyWeek(entityWeekMatch?.[1]);
  if (entityWeek) {
    return entityWeek;
  }

  for (const source of [title, description]) {
    const match = source?.match(koreanWeekPattern);
    const matchedWeek = normalizePregnancyWeek(match?.[1]);
    if (matchedWeek) {
      return matchedWeek;
    }
  }

  return null;
}

export function resolveConversationDeepLinkAction({
  target,
  entityId,
  title,
  description,
  weekNumber,
}: ConversationDeepLinkInput): ConversationDeepLinkAction {
  const normalizedTarget = target.trim() || "knowledge";
  const normalizedEntityId = entityId?.trim() || undefined;
  const week = resolvePregnancyWeekFromDeepLink({
    entityId: normalizedEntityId,
    title,
    description,
    weekNumber,
  });

  if (
    week &&
    ["knowledge", "encyclopedia", "weekly_encyclopedia"].includes(
      normalizedTarget,
    )
  ) {
    return {
      type: "encyclopedia",
      href: `/encyclopedia?mode=browse&week=${week}`,
    };
  }

  return {
    type: "sheet",
    target: normalizedTarget,
    entityId: normalizedEntityId,
  };
}
