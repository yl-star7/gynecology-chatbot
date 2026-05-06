import { Hono } from "hono";
import { prisma } from "@gynecology-chatbot/db/prisma";
import {
  buildDayDocument,
  buildDayLexiconItem,
  buildGeneratedLexiconItems,
  buildWeekDocument,
  buildWeekLexiconItem,
  filterLexiconItems,
  parseGeneratedLexiconId,
  parseWeekParam,
  type GeneratedChecklistRow,
  type GeneratedDaySourceRow,
  type GeneratedQuestionRow,
  type GeneratedWeekRow,
  type LexiconItem,
} from "@gynecology-chatbot/mobile-api/lexicon/documents";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "../../lib/session-auth.js";
import { noStoreJson } from "../../lib/responses.js";

const app = new Hono();

type LexiconResponseBody = {
  items: LexiconItem[];
};

type LexiconDetailResponseBody = LexiconItem & {
  content: string;
};

type TimingEntry = {
  name: string;
  durationMs: number;
};

function serializeServerTiming(entries: TimingEntry[]) {
  return entries
    .map((entry) => `${entry.name};dur=${entry.durationMs.toFixed(1)}`)
    .join(", ");
}

async function timeAsync<T>(
  entries: TimingEntry[],
  name: string,
  run: () => Promise<T>,
) {
  const startedAt = performance.now();
  try {
    return await run();
  } finally {
    entries.push({ name, durationMs: performance.now() - startedAt });
  }
}

function timeSync<T>(entries: TimingEntry[], name: string, run: () => T) {
  const startedAt = performance.now();
  try {
    return run();
  } finally {
    entries.push({ name, durationMs: performance.now() - startedAt });
  }
}

async function loadGeneratedLexiconItems(input: {
  week: number | null;
  timings: TimingEntry[];
}): Promise<LexiconItem[]> {
  const weeks = (await timeAsync(input.timings, "db_weeks", () =>
    prisma.content_pregnancy_week_data.findMany({
      where: {
        status: "published",
        ...(typeof input.week === "number" ? { week_number: input.week } : {}),
      },
      orderBy: { week_number: "asc" },
      select: {
        id: true,
        week_number: true,
        title: true,
        baby_summary: true,
        mother_summary: true,
        warning_signs: true,
        recommended_actions: true,
      },
    }),
  )) as GeneratedWeekRow[];

  const weekIds = weeks.map((week) => week.id);
  if (weekIds.length === 0) return [];

  const [days, checklists, questions] = (await Promise.all([
    timeAsync(input.timings, "db_days", () =>
      prisma.content_pregnancy_day_contents.findMany({
        where: { week_data_id: { in: weekIds } },
        orderBy: [{ week_data_id: "asc" }, { day_number: "asc" }],
        select: {
          id: true,
          week_data_id: true,
          day_number: true,
          title: true,
          baby_message: true,
          baby_development_payload: true,
          mother_changes_payload: true,
        },
      }),
    ),
    timeAsync(input.timings, "db_checklists", () =>
      prisma.content_week_checklists.findMany({
        where: {
          week_data_id: { in: weekIds },
          day_number: { not: null },
          is_active: true,
        },
        orderBy: [
          { week_data_id: "asc" },
          { day_number: "asc" },
          { display_order: "asc" },
        ],
        select: {
          week_data_id: true,
          day_number: true,
          title: true,
          description: true,
        },
      }),
    ),
    timeAsync(input.timings, "db_questions", () =>
      prisma.content_week_questions.findMany({
        where: {
          week_data_id: { in: weekIds },
          day_number: { not: null },
          is_active: true,
        },
        orderBy: [
          { week_data_id: "asc" },
          { day_number: "asc" },
          { display_order: "asc" },
        ],
        select: {
          week_data_id: true,
          day_number: true,
          question_text: true,
        },
      }),
    ),
  ])) as [
    GeneratedDaySourceRow[],
    GeneratedChecklistRow[],
    GeneratedQuestionRow[],
  ];

  return timeSync(input.timings, "build_items", () =>
    buildGeneratedLexiconItems({
      weeks,
      days,
      checklists,
      questions,
    }),
  );
}

