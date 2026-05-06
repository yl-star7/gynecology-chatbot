import { Hono } from "hono";
import { prisma } from "@gynecology-chatbot/db/prisma";
import {
  buildMobileWeeksPayload,
  normalizeWeeklyEncyclopediaRows,
  parseWeekParam,
  type SourceWeekRow,
} from "@gynecology-chatbot/mobile-api/weeks/weekly-encyclopedia";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "../../lib/session-auth.js";

const app = new Hono();

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

async function loadWeeklyEncyclopediaRows(weekFilter: number | null) {
  const rows = await prisma.v_weekly_encyclopedia.findMany({
    where:
      typeof weekFilter === "number" ? { week_number: weekFilter } : undefined,
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

  return normalizeWeeklyEncyclopediaRows(rows);
}

app.get("/", async (c) => {
  const timings: TimingEntry[] = [];
  const requestStartedAt = performance.now();
  try {
    await timeAsync(timings, "auth", () => requireMobileSession(c));
    const weekFilter = parseWeekParam(c.req.query("week") ?? null);

    const [encyclopediaRows, rows, documentLinkRows] = await Promise.all([
      timeAsync(timings, "db_encyclopedia", () =>
        loadWeeklyEncyclopediaRows(weekFilter),
      ),
      timeAsync(timings, "db_source_weeks", () =>
        prisma.content_pregnancy_week_data.findMany({
          where: {
            status: "published",
            ...(typeof weekFilter === "number"
              ? { week_number: weekFilter }
              : {}),
          },
          orderBy: { week_number: "asc" },
          select: {
            week_number: true,
            title: true,
            baby_size_label: true,
            baby_summary: true,
            mother_summary: true,
          },
        }),
      ),
      timeAsync(timings, "db_documents", () =>
        prisma.content_pregnancy_documents.findMany({
          where:
            typeof weekFilter === "number"
              ? { pregnancy_week: weekFilter }
              : { pregnancy_week: { not: null } },
          orderBy: [{ pregnancy_week: "asc" }, { updated_at: "desc" }],
          select: {
            id: true,
            pregnancy_week: true,
          },
        }),
      ),
    ]);

    const payload = timeSync(timings, "build", () =>
      buildMobileWeeksPayload({
        sourceWeeks: rows.map((row): SourceWeekRow => ({
          week_number: row.week_number,
          title: row.title,
          baby_size_label: row.baby_size_label,
          baby_summary: row.baby_summary,
          mother_summary: row.mother_summary,
        })),
        encyclopediaRows,
        documentLinks: documentLinkRows,
      }),
    );
    timings.push({
      name: "total",
      durationMs: performance.now() - requestStartedAt,
    });
    c.header("Server-Timing", serializeServerTiming(timings));
    return c.json(payload);
  } catch (error) {
    console.error("mobile weeks route error", error);
    return mobileRouteErrorResponse(c, error, "failed to load weeks");
  }
});

export default app;
