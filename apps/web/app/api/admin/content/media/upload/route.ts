import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { ensureStorageBucket } from "@/lib/admin/supabase-storage";

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

export async function POST(request: Request) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const bucketId = String(formData.get("bucketId") ?? "pregnancy-content").trim();
    const mediaScope = String(formData.get("mediaScope") ?? "week").trim();
    const weekNumber = Number(formData.get("weekNumber") ?? 0);
    const dayNumberRaw = String(formData.get("dayNumber") ?? "").trim();
    const dayNumber = dayNumberRaw ? Number(dayNumberRaw) : null;

    if (!(file instanceof File) || !file.size) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (!bucketId || !weekNumber || Number.isNaN(weekNumber)) {
      return NextResponse.json(
        { error: "bucketId and valid weekNumber are required" },
        { status: 400 },
      );
    }

    const client = await ensureStorageBucket(bucketId);
    const sourceFileName = sanitizeFileName(file.name || `${randomUUID()}.bin`);
    const folder =
      mediaScope === "day" && dayNumber
        ? `weeks/${String(weekNumber).padStart(2, "0")}/day-${String(dayNumber).padStart(2, "0")}`
        : `weeks/${String(weekNumber).padStart(2, "0")}`;
    const objectPath = `${folder}/${Date.now()}-${sourceFileName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await client.storage.from(bucketId).upload(objectPath, buffer, {
      contentType: guessContentType(sourceFileName, file.type),
      upsert: true,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      ok: true,
      bucketId,
      objectPath,
      sourceFileName,
    });
  } catch (error) {
    console.error("admin content media upload error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "failed to upload media",
      },
      { status: 500 },
    );
  }
}
