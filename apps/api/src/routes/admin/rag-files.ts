import { randomUUID } from "crypto";
import { Hono } from "hono";
import { Storage } from "@google-cloud/storage";
import { prisma } from "@gynecology-chatbot/db/prisma";
import { getSchiftClient } from "@gynecology-chatbot/mobile-api/schift-client";

import { requireAdminProxy, type AdminProxyVariables } from "./auth.js";

const app = new Hono<{ Variables: AdminProxyVariables }>();

const RAG_FILES_BUCKET = "rag-files";
const SCHIFT_BUCKET = "pregnancy-knowledge";
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

app.use("*", requireAdminProxy);

function getStorageClient() {
  return new Storage({
    projectId:
      process.env.GCS_PROJECT_ID ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      undefined,
  });
}

async function ensureStorageBucket(bucketId: string) {
  const bucket = getStorageClient().bucket(bucketId);
  const [exists] = await bucket.exists();
  if (!exists) {
    await bucket.create();
  }

  return bucket;
}

async function uploadBufferToStorage(input: {
  bucketId: string;
  objectPath: string;
  buffer: Buffer;
  contentType: string;
}) {
  const bucket = await ensureStorageBucket(input.bucketId);
  await bucket.file(input.objectPath).save(input.buffer, {
    resumable: false,
    contentType: input.contentType,
    validation: false,
  });
}

async function deleteStorageObject(input: {
  bucketId: string;
  objectPath: string;
}) {
  const bucket = await ensureStorageBucket(input.bucketId);
  await bucket.file(input.objectPath).delete({ ignoreNotFound: true });
}

function mapRagFileRow(row: {
  id: string;
  filename: string;
  storage_path: string;
  schift_bucket: string;
  file_size: number;
  mime_type: string;
  status: string;
  enabled: boolean;
  error_message: string | null;
  uploaded_by: string | null;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    ...row,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

const ragFileSelect = {
  id: true,
  filename: true,
  storage_path: true,
  schift_bucket: true,
  file_size: true,
  mime_type: true,
  status: true,
  enabled: true,
  error_message: true,
  uploaded_by: true,
  created_at: true,
  updated_at: true,
} as const;

app.get("/files", async (c) => {
  try {
    const rows = await prisma.content_rag_files.findMany({
      orderBy: { created_at: "desc" },
      select: ragFileSelect,
    });

    return c.json({ files: rows.map(mapRagFileRow) });
  } catch (error) {
    console.error("admin api rag files list error", error);
    return c.json(
      {
        error: error instanceof Error ? error.message : "failed to list files",
      },
      500,
    );
  }
});

app.post("/files", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || !file.size) {
      return c.json({ error: "file is required" }, 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return c.json({ error: "파일 크기는 20MB 이하만 가능합니다." }, 400);
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return c.json(
        { error: "PDF, DOCX, TXT 파일만 업로드할 수 있습니다." },
        400,
      );
    }

    const fileId = randomUUID();
    const ext = (file.name || "").split(".").pop()?.toLowerCase() || "bin";
    const storagePath = `rag/${fileId}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await uploadBufferToStorage({
      bucketId: RAG_FILES_BUCKET,
      objectPath: storagePath,
      buffer,
      contentType: file.type,
    });

    await prisma.content_rag_files.create({
      data: {
        id: fileId,
        filename: file.name,
        storage_path: storagePath,
        schift_bucket: SCHIFT_BUCKET,
        file_size: file.size,
        mime_type: file.type,
        status: "processing",
        enabled: true,
        uploaded_by: c.get("adminUserId"),
      },
    });

    try {
      const schift = getSchiftClient();
      if (!schift) {
        throw new Error("Schift 클라이언트가 설정되지 않았습니다.");
      }

      const safeSchiftName = `${fileId}.${ext}`;
      const schiftFile = new File([buffer], safeSchiftName, {
        type: file.type,
      });
      await schift.db.upload(SCHIFT_BUCKET, { files: [schiftFile] });

      await prisma.content_rag_files.update({
        where: { id: fileId },
        data: {
          status: "ready",
          updated_at: new Date(),
        },
      });
    } catch (schiftError) {
      const message =
        schiftError instanceof Error
          ? schiftError.message
          : "Schift ingest 실패";
      console.error("Schift ingest failed for", fileId, schiftError);

      await prisma.content_rag_files.update({
        where: { id: fileId },
        data: {
          status: "failed",
          error_message: message,
          updated_at: new Date(),
        },
      });
    }

    const row = await prisma.content_rag_files.findUnique({
      where: { id: fileId },
      select: ragFileSelect,
    });

    return c.json({
      file: row ? mapRagFileRow(row) : null,
      ok: true,
    });
  } catch (error) {
    console.error("admin api rag file upload error", error);
    return c.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "파일 업로드에 실패했습니다.",
      },
      500,
    );
  }
});

app.patch("/files/:fileId", async (c) => {
  try {
    const fileId = c.req.param("fileId");
    const body = (await c.req.json()) as { enabled?: boolean };
    if (typeof body.enabled !== "boolean") {
      return c.json({ error: "enabled (boolean) is required" }, 400);
    }

    await prisma.content_rag_files.update({
      where: { id: fileId },
      data: {
        enabled: body.enabled,
        updated_at: new Date(),
      },
    });

    return c.json({ ok: true });
  } catch (error) {
    console.error("admin api rag file patch error", error);
    return c.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "반영 상태 변경에 실패했습니다.",
      },
      500,
    );
  }
});

app.delete("/files/:fileId", async (c) => {
  try {
    const fileId = c.req.param("fileId");
    const file = await prisma.content_rag_files.findUnique({
      where: { id: fileId },
      select: ragFileSelect,
    });

    if (!file) {
      return c.json({ error: "파일을 찾을 수 없습니다." }, 404);
    }

    try {
      await deleteStorageObject({
        bucketId: RAG_FILES_BUCKET,
        objectPath: file.storage_path,
      });
    } catch (storageError) {
      console.warn("Storage 파일 삭제 실패 (무시):", storageError);
    }

    await prisma.content_rag_files.delete({ where: { id: fileId } });

    return c.json({ ok: true });
  } catch (error) {
    console.error("admin api rag file delete error", error);
    return c.json(
      {
        error:
          error instanceof Error ? error.message : "파일 삭제에 실패했습니다.",
      },
      500,
    );
  }
});

export default app;
