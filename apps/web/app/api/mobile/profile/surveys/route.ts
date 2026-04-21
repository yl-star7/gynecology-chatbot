import { NextRequest, NextResponse } from "next/server";
import { createKoreanDateKey } from "@gynecology-chatbot/app-core/time";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";

import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";

type QuestionRow = {
  id: string;
  question_text: string;
  question_type:
    | "text"
    | "single_choice"
    | "multi_choice"
    | "yes_no"
    | "number";
  help_text: string | null;
  question_payload: Record<string, unknown> | null;
};

function getKstDateKey() {
  return createKoreanDateKey();
}

function parseDateOnly(isoDate: string) {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function asObject<T>(value: Prisma.JsonValue | null | undefined): T | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as T)
    : null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const hintedUserId = typeof body.userId === "string" ? body.userId : "";
    const questionId =
      typeof body.questionId === "string" ? body.questionId.trim() : "";
    const answer = typeof body.answer === "string" ? body.answer.trim() : "";

    if (!questionId || !answer) {
      return NextResponse.json(
        { error: "questionId and answer are required" },
        { status: 400 },
      );
    }

    const { userId } = await requireMobileSession(request, hintedUserId);

    const questionRecord = await prisma.content_week_questions.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        question_text: true,
        question_type: true,
        help_text: true,
        question_payload: true,
      },
    });
    const question: QuestionRow | null = questionRecord
      ? {
          id: questionRecord.id,
          question_text: questionRecord.question_text,
          question_type:
            questionRecord.question_type as QuestionRow["question_type"],
          help_text: questionRecord.help_text,
          question_payload: asObject<QuestionRow["question_payload"]>(
            questionRecord.question_payload,
          ),
        }
      : null;

    if (!question) {
      return NextResponse.json(
        { error: "question not found" },
        { status: 404 },
      );
    }

    const now = new Date();

    await prisma.calendar_logs.create({
      data: {
        user_id: userId,
        session_id: null,
        date: parseDateOnly(getKstDateKey()),
        entry_type: "survey_response",
        title: question.question_text,
        summary: answer,
        payload: {
          questionId: question.id,
          questionType: question.question_type,
          answer,
          source: "profile_survey",
        },
      },
    });

    const existingEvent = await prisma.user_question_events.findFirst({
      where: {
        user_id: userId,
        question_id: questionId,
      },
      orderBy: { updated_at: "desc" },
      select: { id: true },
    });

    if (existingEvent?.id) {
      await prisma.user_question_events.update({
        where: { id: existingEvent.id },
        data: {
          status: "answered",
          answer_message_id: null,
          answered_at: now,
          updated_at: now,
        },
      });
    } else {
      await prisma.user_question_events.create({
        data: {
          user_id: userId,
          question_id: questionId,
          session_id: null,
          prompt_message_id: null,
          answer_message_id: null,
          status: "answered",
          sent_at: now,
          answered_at: now,
          updated_at: now,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("mobile profile surveys route error", error);
    return mobileRouteErrorResponse(
      error,
      "failed to submit survey answer",
      400,
    );
  }
}
