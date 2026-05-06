import { Hono } from "hono";
import { prisma } from "@gynecology-chatbot/db/prisma";

import { resolveAdminDatabaseUserId } from "./audit.js";
import { requireAdminProxy, type AdminProxyVariables } from "./auth.js";

const app = new Hono<{ Variables: AdminProxyVariables }>();

app.use("*", requireAdminProxy);

function mapParaphrase(row: {
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
  items: unknown;
  status: string;
  is_active: boolean;
  updated_at: Date;
}) {
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
    items: Array.isArray(row.items) ? row.items : [],
    status: row.status,
    isActive: row.is_active,
    updatedAt: row.updated_at.toISOString(),
  };
}

app.get("/content/paraphrases", async (c) => {
  try {
    const weekNumber = Number(c.req.query("weekNumber"));
    if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 40) {
      return c.json({ error: "invalid weekNumber" }, 400);
    }
    const rows = await prisma.content_paraphrased_items.findMany({
      where: { source_week_number: weekNumber },
      orderBy: [
        { content_scope: "asc" },
        { category: "asc" },
        { source_day_number: "asc" },
        { source_code: "asc" },
      ],
    });
    return c.json({ paraphrases: rows.map(mapParaphrase) });
  } catch (error) {
    console.error("admin api paraphrases GET error", error);
    return c.json({ error: "failed to load paraphrases" }, 500);
  }
});

app.patch("/content/paraphrases", async (c) => {
  try {
    const body = (await c.req.json()) as {
      itemId?: unknown;
      action?: unknown;
      reviewNote?: unknown;
    };
    const itemId = typeof body.itemId === "string" ? body.itemId.trim() : "";
    const reviewNote =
      typeof body.reviewNote === "string" ? body.reviewNote.trim() : null;
    if (!itemId || body.action !== "activate") {
      return c.json({ error: "invalid payload" }, 400);
    }
    const current = await prisma.content_paraphrased_items.findUnique({
      where: { id: itemId },
    });
    if (!current) return c.json({ error: "paraphrase not found" }, 404);
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
        reviewed_by: await resolveAdminDatabaseUserId(c.get("adminUserId")),
        reviewed_at: new Date(),
        ...(reviewNote ? { review_note: reviewNote } : {}),
      },
    });
    return c.json({ paraphrase: mapParaphrase(updated) });
  } catch (error) {
    console.error("admin api paraphrases PATCH error", error);
    return c.json({ error: "failed to update paraphrase" }, 500);
  }
});

export default app;
