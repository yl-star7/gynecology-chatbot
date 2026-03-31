import { NextRequest, NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { supabaseSelect, supabaseInsert } from "@/lib/supabase/admin-client";

const VALID_QUESTION_TYPES = [
  "text",
  "single_choice",
  "multi_choice",
  "yes_no",
  "number",
] as const;
type QuestionType = (typeof VALID_QUESTION_TYPES)[number];

type QuestionRow = {
  id: string;
  week_data_id: string;
  day_content_id: string | null;
  day_number: number | null;
  code: string;
  question_text: string;
  question_type: QuestionType;
  help_text: string | null;
  question_payload: Record<string, unknown>;
  display_order: number;
  is_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type QuestionInsertPayload = {
  week_data_id: string;
  day_number?: number | null;
  code: string;
  question_text: string;
  question_type: QuestionType;
  help_text?: string | null;
  question_payload?: Record<string, unknown>;
  display_order?: number;
  is_required?: boolean;
  is_active?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isValidQuestionType(value: unknown): value is QuestionType {
  return VALID_QUESTION_TYPES.includes(value as QuestionType);
}

function parseInsertBody(body: unknown): QuestionInsertPayload | null {
  if (!isRecord(body)) {
    return null;
  }

  const weekDataId =
    typeof body.weekDataId === "string" ? body.weekDataId.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const questionText =
    typeof body.questionText === "string" ? body.questionText.trim() : "";

  if (!weekDataId || !code || !questionText) {
    return null;
  }

  const questionType = isValidQuestionType(body.questionType)
    ? body.questionType
    : "text";

  const dayNumber =
    typeof body.dayNumber === "number" && Number.isInteger(body.dayNumber)
      ? body.dayNumber
      : null;

  if (dayNumber !== null && (dayNumber < 1 || dayNumber > 7)) {
    return null;
  }

  const helpText =
    typeof body.helpText === "string" && body.helpText.trim()
      ? body.helpText.trim()
      : null;

  const questionPayload = isRecord(body.questionPayload)
    ? (body.questionPayload as Record<string, unknown>)
    : {};

  const displayOrder =
    typeof body.displayOrder === "number" ? body.displayOrder : 0;

  const isRequired =
    typeof body.isRequired === "boolean" ? body.isRequired : false;

  const isActive = typeof body.isActive === "boolean" ? body.isActive : true;

  return {
    week_data_id: weekDataId,
    day_number: dayNumber,
    code,
    question_text: questionText,
    question_type: questionType,
    help_text: helpText,
    question_payload: questionPayload,
    display_order: displayOrder,
    is_required: isRequired,
    is_active: isActive,
  };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const weekDataId = request.nextUrl.searchParams.get("weekDataId");

    const baseQuery =
      "content.week_questions?select=id,week_data_id,day_content_id,day_number,code,question_text,question_type,help_text,question_payload,display_order,is_required,is_active,created_at,updated_at";
    const filter = weekDataId ? `&week_data_id=eq.${weekDataId}` : "";
    const order =
      "&order=week_data_id.asc,day_number.asc.nullsfirst,display_order.asc";

    const rows = await supabaseSelect<QuestionRow[]>(
      `${baseQuery}${filter}${order}`,
    );

    return NextResponse.json({ questions: rows });
  } catch (error) {
    console.error("admin content questions GET error", error);
    return NextResponse.json(
      { error: "failed to load questions" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const payload = parseInsertBody(body);
    if (!payload) {
      return NextResponse.json(
        { error: "invalid question payload" },
        { status: 400 },
      );
    }

    const rows = await supabaseInsert<QuestionRow[]>(
      "content.week_questions",
      payload,
    );

    const created = Array.isArray(rows) ? rows[0] : rows;
    return NextResponse.json({ question: created }, { status: 201 });
  } catch (error) {
    console.error("admin content questions POST error", error);
    return NextResponse.json(
      { error: "failed to create question" },
      { status: 500 },
    );
  }
}
