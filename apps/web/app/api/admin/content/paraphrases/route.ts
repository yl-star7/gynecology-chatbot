import { NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import {
  supabaseSelect,
  supabaseUpdate,
} from "@/lib/supabase/admin-client";

type ParaphraseRow = {
  id: string;
  source_week_number: number;
  source_day_number: number | null;
  source_code: string | null;
  source_table: string;
  source_id: string | null;
  content_scope: string;
  category: string;
  title: string | null;
  summary: string | null;
  body: string | null;
  items: unknown[];
  status: "needs_review" | "ready" | "archived" | "failed";
  is_active: boolean;
  updated_at: string;
};

function mapParaphrase(row: ParaphraseRow) {
  return {
    id: row.id,
    weekNumber: row.source_week_number,
    dayNumber: row.source_day_number,
    sourceCode: row.source_code,
    sourceTable: row.source_table,
    sourceId: row.source_id,
    contentScope: row.content_scope,
    category: row.category,
    title: row.title,
    summary: row.summary,
    body: row.body,
    items: row.items ?? [],
    status: row.status,
    isActive: row.is_active,
    updatedAt: row.updated_at,
  };
}

function parseWeekNumber(value: string | null) {
  if (!value) return null;
  const weekNumber = Number(value);
  if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 40) {
    return null;
  }
  return weekNumber;
}

function encodeFilter(value: string | number) {
  return encodeURIComponent(String(value));
}

function buildPeerFilterPath(item: Pick<
  ParaphraseRow,
  | "source_table"
  | "source_week_number"
  | "source_day_number"
  | "source_code"
  | "content_scope"
  | "category"
>) {
  const params = new URLSearchParams({
    source_table: `eq.${item.source_table}`,
    source_week_number: `eq.${item.source_week_number}`,
    content_scope: `eq.${item.content_scope}`,
    category: `eq.${item.category}`,
  });

  if (item.source_day_number === null) {
    params.set("source_day_number", "is.null");
  } else {
    params.set("source_day_number", `eq.${item.source_day_number}`);
  }

  if (item.source_code === null) {
    params.set("source_code", "is.null");
  } else {
    params.set("source_code", `eq.${item.source_code}`);
  }

  return `content_paraphrased_items?${params.toString()}`;
}

export async function GET(request: Request) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const weekNumber = parseWeekNumber(url.searchParams.get("weekNumber"));
    if (!weekNumber) {
      return NextResponse.json({ error: "invalid weekNumber" }, { status: 400 });
    }

    const rows = await supabaseSelect<ParaphraseRow[]>(
      [
        "content_paraphrased_items?select=id,source_week_number,source_day_number,source_code,source_table,source_id,content_scope,category,title,summary,body,items,status,is_active,updated_at",
        `source_week_number=eq.${weekNumber}`,
        "order=content_scope.asc,category.asc,source_day_number.asc.nullslast,source_code.asc",
      ].join("&"),
    );

    return NextResponse.json({
      paraphrases: rows.map(mapParaphrase),
    });
  } catch (error) {
    console.error("admin content paraphrases get route error", error);
    return NextResponse.json(
      { error: "failed to load paraphrases" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      itemId?: unknown;
      action?: unknown;
      reviewNote?: unknown;
    };
    const itemId = typeof body.itemId === "string" ? body.itemId.trim() : "";
    const action = body.action;
    const reviewNote =
      typeof body.reviewNote === "string" ? body.reviewNote.trim() : null;

    if (!itemId || action !== "activate") {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    const currentRows = await supabaseSelect<ParaphraseRow[]>(
      `content_paraphrased_items?select=id,source_week_number,source_day_number,source_code,source_table,source_id,content_scope,category,title,summary,body,items,status,is_active,updated_at&id=eq.${encodeFilter(itemId)}&limit=1`,
    );
    const current = currentRows[0];
    if (!current) {
      return NextResponse.json(
        { error: "paraphrase not found" },
        { status: 404 },
      );
    }

    await supabaseUpdate(buildPeerFilterPath(current), { is_active: false });

    const updatedRows = await supabaseUpdate<ParaphraseRow[]>(
      `content_paraphrased_items?id=eq.${encodeFilter(itemId)}`,
      {
        status: "ready",
        is_active: true,
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
        ...(reviewNote ? { review_note: reviewNote } : {}),
      },
    );

    return NextResponse.json({
      paraphrase: mapParaphrase(updatedRows[0] ?? current),
    });
  } catch (error) {
    console.error("admin content paraphrases patch route error", error);
    return NextResponse.json(
      { error: "failed to update paraphrase" },
      { status: 500 },
    );
  }
}
