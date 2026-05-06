import { randomUUID } from "crypto";
import { Hono } from "hono";
import type { Prisma } from "@gynecology-chatbot/db/prisma";
import { prisma } from "@gynecology-chatbot/db/prisma";
import type {
  AdminKnowledgeItem,
  AdminRagDocumentDetail,
} from "@gynecology-chatbot/app-core";

import { createAdminAuditLog } from "./audit.js";
import { requireAdminProxy, type AdminProxyVariables } from "./auth.js";

const app = new Hono<{ Variables: AdminProxyVariables }>();

app.use("*", requireAdminProxy);

type RagDocumentMetadata = {
  chunk_count?: number;
  draft?: boolean;
  fileId?: unknown;
  sourceFileId?: unknown;
  source_file_id?: unknown;
  filename?: unknown;
  file_name?: unknown;
  sourceFilename?: unknown;
  source_filename?: unknown;
  source?: unknown;
};

function getMetadataString(
  metadata: RagDocumentMetadata | null | undefined,
  keys: Array<keyof RagDocumentMetadata>,
) {
  for (const key of keys) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function extractSourceFileId(metadata: RagDocumentMetadata | null | undefined) {
  const explicit = getMetadataString(metadata, [
    "fileId",
    "sourceFileId",
    "source_file_id",
  ]);
  if (explicit) return explicit;

  const sourceName = getMetadataString(metadata, [
    "filename",
    "file_name",
    "sourceFilename",
    "source_filename",
    "source",
  ]);
  const uuidPrefix = sourceName?.match(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
  );
  return uuidPrefix?.[0] ?? null;
}

function extractSourceFilename(
  metadata: RagDocumentMetadata | null | undefined,
) {
  return getMetadataString(metadata, [
    "filename",
    "file_name",
    "sourceFilename",
    "source_filename",
    "source",
  ]);
}

function mapKnowledgeItem(row: {
  id: string;
  slug: string;
  section: string;
  title: string;
  body: string;
  image_url: string | null;
  status: string;
  updated_at: Date;
}): AdminKnowledgeItem {
  return {
    id: row.id,
    slug: row.slug,
    section: row.section as AdminKnowledgeItem["section"],
    title: row.title,
    body: row.body,
    imageUrl: row.image_url,
    status: row.status as AdminKnowledgeItem["status"],
    updatedAt: row.updated_at.toISOString(),
  };
}

function mapDocument(row: {
  id: string;
  title: string | null;
  content: string;
  pregnancy_week: number | null;
  category: string;
  image_url: string | null;
  metadata: Prisma.JsonValue;
  created_at: Date;
  updated_at: Date;
}): AdminRagDocumentDetail {
  const metadata =
    row.metadata &&
    typeof row.metadata === "object" &&
    !Array.isArray(row.metadata)
      ? (row.metadata as RagDocumentMetadata)
      : null;
  const status =
    metadata?.draft || metadata?.chunk_count === 0 ? "draft" : "ready";

  return {
    id: row.id,
    title: row.title ?? "제목 없음",
    pregnancyWeekLabel: row.pregnancy_week
      ? `${row.pregnancy_week}주차`
      : "공통",
    pregnancyWeek: row.pregnancy_week,
    category: row.category,
    chunkCount: metadata?.chunk_count ?? 1,
    updatedAt: (row.updated_at ?? row.created_at).toISOString(),
    status,
    sourceFileId: extractSourceFileId(metadata),
    sourceFilename: extractSourceFilename(metadata),
    content: row.content,
    imageUrl: row.image_url,
  };
}

app.get("/content/knowledge-items", async (c) => {
  const rows = await prisma.content_knowledge_items.findMany({
    orderBy: [{ updated_at: "desc" }, { title: "asc" }],
  });
  return c.json({ knowledgeItems: rows.map(mapKnowledgeItem) });
});

app.post("/content/knowledge-items", async (c) => {
  try {
    const body = (await c.req.json()) as Record<string, unknown>;
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    const section = body.section;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const bodyText = typeof body.body === "string" ? body.body.trim() : "";
    const status = body.status;
    const imageUrl =
      typeof body.imageUrl === "string" && body.imageUrl.trim()
        ? body.imageUrl.trim()
        : null;
    if (
      !slug ||
      !title ||
      !bodyText ||
      (section !== "knowledge" && section !== "notebook") ||
      (status !== "draft" && status !== "published" && status !== "archived")
    ) {
      return c.json({ error: "invalid knowledge item payload" }, 400);
    }

    const row = await prisma.content_knowledge_items.create({
      data: {
        slug,
        section,
        title,
        body: bodyText,
        image_url: imageUrl,
        status,
        published_at: status === "published" ? new Date() : null,
        updated_at: new Date(),
      },
    });
    const knowledgeItem = mapKnowledgeItem(row);
    await createAdminAuditLog({
      adminUserId: c.get("adminUserId"),
      targetUserId: null,
      actionType: "content_update",
      entityType: "knowledge_item",
      entityId: knowledgeItem.id,
      reason: "knowledge_item_create",
      beforePayload: {},
      afterPayload: { slug, section, title, status },
    });
    return c.json({ knowledgeItem });
  } catch (error) {
    console.error("admin api knowledge create error", error);
    return c.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to create knowledge item",
      },
      400,
    );
  }
});

