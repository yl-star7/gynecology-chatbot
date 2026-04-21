import { Hono } from "hono";
import { prisma } from "@gynecology-chatbot/db/prisma";
import {
  buildKnowledgeLinkContent,
  buildPregnancyDocumentLinkContent,
  isUuidEntityId,
} from "@gynecology-chatbot/mobile-api/link-target";
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

type PregnancyDocumentRow = {
  id: string;
  title: string | null;
  content: string;
  category: string;
  pregnancy_week: number | null;
};

const knowledgeSelect = {
  id: true,
  slug: true,
  section: true,
  title: true,
  body: true,
  status: true,
} as const;

const pregnancyDocumentSelect = {
  id: true,
  title: true,
  content: true,
  category: true,
  pregnancy_week: true,
} as const;

async function findKnowledgeContent(target: string, entityId: string) {
  if (entityId) {
    if (!isUuidEntityId(entityId)) {
      return null;
    }

    return (await prisma.content_knowledge_items.findUnique({
      where: { id: entityId.trim() },
      select: knowledgeSelect,
    })) as KnowledgeRow | null;
  }

  return (await prisma.content_knowledge_items.findFirst({
    where: {
      section: target,
      status: "published",
    },
    select: knowledgeSelect,
  })) as KnowledgeRow | null;
}

async function findPregnancyDocumentContent(entityId: string) {
  const trimmedEntityId = entityId.trim();
  if (!isUuidEntityId(trimmedEntityId)) {
    return null;
  }

  return (await prisma.content_pregnancy_documents.findUnique({
    where: { id: trimmedEntityId },
    select: pregnancyDocumentSelect,
  })) as PregnancyDocumentRow | null;
}

app.get("/", async (c) => {
  try {
    await requireMobileSession(c);
    const target = c.req.query("target") ?? "";
    const entityId = c.req.query("entityId")?.trim() ?? "";

    if (!target) {
      return c.json({ error: "target is required" }, 400);
    }

    const knowledgeContent = await findKnowledgeContent(target, entityId);
    const linkedDocument =
      !knowledgeContent && target === "knowledge"
        ? await findPregnancyDocumentContent(entityId)
        : null;
    const content = knowledgeContent
      ? buildKnowledgeLinkContent(knowledgeContent)
      : linkedDocument
        ? buildPregnancyDocumentLinkContent(linkedDocument)
        : null;

    if (!content) {
      return c.json({ error: "link target not found" }, 404);
    }

    return c.json({
      content,
    });
  } catch (error) {
    console.error("mobile link route error", error);
    return mobileRouteErrorResponse(c, error, "failed to load link target");
  }
});

export default app;
