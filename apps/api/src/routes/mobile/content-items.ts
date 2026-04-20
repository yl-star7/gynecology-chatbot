import { Hono } from "hono";
import { prisma } from "@gynecology-chatbot/db/prisma";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "../../lib/session-auth.js";

const app = new Hono();

type KnowledgeRow = {
  id: string;
  slug: string;
  section: "knowledge" | "notebook";
  title: string;
  body: string;
};

function isValidSection(
  value: string | null,
): value is "knowledge" | "notebook" {
  return value === "knowledge" || value === "notebook";
}

function buildPreview(body: string) {
  const normalized = body.replace(/\s+/g, " ").trim();
  return normalized.length > 120
    ? `${normalized.slice(0, 120)}...`
    : normalized;
}

app.get("/", async (c) => {
  try {
    await requireMobileSession(c);

    const section = c.req.query("section") ?? null;
    if (!isValidSection(section)) {
      return c.json({ error: "valid section is required" }, 400);
    }

    const rows = (await prisma.content_knowledge_items.findMany({
      where: {
        section,
        status: "published",
      },
      select: {
        id: true,
        slug: true,
        section: true,
        title: true,
        body: true,
      },
    })) as KnowledgeRow[];

    return c.json({
      items: rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        section: row.section,
        title: row.title,
        preview: buildPreview(row.body),
      })),
    });
  } catch (error) {
    console.error("mobile content items route error", error);
    return mobileRouteErrorResponse(c, error, "failed to load content items");
  }
});

export default app;
