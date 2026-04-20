import { Hono } from "hono";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "../../lib/session-auth.js";

const app = new Hono();

type WeekRow = {
  week_number: number;
  title: string;
  baby_size_label: string | null;
  baby_summary: string | null;
  mother_summary: string | null;
};

type EncyclopediaRow = {
  week_number: number;
  content_scope: string;
  category: string;
  title: string | null;
  summary: string | null;
  body: string | null;
  items: unknown[];
};

type MobileWeek = {
  weekNumber: number;
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
  faq?: {
    title: string | null;
    items: unknown[];
  } | null;
};

function mapSourceWeeks(rows: WeekRow[]) {
  return rows.map((row) => ({
    weekNumber: row.week_number,
    title: row.title,
    babySizeLabel: row.baby_size_label,
    babySummary: row.baby_summary,
    motherSummary: row.mother_summary,
  }));
}

function mapEncyclopediaWeeks(rows: EncyclopediaRow[]) {
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
      faq: null,
    };

    if (row.content_scope === "week_summary" && row.category === "overview") {
      current.title = row.title ?? current.title;
    }
    if (
      row.content_scope === "section" &&
      row.category === "baby_development"
    ) {
      current.babySummary = row.summary ?? row.body ?? current.babySummary;
    }
    if (row.content_scope === "section" && row.category === "mother_body") {
      current.motherSummary = row.summary ?? row.body ?? current.motherSummary;
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

function asUnknownArray(value: Prisma.JsonValue | null | undefined) {
  return Array.isArray(value) ? value : [];
}

async function loadWeeklyEncyclopediaRows() {
  const rows = await prisma.v_weekly_encyclopedia.findMany({
    select: {
      week_number: true,
      content_scope: true,
      category: true,
      title: true,
      summary: true,
      body: true,
      items: true,
    },
    orderBy: [
      { week_number: "asc" },
      { content_scope: "asc" },
      { category: "asc" },
    ],
  });

  return rows
    .filter(
      (row): row is typeof row & {
        week_number: number;
        content_scope: string;
        category: string;
      } =>
        typeof row.week_number === "number" &&
        typeof row.content_scope === "string" &&
        typeof row.category === "string",
    )
    .map(
      (row): EncyclopediaRow => ({
        week_number: row.week_number,
        content_scope: row.content_scope,
        category: row.category,
        title: row.title,
        summary: row.summary,
        body: row.body,
        items: asUnknownArray(row.items),
      }),
    );
}

app.get("/", async (c) => {
  try {
    await requireMobileSession(c);

    const [encyclopediaRows, rows] = await Promise.all([
      loadWeeklyEncyclopediaRows(),
      prisma.content_pregnancy_week_data.findMany({
        where: { status: "published" },
        orderBy: { week_number: "asc" },
        select: {
          week_number: true,
          title: true,
          baby_size_label: true,
          baby_summary: true,
          mother_summary: true,
        },
      }),
    ]);

    return c.json({
      weeks: mergeWeeks(
        mapSourceWeeks(
          rows.map((row): WeekRow => ({
            week_number: row.week_number,
            title: row.title ?? `${row.week_number}주차`,
            baby_size_label: row.baby_size_label,
            baby_summary: row.baby_summary,
            mother_summary: row.mother_summary,
          })),
        ),
        mapEncyclopediaWeeks(encyclopediaRows),
      ),
    });
  } catch (error) {
    console.error("mobile weeks route error", error);
    return mobileRouteErrorResponse(c, error, "failed to load weeks");
  }
});

export default app;
