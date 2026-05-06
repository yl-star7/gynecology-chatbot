/**
 * Schift workflow 의 summary_webhook 블록이 호출하는 internal endpoint.
 * 사용자가 오늘의 질문(attachment_question) 에 답한 턴의 응답 요약을 calendar_logs 에 기록한다.
 *
 * 인증: Bearer <CALENDAR_SUMMARY_WEBHOOK_SECRET>
 *
 * 예상 payload (Schift answer 블록 출력을 통째로 전달):
 *   {
 *     userId: string,
 *     sessionId: string,
 *     workflowStage: number | string,
 *     selectedQuestionId?: string,
 *     questionText?: string,
 *     userAnswer: string,
 *     assistantAnswer: string,
 *     compactSummary?: string | null,
 *     emotionTone?: string | null,
 *     moodId?: string | null,
 *     moodLabel?: string | null,
 *   }
 *
 * 필터: workflowStage !== 2 또는 selectedQuestionId 없으면 무시 (200 OK).
 */

import { NextRequest, NextResponse } from "next/server";

import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";
import {
  buildQuestionSummaryRecord,
  isQuestionAnswerText,
  isQuestionSummaryPendingText,
  shouldSaveQuestionSummary,
} from "@gynecology-chatbot/mobile-api/chat/question-summary";

function getExpectedSecret(): string | null {
  return process.env.CALENDAR_SUMMARY_WEBHOOK_SECRET?.trim() || null;
}

function toDateOnly(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

function getKstDateKey(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  try {
    const expected = getExpectedSecret();
    if (!expected) {
      return NextResponse.json(
        { error: "CALENDAR_SUMMARY_WEBHOOK_SECRET not configured" },
        { status: 503 },
      );
    }
    const auth = request.headers.get("authorization") ?? "";
    const provided = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    if (provided !== expected) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const userId = typeof body.userId === "string" ? body.userId : "";
    const sessionId =
      typeof body.sessionId === "string" && body.sessionId.trim()
        ? body.sessionId
        : null;
    const workflowStage = body.workflowStage;
    const selectedQuestionId =
      typeof body.selectedQuestionId === "string" && body.selectedQuestionId
        ? body.selectedQuestionId
        : null;

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const dateKey = (
      typeof body.dateKey === "string" ? body.dateKey : getKstDateKey()
    ).slice(0, 10);

    // 같은 (user, date, session, question) 로 이미 기록됐는지 확인
    const existing = selectedQuestionId
      ? await prisma.calendar_logs.findFirst({
          where: {
            user_id: userId,
            date: toDateOnly(dateKey),
            session_id: sessionId,
            entry_type: "question_summary",
            payload: {
              path: ["questionId"],
              equals: selectedQuestionId,
            } as Prisma.JsonFilter,
          },
          select: { id: true, summary: true, payload: true },
        })
      : null;
    const existingPayload =
      existing?.payload &&
      typeof existing.payload === "object" &&
      !Array.isArray(existing.payload)
        ? (existing.payload as {
            answer?: unknown;
            compactSummary?: unknown;
          })
        : null;
    const existingAnswer =
      typeof existingPayload?.answer === "string"
        ? existingPayload.answer
        : existing?.summary;
    const existingSummary =
      typeof existingPayload?.compactSummary === "string"
        ? existingPayload.compactSummary
        : existing?.summary;

    const alreadyIds = new Set(
      existing?.id &&
        isQuestionAnswerText({ userAnswer: existingAnswer }) &&
        !isQuestionSummaryPendingText(existingSummary)
        ? [selectedQuestionId as string]
        : [],
    );

    if (
      !shouldSaveQuestionSummary({
        workflowStage,
        selectedQuestionId,
        alreadyPersistedQuestionIds: alreadyIds,
        compactSummary:
          typeof body.compactSummary === "string" ? body.compactSummary : null,
      })
    ) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const record = buildQuestionSummaryRecord({
      userId,
      sessionId,
      dateKey,
      questionId: selectedQuestionId!,
      questionText:
        typeof body.questionText === "string" ? body.questionText : null,
      userAnswer: typeof body.userAnswer === "string" ? body.userAnswer : "",
      assistantAnswer:
        typeof body.assistantAnswer === "string" ? body.assistantAnswer : "",
      compactSummary:
        typeof body.compactSummary === "string" ? body.compactSummary : null,
      emotionTone:
        typeof body.emotionTone === "string" ? body.emotionTone : null,
      moodId: typeof body.moodId === "string" ? body.moodId : null,
      moodLabel: typeof body.moodLabel === "string" ? body.moodLabel : null,
    });

    const data = {
      user_id: record.userId,
      session_id: record.sessionId,
      date: toDateOnly(record.date),
      entry_type: record.entryType,
      title: record.title,
      summary: record.summary,
      payload: record.payload as Prisma.InputJsonValue,
    };

    if (existing?.id) {
      await prisma.calendar_logs.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.calendar_logs.create({ data });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("calendar question-summary webhook error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to record question summary",
      },
      { status: 500 },
    );
  }
}
