import { NextResponse } from "next/server";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";
import { readAdminSessionUser } from "@/lib/admin/auth";

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

function buildPeerFilterPath(
  item: Pick<
    ParaphraseRow,
    | "source_table"
    | "source_week_number"
    | "source_day_number"
    | "source_code"
    | "content_scope"
    | "category"
  >,
) {
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
      return NextResponse.json(
        { error: "invalid weekNumber" },
        { status: 400 },
      );
    }

    const rows = await prisma.content_paraphrased_items.findMany({
      where: { source_week_number: weekNumber },
      orderBy: [
        { content_scope: "asc" },
        { category: "asc" },
        { source_day_number: "asc" },
        { source_code: "asc" },
      ],
      select: {
        id: true,
        source_week_number: true,
        source_day_number: true,
        source_code: true,
        source_table: true,
        source_id: true,
        content_scope: true,
        category: true,
        title: true,
        summary: true,
        body: true,
        items: true,
        status: true,
        is_active: true,
        updated_at: true,
      },
    });

    return NextResponse.json({
      paraphrases: rows.map((row) =>
        mapParaphrase({
          ...row,
          items: Array.isArray(row.items) ? row.items : [],
          updated_at: row.updated_at.toISOString(),
          status: row.status as ParaphraseRow["status"],
        }),
      ),
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

    const currentRecord = await prisma.content_paraphrased_items.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        source_week_number: true,
        source_day_number: true,
        source_code: true,
        source_table: true,
        source_id: true,
        content_scope: true,
        category: true,
        title: true,
        summary: true,
        body: true,
        items: true,
        status: true,
        is_active: true,
        updated_at: true,
      },
    });
    const current = currentRecord
      ? ({
          ...currentRecord,
          items: Array.isArray(currentRecord.items) ? currentRecord.items : [],
          updated_at: currentRecord.updated_at.toISOString(),
          status: currentRecord.status as ParaphraseRow["status"],
        } satisfies ParaphraseRow)
      : null;
    if (!current) {
      return NextResponse.json(
        { error: "paraphrase not found" },
        { status: 404 },
      );
    }

    await prisma.content_paraphrased_items.updateMany({
      where: {
        source_table: current.source_table,
        source_week_number: current.source_week_number,
        source_day_number: current.source_day_number,
        source_code: current.source_code,
        content_scope: current.content_scope,
        category: current.category,
      },
      data: { is_active: false },
    });

    const updated = await prisma.content_paraphrased_items.update({
      where: { id: itemId },
      data: {
        status: "ready",
        is_active: true,
        reviewed_by: admin.id,
        reviewed_at: new Date(),
        ...(reviewNote ? { review_note: reviewNote } : {}),
      },
      select: {
        id: true,
        source_week_number: true,
        source_day_number: true,
        source_code: true,
        source_table: true,
        source_id: true,
        content_scope: true,
        category: true,
        title: true,
        summary: true,
        body: true,
        items: true,
        status: true,
        is_active: true,
        updated_at: true,
      },
    });

    return NextResponse.json({
      paraphrase: mapParaphrase({
        ...updated,
        items: Array.isArray(updated.items) ? updated.items : [],
        updated_at: updated.updated_at.toISOString(),
        status: updated.status as ParaphraseRow["status"],
      }),
    });
  } catch (error) {
    console.error("admin content paraphrases patch route error", error);
    return NextResponse.json(
      { error: "failed to update paraphrase" },
      { status: 500 },
    );
  }
}
