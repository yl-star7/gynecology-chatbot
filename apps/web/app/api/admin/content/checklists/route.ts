import { NextRequest, NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { dbSelect, dbInsert } from "@/lib/db/admin-client";

type ChecklistRow = {
  id: string;
  week_data_id: string;
  day_content_id: string | null;
  day_number: number | null;
  code: string;
  title: string;
  description: string | null;
  checklist_payload: Record<string, unknown>;
  display_order: number;
  is_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ChecklistInsertPayload = {
  week_data_id: string;
  day_number?: number | null;
  code: string;
  title: string;
  description?: string | null;
  checklist_payload?: Record<string, unknown>;
  display_order?: number;
  is_required?: boolean;
  is_active?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseInsertBody(body: unknown): ChecklistInsertPayload | null {
  if (!isRecord(body)) {
    return null;
  }

  const weekDataId =
    typeof body.weekDataId === "string" ? body.weekDataId.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";

  if (!weekDataId || !code || !title) {
    return null;
  }

  const dayNumber =
    typeof body.dayNumber === "number" && Number.isInteger(body.dayNumber)
      ? body.dayNumber
      : null;

  if (dayNumber !== null && (dayNumber < 1 || dayNumber > 7)) {
    return null;
  }

  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim()
      : null;

  const checklistPayload = isRecord(body.checklistPayload)
    ? (body.checklistPayload as Record<string, unknown>)
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
    title,
    description,
    checklist_payload: checklistPayload,
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
      "content.week_checklists?select=id,week_data_id,day_content_id,day_number,code,title,description,checklist_payload,display_order,is_required,is_active,created_at,updated_at";
    const filter = weekDataId ? `&week_data_id=eq.${weekDataId}` : "";
    const order =
      "&order=week_data_id.asc,day_number.asc.nullsfirst,display_order.asc";

    const rows = await dbSelect<ChecklistRow[]>(
      `${baseQuery}${filter}${order}`,
    );

    return NextResponse.json({ checklists: rows });
  } catch (error) {
    console.error("admin content checklists GET error", error);
    return NextResponse.json(
      { error: "failed to load checklists" },
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
        { error: "invalid checklist payload" },
        { status: 400 },
      );
    }

    const rows = await dbInsert<ChecklistRow[]>(
      "content.week_checklists",
      payload,
    );

    const created = Array.isArray(rows) ? rows[0] : rows;
    return NextResponse.json({ checklist: created }, { status: 201 });
  } catch (error) {
    console.error("admin content checklists POST error", error);
    return NextResponse.json(
      { error: "failed to create checklist" },
      { status: 500 },
    );
  }
}
