import { NextRequest, NextResponse } from "next/server";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";
import {
  supabaseInsert,
  supabaseSelect,
  supabaseUpdate,
} from "@/lib/mobile/supabase-rest";

type QuestionRow = {
  id: string;
  question_text: string;
  question_type: "text" | "single_choice" | "multi_choice" | "yes_no" | "number";
  help_text: string | null;
  question_payload: Record<string, unknown> | null;
};

type QuestionEventRow = {
  id: string;
  question_id: string;
  status: "sent" | "opened" | "answered" | "skipped";
};

function getKstDateKey() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
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

    const questions = await supabaseSelect<QuestionRow[]>(
      `v_week_questions?select=id,question_text,question_type,help_text,question_payload&id=eq.${questionId}&limit=1`,
    );
    const question = questions[0];

    if (!question) {
      return NextResponse.json({ error: "question not found" }, { status: 404 });
    }

    const now = new Date().toISOString();

    await supabaseInsert("calendar_logs", {
      user_id: userId,
      session_id: null,
      date: getKstDateKey(),
      entry_type: "survey_response",
      title: question.question_text,
      summary: answer,
      payload: {
        questionId: question.id,
        questionType: question.question_type,
        answer,
        source: "profile_survey",
      },
    });

    const existingEvents = await supabaseSelect<QuestionEventRow[]>(
      `user_question_events?select=id,question_id,status&user_id=eq.${userId}&question_id=eq.${questionId}&order=updated_at.desc&limit=1`,
    );

    if (existingEvents[0]) {
      await supabaseUpdate(`user_question_events?id=eq.${existingEvents[0].id}`, {
        status: "answered",
        answer_message_id: null,
        answered_at: now,
        updated_at: now,
      });
    } else {
      await supabaseInsert("user_question_events", {
        user_id: userId,
        question_id: questionId,
        session_id: null,
        prompt_message_id: null,
        answer_message_id: null,
        status: "answered",
        sent_at: now,
        answered_at: now,
        updated_at: now,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("mobile profile surveys route error", error);
    return mobileRouteErrorResponse(error, "failed to submit survey answer", 400);
  }
}
