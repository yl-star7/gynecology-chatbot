import { NextRequest, NextResponse } from "next/server";

import {
  createAdminAuditLogSafe,
  resolveAdminActorId,
} from "@/lib/admin/admin-actor";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { prisma } from "@gynecology-chatbot/db/prisma";

const ALLOWED_MOODS = ["calm", "joyful", "anxious", "tired", "sad"] as const;
type BabyComfortMood = (typeof ALLOWED_MOODS)[number];

interface BabyComfortPoolPayload {
  text: string;
  tag_week: number | null;
  tag_mood: BabyComfortMood | null;
  weight: number;
  active: boolean;
}

function parseMood(value: unknown): BabyComfortMood | null {
  if (value === null || value === undefined || value === "") return null;
  if (
    typeof value === "string" &&
    (ALLOWED_MOODS as readonly string[]).includes(value)
  ) {
    return value as BabyComfortMood;
  }
  throw new Error("invalid_tag_mood");
}

function parseWeek(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n =
    typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) throw new Error("invalid_tag_week");
  if (n < 1 || n > 40) throw new Error("invalid_tag_week");
  return n;
}

function parseWeight(value: unknown): number {
  if (value === null || value === undefined || value === "") return 1;
  const n =
    typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(n) || n < 0) return 1;
  return Math.trunc(n);
}

function parsePayload(raw: unknown): BabyComfortPoolPayload {
  if (!raw || typeof raw !== "object") throw new Error("invalid_payload");
  const record = raw as Record<string, unknown>;
  const text = typeof record.text === "string" ? record.text.trim() : "";
  if (!text) throw new Error("text_required");

  return {
    text,
    tag_week: parseWeek(record.tag_week),
    tag_mood: parseMood(record.tag_mood),
    weight: parseWeight(record.weight),
    active: record.active === undefined ? true : Boolean(record.active),
  };
}

export async function GET(request: NextRequest) {
  const admin = await readAdminSessionUser();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const filterActive = searchParams.get("active");
  const filterWeekRaw = searchParams.get("week");
  const filterMoodRaw = searchParams.get("mood");

  const where: Record<string, unknown> = {};
  if (filterActive === "true") where.active = true;
  if (filterActive === "false") where.active = false;
  if (filterWeekRaw) {
    const n = Number.parseInt(filterWeekRaw, 10);
    if (Number.isFinite(n)) where.tag_week = n;
  }
  if (
    filterMoodRaw &&
    (ALLOWED_MOODS as readonly string[]).includes(filterMoodRaw)
  ) {
    where.tag_mood = filterMoodRaw;
  }

  try {
    const rows = await prisma.content_baby_comfort_pool.findMany({
      where,
      orderBy: [{ tag_week: "asc" }, { updated_at: "desc" }],
    });

    return NextResponse.json({
      items: rows.map((row) => ({
        id: row.id,
        text: row.text,
        tag_week: row.tag_week,
        tag_mood: row.tag_mood,
        weight: row.weight,
        active: row.active,
        has_snapshot: row.previous_snapshot !== null,
        updated_at: row.updated_at.toISOString(),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // graceful fallback when table is missing in the current environment
    if (
      /does not exist|relation .* does not exist|P2021|P2010/i.test(message)
    ) {
      return NextResponse.json({ items: [], unavailable: true });
    }
    console.error("[admin/pools/baby-comfort] GET failed", error);
    return NextResponse.json(
      { error: "internal_error", items: [] },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const admin = await readAdminSessionUser();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: BabyComfortPoolPayload;
  try {
    const raw = (await request.json()) as unknown;
    payload = parsePayload(raw);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "invalid_payload",
      },
      { status: 400 },
    );
  }

  try {
    const actorId = await resolveAdminActorId(admin.id);
    const created = await prisma.content_baby_comfort_pool.create({
      data: {
        text: payload.text,
        tag_week: payload.tag_week,
        tag_mood: payload.tag_mood,
        weight: payload.weight,
        active: payload.active,
        created_by: actorId,
        updated_by: actorId,
      },
    });

    await createAdminAuditLogSafe({
      adminUserId: admin.id,
      actionType: "create",
      entityType: "baby-comfort-pool",
      entityId: created.id,
      reason: "admin pool create",
      beforePayload: {},
      afterPayload: {
        text: created.text,
        tag_week: created.tag_week,
        tag_mood: created.tag_mood,
        weight: created.weight,
        active: created.active,
      },
    });

    return NextResponse.json({
      item: {
        id: created.id,
        text: created.text,
        tag_week: created.tag_week,
        tag_mood: created.tag_mood,
        weight: created.weight,
        active: created.active,
        has_snapshot: false,
        updated_at: created.updated_at.toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      /does not exist|relation .* does not exist|P2021|P2010/i.test(message)
    ) {
      return NextResponse.json(
        {
          error:
            "아기 위안 풀 테이블이 현재 환경에 없습니다. 운영팀에 문의해 주세요.",
        },
        { status: 503 },
      );
    }
    console.error("[admin/pools/baby-comfort] POST failed", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