async function loadWeekOverview(
  weekNumber: number,
): Promise<LexiconDetailResponseBody | null> {
  const week = (await prisma.content_pregnancy_week_data.findFirst({
    where: { week_number: weekNumber, status: "published" },
    select: {
      id: true,
      week_number: true,
      title: true,
      baby_summary: true,
      mother_summary: true,
      warning_signs: true,
      recommended_actions: true,
    },
  })) as GeneratedWeekRow | null;

  if (!week) return null;

  return {
    ...buildWeekLexiconItem(week),
    content: buildWeekDocument(week),
  };
}

async function loadWeekDay(input: {
  weekNumber: number;
  dayNumber: number;
}): Promise<LexiconDetailResponseBody | null> {
  const week = (await prisma.content_pregnancy_week_data.findFirst({
    where: { week_number: input.weekNumber, status: "published" },
    select: {
      id: true,
      week_number: true,
      title: true,
      baby_summary: true,
      mother_summary: true,
      warning_signs: true,
      recommended_actions: true,
    },
  })) as GeneratedWeekRow | null;

  if (!week) return null;

  const day = (await prisma.content_pregnancy_day_contents.findFirst({
    where: {
      week_data_id: week.id,
      day_number: input.dayNumber,
    },
    select: {
      id: true,
      week_data_id: true,
      day_number: true,
      title: true,
      baby_message: true,
      baby_development_payload: true,
      mother_changes_payload: true,
    },
  })) as GeneratedDaySourceRow | null;

  if (!day) return null;

  const [checklists, questions] = (await Promise.all([
    prisma.content_week_checklists.findMany({
      where: {
        week_data_id: week.id,
        day_number: input.dayNumber,
        is_active: true,
      },
      orderBy: { display_order: "asc" },
      select: {
        week_data_id: true,
        day_number: true,
        title: true,
        description: true,
      },
    }),
    prisma.content_week_questions.findMany({
      where: {
        week_data_id: week.id,
        day_number: input.dayNumber,
        is_active: true,
      },
      orderBy: { display_order: "asc" },
      select: {
        week_data_id: true,
        day_number: true,
        question_text: true,
      },
    }),
  ])) as [GeneratedChecklistRow[], GeneratedQuestionRow[]];

  const generatedDay = { ...day, week_number: week.week_number };
  return {
    ...buildDayLexiconItem(generatedDay, checklists, questions),
    content: buildDayDocument(generatedDay, checklists, questions),
  };
}

app.get("/", async (c) => {
  const timings: TimingEntry[] = [];
  const requestStartedAt = performance.now();
  try {
    const hintedUserId = c.req.query("userId") ?? "";
    await timeAsync(timings, "auth", () =>
      requireMobileSession(c, hintedUserId),
    );

    const weekFilter = parseWeekParam(c.req.query("week") ?? null);
    const surfaceFilter = c.req.query("surface")?.trim() || null;
    const queryFilter = c.req.query("q")?.trim() || null;

    const allItems = await loadGeneratedLexiconItems({
      week: weekFilter,
      timings,
    });
    const items = timeSync(timings, "filter", () =>
      filterLexiconItems(allItems, {
        week: weekFilter,
        surface: surfaceFilter,
        query: queryFilter,
      }),
    );

    const payload: LexiconResponseBody = { items };
    timings.push({
      name: "total",
      durationMs: performance.now() - requestStartedAt,
    });
    c.header("Server-Timing", serializeServerTiming(timings));
    return noStoreJson(c, payload);
  } catch (error) {
    console.error("mobile lexicon route error", error);
    return mobileRouteErrorResponse(c, error, "failed to load lexicon");
  }
});

app.get("/:id", async (c) => {
  try {
    const hintedUserId = c.req.query("userId") ?? "";
    await requireMobileSession(c, hintedUserId);

    const parsed = parseGeneratedLexiconId(c.req.param("id") ?? "");
    if (!parsed) {
      return c.json({ error: "잘못된 자료 식별자에요." }, 400);
    }

    const payload =
      parsed.surface === "week_overview"
        ? await loadWeekOverview(parsed.week)
        : await loadWeekDay({
            weekNumber: parsed.week,
            dayNumber: parsed.day,
          });

    if (!payload) {
      return c.json({ error: "자료를 찾지 못했어요." }, 404);
    }

    return noStoreJson(c, payload);
  } catch (error) {
    console.error("mobile lexicon detail route error", error);
    return mobileRouteErrorResponse(c, error, "failed to load lexicon detail");
  }
});

export default app;
