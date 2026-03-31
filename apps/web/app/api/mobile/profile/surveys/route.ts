import { NextRequest, NextResponse } from "next/server";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client";

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
    const client = getSupabaseAdminClient();
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

    const { data: questions, error: questionError } = await client
      .from("content_week_questions")
      .select("id,question_text,question_type,help_text,question_payload")
      .eq("id", questionId)
      .limit(1);
    if (questionError) {
      throw questionError;
    }
    const question = questions[0];

    if (!question) {
      return NextResponse.json(
        { error: "question not found" },
        { status: 404 },
      );
    }

    const now = new Date().toISOString();

    const { error: logError } = await client.from("calendar_logs").insert({
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
    if (logError) {
      throw logError;
    }

    const { data: existingEvents, error: eventError } = await client
      .from("user_question_events")
      .select("id,question_id,status")
      .eq("user_id", userId)
      .eq("question_id", questionId)
      .order("updated_at", { ascending: false })
      .limit(1);
    if (eventError) {
      throw eventError;
    }

    if (existingEvents[0]) {
      const { error: updateError } = await client
        .from("user_question_events")
        .update({
          status: "answered",
          answer_message_id: null,
          answered_at: now,
          updated_at: now,
        })
        .eq("id", existingEvents[0].id);
      if (updateError) {
        throw updateError;
      }
    } else {
      const { error: insertError } = await client
        .from("user_question_events")
        .insert({
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
      if (insertError) {
        throw insertError;
      }
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
