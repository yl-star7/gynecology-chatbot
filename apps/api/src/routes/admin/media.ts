import { randomUUID } from "crypto";
import { Hono } from "hono";
import { Storage } from "@google-cloud/storage";

import { requireAdminProxy, type AdminProxyVariables } from "./auth.js";

const app = new Hono<{ Variables: AdminProxyVariables }>();

app.use("*", requireAdminProxy);

function getStorageClient() {
  return new Storage({
    projectId:
      process.env.GCS_PROJECT_ID ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      undefined,
  });
}

async function ensureStorageBucketWithOptions(
  bucketId: string,
  options: { isPublic?: boolean } = {},
) {
  const bucket = getStorageClient().bucket(bucketId);
  const [exists] = await bucket.exists();

  if (!exists) {
    await bucket.create();
  }

  if (options.isPublic) {
    await bucket.makePublic({ includeFiles: false }).catch(() => undefined);
  }

  return bucket;
}

async function createSignedUploadUrl(input: {
  bucketId: string;
  objectPath: string;
  contentType: string;
}) {
  const bucket = await ensureStorageBucketWithOptions(input.bucketId, {
    isPublic: input.bucketId === "pregnancy-content",
  });
  const [signedUrl] = await bucket.file(input.objectPath).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000,
    contentType: input.contentType,
  });

  return signedUrl;
}

function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function guessContentType(fileName: string, fallback: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return fallback || "application/octet-stream";
}

function normalizeRequestedObjectPath(
  value: unknown,
  expectedFolder: string,
) {
  if (typeof value !== "string") {
    return null;
  }

  const objectPath = value.trim().replace(/^\/+/, "");
  if (!objectPath) {
    return null;
  }

  if (
    objectPath.includes("..") ||
    objectPath.includes("//") ||
    !/^[a-zA-Z0-9._/-]+$/.test(objectPath) ||
    !objectPath.startsWith(`${expectedFolder}/`)
  ) {
    throw new Error("invalid objectPath");
  }

  return objectPath;
}

function resolveUploadFolder(input: {
  mediaScope: string;
  weekNumber: number;
  dayNumber: number | null;
}) {
  if (input.mediaScope === "asset") {
    return "assets";
  }

  if (!input.weekNumber || Number.isNaN(input.weekNumber)) {
    return null;
  }

  if (input.mediaScope === "day" && input.dayNumber) {
    return `weeks/${String(input.weekNumber).padStart(2, "0")}/day-${String(input.dayNumber).padStart(2, "0")}`;
  }

  return `weeks/${String(input.weekNumber).padStart(2, "0")}`;
}

app.post("/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file");
    const bucketId = String(
      formData.get("bucketId") ?? "pregnancy-content",
    ).trim();
    const mediaScope = String(formData.get("mediaScope") ?? "week").trim();
    const weekNumber = Number(formData.get("weekNumber") ?? 0);
    const dayNumberRaw = String(formData.get("dayNumber") ?? "").trim();
    const dayNumber = dayNumberRaw ? Number(dayNumberRaw) : null;

    if (!(file instanceof File) || !file.size) {
      return c.json({ error: "file is required" }, 400);
    }

    if (!bucketId) {
      return c.json(
        { error: "bucketId is required" },
        400,
      );
    }

    const sourceFileName = sanitizeFileName(file.name || `${randomUUID()}.bin`);
    const folder = resolveUploadFolder({ mediaScope, weekNumber, dayNumber });
    if (!folder) {
      return c.json(
        { error: "valid weekNumber is required for week/day media" },
        400,
      );
    }

    let requestedObjectPath: string | null;
    try {
      requestedObjectPath = normalizeRequestedObjectPath(
        formData.get("objectPath"),
        folder,
      );
    } catch {
      return c.json({ error: "invalid objectPath" }, 400);
    }

    const objectPath =
      requestedObjectPath ?? `${folder}/${Date.now()}-${sourceFileName}`;
    const contentType = guessContentType(sourceFileName, file.type);
    const signedUrl = await createSignedUploadUrl({
      bucketId,
      objectPath,
      contentType,
    });

    return c.json({
      ok: true,
      bucketId,
      objectPath,
      sourceFileName,
      signedUrl,
      token: null,
      contentType,
    });
  } catch (error) {
    console.error("admin api content media upload error", error);
    return c.json(
      {
        error:
          error instanceof Error ? error.message : "failed to upload media",
      },
      500,
    );
  }
});

export default app;
