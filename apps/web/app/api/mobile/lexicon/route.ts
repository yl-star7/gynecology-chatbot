import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@gynecology-chatbot/db/prisma";
import {
  isMobileSessionError,
  mobileNoStoreJson,
  requireMobileSession,
} from "@/lib/mobile/session-auth";

import {
  buildGeneratedLexiconItems,
  filterLexiconItems,
  parseWeekParam,
  type GeneratedChecklistRow,
  type GeneratedDaySourceRow,
  type GeneratedQuestionRow,
  type GeneratedWeekRow,
  type LexiconItem,
} from "./documents";

export const maxDuration = 30;

export type LexiconResponseBody = {
  items: LexiconItem[];
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

export async function GET(request: NextRequest) {
  const timings: TimingEntry[] = [];
  const requestStartedAt = performance.now();
  try {
    const url = new URL(request.url);
    const hintedUserId = url.searchParams.get("userId") ?? "";
    await timeAsync(timings, "auth", () =>
      requireMobileSession(request, hintedUserId),
    );

    const weekFilter = parseWeekParam(url.searchParams.get("week"));
    const surfaceFilter = url.searchParams.get("surface")?.trim() || null;
    const queryFilter = url.searchParams.get("q")?.trim() || null;

    const allItems = await loadGeneratedLexiconItems({
      week: weekFilter,
      timings,
    });
    const items = timeSync(timings, "filter", () => filterLexiconItems(allItems, {
      week: weekFilter,
      surface: surfaceFilter,
      query: queryFilter,
    }));

    const payload: LexiconResponseBody = { items };
    timings.push({
      name: "total",
      durationMs: performance.now() - requestStartedAt,
    });
    return mobileNoStoreJson(payload, {
      headers: {
        "Server-Timing": serializeServerTiming(timings),
      },
    });
  } catch (error) {
    if (isMobileSessionError(error)) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 401 },
      );
    }
    console.error("mobile lexicon route error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "사전 자료를 불러오지 못했어요.",
      },
      { status: 500 },
    );
  }
}
