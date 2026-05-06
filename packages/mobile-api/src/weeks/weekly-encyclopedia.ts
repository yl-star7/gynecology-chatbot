export type SourceWeekRow = {
  week_number: number;
  title: string | null;
  baby_size_label: string | null;
  baby_summary: string | null;
  mother_summary: string | null;
};

export type WeeklyEncyclopediaRow = {
  week_number: number;
  content_scope: string;
  category: string;
  title: string | null;
  summary: string | null;
  body: string | null;
  items: unknown[];
};

export type RawWeeklyEncyclopediaRow = {
  week_number: number | null;
  content_scope: string | null;
  category: string | null;
  title: string | null;
  summary: string | null;
  body: string | null;
  items: unknown;
};

export type DocumentLinkRow = {
  id: string;
  pregnancy_week: number | null;
};

export type MobileWeek = {
  weekNumber: number;
  linkEntityId?: string | null;
  title: string | null;
  babySizeLabel: string | null;
  babySummary: string | null;
  motherSummary: string | null;
  lifeGuide?: {
    title: string | null;
    summary: string | null;
    body: string | null;
    items: unknown[];
  } | null;
  caution?: {
    title: string | null;
    summary: string | null;
    body: string | null;
    items: unknown[];
  } | null;
  reflectionQuestion?: {
    title: string | null;
    summary: string | null;
    body: string | null;
    items: unknown[];
  } | null;
  faq?: {
    title: string | null;
    items: unknown[];
  } | null;
};

function combineSummaryAndBody(summary: string | null, body: string | null) {
  const parts = [summary, body]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
  return [...new Set(parts)].join("\n\n") || null;
}

function asUnknownArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

export function parseWeekParam(raw: string | null): number | null {
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 42) return null;
  return parsed;
}

export function normalizeWeeklyEncyclopediaRows(
  rows: RawWeeklyEncyclopediaRow[],
): WeeklyEncyclopediaRow[] {
  return rows
    .filter(
      (row): row is RawWeeklyEncyclopediaRow & {
        week_number: number;
        content_scope: string;
        category: string;
      } =>
        typeof row.week_number === "number" &&
        typeof row.content_scope === "string" &&
        typeof row.category === "string",
    )
    .map((row) => ({
      week_number: row.week_number,
      content_scope: row.content_scope,
      category: row.category,
      title: row.title,
      summary: row.summary,
      body: row.body,
      items: asUnknownArray(row.items),
    }));
}

function mapSourceWeeks(rows: SourceWeekRow[]) {
  return rows.map((row) => ({
    weekNumber: row.week_number,
    title: row.title ?? `${row.week_number}주차`,
    babySizeLabel: row.baby_size_label,
    babySummary: row.baby_summary,
    motherSummary: row.mother_summary,
  }));
}

function mapEncyclopediaWeeks(rows: WeeklyEncyclopediaRow[]) {
  const weekMap = new Map<number, MobileWeek>();

  for (const row of rows) {
    const current = weekMap.get(row.week_number) ?? {
      weekNumber: row.week_number,
      title: null,
      babySizeLabel: null,
      babySummary: null,
      motherSummary: null,
      lifeGuide: null,
      caution: null,
      reflectionQuestion: null,
      faq: null,
    };

    if (row.content_scope === "week_summary" && row.category === "overview") {
      current.title = row.title ?? current.title;
    }
    if (
      row.content_scope === "section" &&
      row.category === "baby_development"
    ) {
      current.babySummary =
        combineSummaryAndBody(row.summary, row.body) ?? current.babySummary;
    }
    if (row.content_scope === "section" && row.category === "mother_body") {
      current.motherSummary =
        combineSummaryAndBody(row.summary, row.body) ?? current.motherSummary;
    }
    if (row.content_scope === "section" && row.category === "life_guide") {
      current.lifeGuide = {
        title: row.title,
        summary: row.summary,
        body: row.body,
        items: row.items ?? [],
      };
    }
    if (row.content_scope === "section" && row.category === "caution") {
      current.caution = {
        title: row.title,
        summary: row.summary,
        body: row.body,
        items: row.items ?? [],
      };
    }
    if (
      row.content_scope === "section" &&
      row.category === "reflection_question"
    ) {
      current.reflectionQuestion = {
        title: row.title,
        summary: row.summary,
        body: row.body,
        items: row.items ?? [],
      };
    }
    if (row.content_scope === "section" && row.category === "faq") {
      current.faq = {
        title: row.title,
        items: row.items ?? [],
      };
    }

    weekMap.set(row.week_number, current);
  }

  return [...weekMap.values()].sort(
    (left, right) => left.weekNumber - right.weekNumber,
  );
}

function mergeWeeks(
  sourceWeeks: MobileWeek[],
  encyclopediaWeeks: MobileWeek[],
) {
  const weekMap = new Map<number, MobileWeek>(
    sourceWeeks.map((week) => [week.weekNumber, week]),
  );

  for (const encyclopediaWeek of encyclopediaWeeks) {
    const sourceWeek = weekMap.get(encyclopediaWeek.weekNumber);
    weekMap.set(encyclopediaWeek.weekNumber, {
      weekNumber: encyclopediaWeek.weekNumber,
      title:
        encyclopediaWeek.title ??
        sourceWeek?.title ??
        `${encyclopediaWeek.weekNumber}주차`,
      babySizeLabel:
        encyclopediaWeek.babySizeLabel ?? sourceWeek?.babySizeLabel ?? null,
      babySummary:
        encyclopediaWeek.babySummary ?? sourceWeek?.babySummary ?? null,
      motherSummary:
        encyclopediaWeek.motherSummary ?? sourceWeek?.motherSummary ?? null,
      lifeGuide: encyclopediaWeek.lifeGuide ?? sourceWeek?.lifeGuide ?? null,
      caution: encyclopediaWeek.caution ?? sourceWeek?.caution ?? null,
      reflectionQuestion:
        encyclopediaWeek.reflectionQuestion ??
        sourceWeek?.reflectionQuestion ??
        null,
      faq: encyclopediaWeek.faq ?? sourceWeek?.faq ?? null,
    });
  }

  return [...weekMap.values()]
    .map((week) => ({
      ...week,
      title: week.title ?? `${week.weekNumber}주차`,
    }))
    .sort((left, right) => left.weekNumber - right.weekNumber);
}

function buildDocumentIdByWeek(rows: DocumentLinkRow[]) {
  const documentIdByWeek = new Map<number, string>();

  for (const row of rows) {
    if (
      row.pregnancy_week === null ||
      documentIdByWeek.has(row.pregnancy_week)
    ) {
      continue;
    }
    documentIdByWeek.set(row.pregnancy_week, row.id);
  }

  return documentIdByWeek;
}

function attachLinkEntityIds(weeks: MobileWeek[], rows: DocumentLinkRow[]) {
  const documentIdByWeek = buildDocumentIdByWeek(rows);

  return weeks.map((week) => ({
    ...week,
    linkEntityId: documentIdByWeek.get(week.weekNumber) ?? null,
  }));
}

export function buildMobileWeeksPayload(input: {
  sourceWeeks: SourceWeekRow[];
  encyclopediaRows: WeeklyEncyclopediaRow[];
  documentLinks: DocumentLinkRow[];
}) {
  return {
    weeks: attachLinkEntityIds(
      mergeWeeks(
        mapSourceWeeks(input.sourceWeeks),
        mapEncyclopediaWeeks(input.encyclopediaRows),
      ),
      input.documentLinks,
    ),
  };
}
