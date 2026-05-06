import { NextRequest, NextResponse } from "next/server";

import { createAdminAuditLogSafe } from "@/lib/admin/admin-actor";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { saveSnapshotAndUpdate } from "@/lib/admin/snapshot-helper";
import { prisma } from "@gynecology-chatbot/db/prisma";

const ALLOWED_MOODS = ["calm", "joyful", "anxious", "tired", "sad"] as const;
type BabyComfortMood = (typeof ALLOWED_MOODS)[number];

function parseMood(value: unknown): BabyComfortMood | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (
    typeof value === "string" &&
    (ALLOWED_MOODS as readonly string[]).includes(value)
  ) {
    return value as BabyComfortMood;
  }
  throw new Error("invalid_tag_mood");
}

function parseWeek(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const n =
    typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) throw new Error("invalid_tag_week");
  if (n < 1 || n > 40) throw new Error("invalid_tag_week");
  return n;
}

function parsePatchPayload(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") throw new Error("invalid_payload");
  const record = raw as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if (typeof record.text === "string") {
    const trimmed = record.text.trim();
    if (!trimmed) throw new Error("text_required");
    data.text = trimmed;
  }
  if ("tag_week" in record) {
    const week = parseWeek(record.tag_week);
    if (week !== undefined) data.tag_week = week;
  }
  if ("tag_mood" in record) {
    const mood = parseMood(record.tag_mood);
    if (mood !== undefined) data.tag_mood = mood;
  }
  if ("weight" in record) {
    const raw = record.weight;
    const n = typeof raw === "number" ? raw : Number.parseInt(String(raw), 10);
    if (Number.isFinite(n) && n >= 0) data.weight = Math.trunc(n);
  }
  if ("active" in record) {
    data.active = Boolean(record.active);
  }
  return data;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await readAdminSessionUser();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  let data: Record<string, unknown>;
  try {
    const raw = (await request.json()) as unknown;
    data = parsePatchPayload(raw);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "invalid_payload" },
      { status: 400 },
    );
  }

  const before = await prisma.content_baby_comfort_pool.findUnique({
    where: { id },
  });
  if (!before) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const updated = await saveSnapshotAndUpdate({
    model: prisma.content_baby_comfort_pool as unknown as Parameters<
      typeof saveSnapshotAndUpdate
    >[0]["model"],
    id,
    data,
    actorId: admin.id,
  });

  await createAdminAuditLogSafe({
    adminUserId: admin.id,
    actionType: "update",
    entityType: "baby-comfort-pool",
    entityId: id,
    reason: "admin pool update",
    beforePayload: {
      text: before.text,
      tag_week: before.tag_week,
      tag_mood: before.tag_mood,
      weight: before.weight,
      active: before.active,
    },
    afterPayload: data,
  });

  const row = updated as unknown as {
    id: string;
    text: string;
    tag_week: number | null;
    tag_mood: string | null;
    weight: number;
    active: boolean;
    previous_snapshot: unknown;
    updated_at: Date;
  };
  return NextResponse.json({
    item: {
      id: row.id,
      text: row.text,
      tag_week: row.tag_week,
      tag_mood: row.tag_mood,
      weight: row.weight,
      active: row.active,
      has_snapshot: row.previous_snapshot !== null,
      updated_at: row.updated_at.toISOString(),
    },
  });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await readAdminSessionUser();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const before = await prisma.content_baby_comfort_pool.findUnique({
    where: { id },
  });
  if (!before) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.content_baby_comfort_pool.delete({ where: { id } });

  await createAdminAuditLogSafe({
    adminUserId: admin.id,
    actionType: "delete",
    entityType: "baby-comfort-pool",
    entityId: id,
    reason: "admin pool delete",
    beforePayload: {
      text: before.text,
      tag_week: before.tag_week,
      tag_mood: before.tag_mood,
      weight: before.weight,
      active: before.active,
    },
    afterPayload: {},
  });

  return NextResponse.json({ ok: true });
}
