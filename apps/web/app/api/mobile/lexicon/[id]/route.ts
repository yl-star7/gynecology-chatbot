import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@gynecology-chatbot/db/prisma";
import {
  isMobileSessionError,
  mobileNoStoreJson,
  requireMobileSession,
} from "@/lib/mobile/session-auth";

import {
  buildDayDocument,
  buildDayLexiconItem,
  buildWeekDocument,
  buildWeekLexiconItem,
  parseGeneratedLexiconId,
  type GeneratedChecklistRow,
  type GeneratedDaySourceRow,
  type GeneratedQuestionRow,
  type GeneratedWeekRow,
  type LexiconItem,
} from "../documents";

export const maxDuration = 30;

export type LexiconDetailResponseBody = LexiconItem & {
  content: string;
};

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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const url = new URL(request.url);
    const hintedUserId = url.searchParams.get("userId") ?? "";
    await requireMobileSession(request, hintedUserId);

    const { id } = await context.params;
    const parsed = parseGeneratedLexiconId(id ?? "");
    if (!parsed) {
      return NextResponse.json(
        { error: "잘못된 자료 식별자에요." },
        { status: 400 },
      );
    }

    const payload =
      parsed.surface === "week_overview"
        ? await loadWeekOverview(parsed.week)
        : await loadWeekDay({
            weekNumber: parsed.week,
            dayNumber: parsed.day,
          });

    if (!payload) {
      return NextResponse.json(
        { error: "자료를 찾지 못했어요." },
        { status: 404 },
      );
    }

    return mobileNoStoreJson(payload);
  } catch (error) {
    if (isMobileSessionError(error)) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 401 },
      );
    }
    console.error("mobile lexicon detail route error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "자료를 불러오지 못했어요.",
      },
      { status: 500 },
    );
  }
}
