import { Hono } from "hono";
import {
  buildMobileWeeksPayload,
  normalizeWeeklyEncyclopediaRows,
  parseWeekParam,
  type RawWeeklyEncyclopediaRow,
  type SourceWeekRow,
} from "@gynecology-chatbot/mobile-api/weeks/weekly-encyclopedia";
import { dbSelect } from "@gynecology-chatbot/mobile-api/db/admin-client";
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
  const rows = await dbSelect<RawWeeklyEncyclopediaRow[]>(
    `v_weekly_encyclopedia?select=week_number,content_scope,category,title,summary,body,items${
      typeof weekFilter === "number" ? `&week_number=eq.${weekFilter}` : ""
    }&order=week_number.asc`,
  );

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
        dbSelect<SourceWeekRow[]>(
          `content_pregnancy_week_data?select=week_number,title,baby_size_label,baby_summary,mother_summary&status=eq.published${
            typeof weekFilter === "number"
              ? `&week_number=eq.${weekFilter}`
              : ""
          }&order=week_number.asc`,
        ),
      ),
      timeAsync(timings, "db_documents", () =>
        dbSelect<Array<{ id: string; pregnancy_week: number | null }>>(
          `content_pregnancy_documents?select=id,pregnancy_week${
            typeof weekFilter === "number"
              ? `&pregnancy_week=eq.${weekFilter}`
              : ""
          }&order=pregnancy_week.asc`,
        ).then((rows) => rows.filter((row) => row.pregnancy_week !== null)),
      ),
    ]);

    const payload = timeSync(timings, "build", () =>
      buildMobileWeeksPayload({
        sourceWeeks: rows.map(
          (row): SourceWeekRow => ({
            week_number: row.week_number,
            title: row.title,
            baby_size_label: row.baby_size_label,
            baby_summary: row.baby_summary,
            mother_summary: row.mother_summary,
          }),
        ),
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