app.patch("/content/knowledge-items/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = (await c.req.json()) as Record<string, unknown>;
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    const section = body.section;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const bodyText = typeof body.body === "string" ? body.body.trim() : "";
    const status = body.status;
    const imageUrl =
      typeof body.imageUrl === "string" && body.imageUrl.trim()
        ? body.imageUrl.trim()
        : null;
    if (
      !id ||
      !slug ||
      !title ||
      !bodyText ||
      (section !== "knowledge" && section !== "notebook") ||
      (status !== "draft" && status !== "published" && status !== "archived")
    ) {
      return c.json({ error: "invalid knowledge item payload" }, 400);
    }
    const before = await prisma.content_knowledge_items.findUnique({
      where: { id },
    });
    const row = await prisma.content_knowledge_items.update({
      where: { id },
      data: {
        slug,
        section,
        title,
        body: bodyText,
        image_url: imageUrl,
        status,
        published_at:
          status === "published"
            ? before?.status === "published"
              ? undefined
              : new Date()
            : null,
        updated_at: new Date(),
      },
    });
    const knowledgeItem = mapKnowledgeItem(row);
    await createAdminAuditLog({
      adminUserId: c.get("adminUserId"),
      targetUserId: null,
      actionType: "content_update",
      entityType: "knowledge_item",
      entityId: knowledgeItem.id,
      reason: "knowledge_item_update",
      beforePayload: before
        ? {
            slug: before.slug,
            section: before.section,
            title: before.title,
            status: before.status,
          }
        : {},
      afterPayload: { slug, section, title, status },
    });
    return c.json({ knowledgeItem });
  } catch (error) {
    console.error("admin api knowledge update error", error);
    return c.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to update knowledge item",
      },
      400,
    );
  }
});

app.delete("/content/knowledge-items/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const before = await prisma.content_knowledge_items.findUnique({
      where: { id },
    });
    await prisma.content_knowledge_items.delete({ where: { id } });
    await createAdminAuditLog({
      adminUserId: c.get("adminUserId"),
      targetUserId: null,
      actionType: "content_update",
      entityType: "knowledge_item",
      entityId: id,
      reason: "knowledge_item_delete",
      beforePayload: before
        ? {
            slug: before.slug,
            section: before.section,
            title: before.title,
            status: before.status,
          }
        : {},
      afterPayload: {},
    });
    return c.json({ ok: true });
  } catch (error) {
    console.error("admin api knowledge delete error", error);
    return c.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to delete knowledge item",
      },
      400,
    );
  }
});

app.get("/rag/documents/:documentId", async (c) => {
  const documentId = c.req.param("documentId");
  const row = await prisma.content_pregnancy_documents.findUnique({
    where: { id: documentId },
  });
  if (!row) return c.json({ error: "document not found" }, 404);
  return c.json({ document: mapDocument(row) });
});

app.patch("/rag/documents/:documentId", async (c) => {
  try {
    const documentId = c.req.param("documentId");
    const body = (await c.req.json()) as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const category =
      typeof body.category === "string" ? body.category.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const pregnancyWeek =
      typeof body.pregnancyWeek === "number" ? body.pregnancyWeek : null;
    const imageUrl =
      typeof body.imageUrl === "string" && body.imageUrl.trim()
        ? body.imageUrl.trim()
        : null;
    if (!title || !category || !content)
      return c.json({ error: "invalid document payload" }, 400);
    const row = await prisma.content_pregnancy_documents.update({
      where: { id: documentId },
      data: {
        title,
        category,
        content,
        pregnancy_week: pregnancyWeek,
        image_url: imageUrl,
        updated_at: new Date(),
      },
    });
    return c.json({ document: mapDocument(row) });
  } catch (error) {
    console.error("admin api rag document update error", error);
    return c.json(
      {
        error:
          error instanceof Error ? error.message : "failed to update document",
      },
      400,
    );
  }
});

app.delete("/rag/documents/:documentId", async (c) => {
  try {
    const documentId = c.req.param("documentId");
    await prisma.content_pregnancy_documents.delete({
      where: { id: documentId },
    });
    return c.json({ ok: true });
  } catch (error) {
    console.error("admin api rag document delete error", error);
    return c.json(
      {
        error:
          error instanceof Error ? error.message : "failed to delete document",
      },
      400,
    );
  }
});

app.post("/rag/upload", async (c) => {
  try {
    const body = (await c.req.json()) as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const category =
      typeof body.category === "string" ? body.category.trim() : "";
    const pregnancyWeek =
      typeof body.pregnancyWeek === "number" ? body.pregnancyWeek : null;
    const imageUrl =
      typeof body.imageUrl === "string" && body.imageUrl.trim()
        ? body.imageUrl.trim()
        : null;
    if (!title || !content || !category) {
      return c.json(
        { error: "title, content, and category are required" },
        400,
      );
    }
    const row = await prisma.content_pregnancy_documents.create({
      data: {
        id: randomUUID(),
        title,
        content,
        category,
        pregnancy_week: pregnancyWeek,
        image_url: imageUrl,
        metadata: { chunk_count: 0, draft: true, source: "admin_upload" },
      },
    });
    return c.json({ id: row.id, ok: true });
  } catch (error) {
    console.error("admin api rag upload error", error);
    return c.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to upload rag document",
      },
      400,
    );
  }
});

export default app;
