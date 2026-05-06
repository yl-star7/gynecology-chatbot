import { Hono } from "hono";
import type { Prisma } from "@gynecology-chatbot/db/prisma";
import { prisma } from "@gynecology-chatbot/db/prisma";

import { requireAdminProxy, type AdminProxyVariables } from "./auth.js";

const app = new Hono<{ Variables: AdminProxyVariables }>();

app.use("*", requireAdminProxy);

const MOOD_VARIANT_SCENARIOS = new Set([
  "mood_intake",
  "week_info_opt_in",
  "baby_info_offer",
  "baby_info",
  "mother_info",
  "week_info",
  "symptom_counsel",
  "emotion_checkin",
  "emotion_reason",
  "attachment_question",
  "letter_reflection",
  "daily_followup",
  "empathy_chat",
  "general",
]);

const MOOD_VARIANT_MOODS = new Set([
  "calm",
  "joyful",
  "anxious",
  "tired",
  "sad",
]);

type MoodVariantRow = {
  id: string;
  scenario: string;
  mood: string;
  prompt_suffix: string;
  tone: string | null;
  active: boolean;
  previous_snapshot: unknown;
  created_at: Date;
  updated_at: Date;
};

type UpsertPayload = {
  scenario: string;
  mood: string;
  prompt_suffix: string;
  tone: string | null;
  active: boolean;
};

type MoodVariantAuditInput = {
  adminUserId: string | null;
  actionType: "create" | "update" | "delete";
  entityId: string;
  reason: string;
  beforePayload: Prisma.InputJsonValue;
  afterPayload: Prisma.InputJsonValue;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function serializeRow(row: MoodVariantRow) {
  return {
    id: row.id,
    scenario: row.scenario,
    mood: row.mood,
    prompt_suffix: row.prompt_suffix,
    tone: row.tone,
    active: row.active,
    has_snapshot: row.previous_snapshot !== null,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

function parseUpsertPayload(raw: unknown): UpsertPayload {
  if (!raw || typeof raw !== "object") {
    throw new Error("invalid_payload");
  }
  const record = raw as Record<string, unknown>;

  const scenario = record.scenario;
  if (typeof scenario !== "string" || !MOOD_VARIANT_SCENARIOS.has(scenario)) {
    throw new Error("invalid_scenario");
  }

  const mood = record.mood;
  if (typeof mood !== "string" || !MOOD_VARIANT_MOODS.has(mood)) {
    throw new Error("invalid_mood");
  }

  const promptSuffixRaw = record.prompt_suffix;
  const promptSuffix =
    typeof promptSuffixRaw === "string" ? promptSuffixRaw.trim() : "";
  if (!promptSuffix) {
    throw new Error("prompt_suffix_required");
  }

  let tone: string | null = null;
  if (record.tone !== undefined && record.tone !== null) {
    if (typeof record.tone !== "string") {
      throw new Error("invalid_tone");
    }
    tone = record.tone.trim() || null;
  }

  return {
    scenario,
    mood,
    prompt_suffix: promptSuffix,
    tone,
    active: record.active === undefined ? true : Boolean(record.active),
  };
}

function parsePatchPayload(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") throw new Error("invalid_payload");
  const record = raw as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if ("prompt_suffix" in record) {
    const value = record.prompt_suffix;
    if (typeof value !== "string") throw new Error("invalid_prompt_suffix");
    const trimmed = value.trim();
    if (!trimmed) throw new Error("prompt_suffix_required");
    data.prompt_suffix = trimmed;
  }
  if ("tone" in record) {
    const value = record.tone;
    if (value === null || value === "") {
      data.tone = null;
    } else if (typeof value === "string") {
      data.tone = value.trim() || null;
    } else {
      throw new Error("invalid_tone");
    }
  }
  if ("active" in record) {
    data.active = Boolean(record.active);
  }

  if (Object.keys(data).length === 0) {
    throw new Error("no_fields_to_update");
  }
  return data;
}

function toJsonSafeSnapshot(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(toJsonSafeSnapshot);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        toJsonSafeSnapshot(nested),
      ]),
    );
  }
  return value;
}

async function resolveAdminDatabaseUserId(rawAdminUserId: string) {
  if (!UUID_PATTERN.test(rawAdminUserId)) {
    return null;
  }

  const user = await prisma.users.findUnique({
    where: { id: rawAdminUserId },
    select: { id: true },
  });

  return user?.id ?? null;
}

async function writeMoodVariantAuditLog(input: MoodVariantAuditInput) {
  if (!input.adminUserId) {
    console.warn(
      "Skipping mood variant audit log because admin user is not a DB user",
    );
    return;
  }

  try {
    await prisma.admin_audit_logs.create({
      data: {
        admin_user_id: input.adminUserId,
        action_type: input.actionType,
        entity_type: "mood-variants",
        entity_id: input.entityId,
        reason: input.reason,
        before_payload: input.beforePayload,
        after_payload: input.afterPayload,
      },
    });
  } catch (error) {
    console.warn("Failed to write mood variant audit log", error);
  }
}

