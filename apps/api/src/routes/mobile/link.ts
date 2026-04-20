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
  status: string;
};

app.get("/", async (c) => {
  try {
    await requireMobileSession(c);
    const target = c.req.query("target") ?? "";
    const entityId = c.req.query("entityId") ?? "";

    if (!target) {
      return c.json({ error: "target is required" }, 400);
    }

    const row = entityId
      ? await prisma.content_knowledge_items.findUnique({
          where: { id: entityId },
          select: {
            id: true,
            slug: true,
            section: true,
            title: true,
            body: true,
            status: true,
          },
        })
      : await prisma.content_knowledge_items.findFirst({
          where: {
            section: target,
            status: "published",
          },
          select: {
            id: true,
            slug: true,
            section: true,
            title: true,
            body: true,
            status: true,
          },
        });

    const content = row as KnowledgeRow | null;

    if (!content) {
      return c.json({ error: "link target not found" }, 404);
    }

    return c.json({
      content: {
        title: content.title,
        section: content.section,
        body: content.body,
      },
    });
  } catch (error) {
    console.error("mobile link route error", error);
    return mobileRouteErrorResponse(c, error, "failed to load link target");
  }
});

export default app;