async function saveMoodVariantSnapshotAndUpdate(input: {
  id: string;
  data: Record<string, unknown>;
  actorId: string | null;
}) {
  const current = (await prisma.content_mood_variants.findUnique({
    where: { id: input.id },
  })) as unknown as MoodVariantRow | null;

  if (!current) {
    return null;
  }

  const { previous_snapshot: _ignored, ...snapshot } =
    current as unknown as Record<string, unknown>;

  return (await prisma.content_mood_variants.update({
    where: { id: input.id },
    data: {
      ...input.data,
      previous_snapshot: toJsonSafeSnapshot(snapshot) as Prisma.InputJsonValue,
      updated_at: new Date(),
      updated_by: input.actorId,
    },
  })) as unknown as MoodVariantRow;
}

app.get("/engine/moods", async (c) => {
  const activeFilter = c.req.query("active");
  const where: Record<string, unknown> = {};
  if (activeFilter === "true") where.active = true;
  if (activeFilter === "false") where.active = false;

  const rows = (await prisma.content_mood_variants.findMany({
    where,
    orderBy: [{ scenario: "asc" }, { mood: "asc" }],
  })) as unknown as MoodVariantRow[];

  return c.json({ items: rows.map(serializeRow) });
});

app.post("/engine/moods", async (c) => {
  let payload: UpsertPayload;
  try {
    payload = parseUpsertPayload(await c.req.json());
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "invalid_payload" },
      400,
    );
  }

  const existing = await prisma.content_mood_variants.findUnique({
    where: {
      scenario_mood: {
        scenario: payload.scenario,
        mood: payload.mood,
      },
    },
  });
  if (existing) {
    return c.json({ error: "already_exists", id: existing.id }, 409);
  }

  const adminUserId = await resolveAdminDatabaseUserId(c.get("adminUserId"));
  const created = (await prisma.content_mood_variants.create({
    data: {
      ...payload,
      created_by: adminUserId,
      updated_by: adminUserId,
    },
  })) as unknown as MoodVariantRow;

  await writeMoodVariantAuditLog({
    adminUserId,
    actionType: "create",
    entityId: created.id,
    reason: "admin mood variant create",
    beforePayload: {},
    afterPayload: {
      scenario: created.scenario,
      mood: created.mood,
      prompt_suffix: created.prompt_suffix,
      tone: created.tone,
      active: created.active,
    },
  });

  return c.json({ item: serializeRow(created) }, 201);
});

app.patch("/engine/moods/:id", async (c) => {
  const id = c.req.param("id");
  if (!id) return c.json({ error: "id is required" }, 400);

  let data: Record<string, unknown>;
  try {
    data = parsePatchPayload(await c.req.json());
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "invalid_payload" },
      400,
    );
  }

  const before = (await prisma.content_mood_variants.findUnique({
    where: { id },
  })) as unknown as MoodVariantRow | null;
  if (!before) return c.json({ error: "not_found" }, 404);

  const adminUserId = await resolveAdminDatabaseUserId(c.get("adminUserId"));
  const updated = await saveMoodVariantSnapshotAndUpdate({
    id,
    data,
    actorId: adminUserId,
  });
  if (!updated) return c.json({ error: "not_found" }, 404);

  await writeMoodVariantAuditLog({
    adminUserId,
    actionType: "update",
    entityId: id,
    reason: "admin mood variant update",
    beforePayload: {
      scenario: before.scenario,
      mood: before.mood,
      prompt_suffix: before.prompt_suffix,
      tone: before.tone,
      active: before.active,
    },
    afterPayload: data as Prisma.InputJsonValue,
  });

  return c.json({ item: serializeRow(updated) });
});

app.delete("/engine/moods/:id", async (c) => {
  const id = c.req.param("id");
  if (!id) return c.json({ error: "id is required" }, 400);

  const before = (await prisma.content_mood_variants.findUnique({
    where: { id },
  })) as unknown as MoodVariantRow | null;
  if (!before) return c.json({ error: "not_found" }, 404);

  await prisma.content_mood_variants.delete({ where: { id } });

  await writeMoodVariantAuditLog({
    adminUserId: await resolveAdminDatabaseUserId(c.get("adminUserId")),
    actionType: "delete",
    entityId: id,
    reason: "admin mood variant delete",
    beforePayload: {
      scenario: before.scenario,
      mood: before.mood,
      prompt_suffix: before.prompt_suffix,
      tone: before.tone,
      active: before.active,
    },
    afterPayload: {},
  });

  return c.json({ ok: true });
});

export default app;
