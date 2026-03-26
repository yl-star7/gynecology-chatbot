import { NextRequest, NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";
import { ensureStorageBucket } from "@/lib/admin/supabase-storage";

function parseStoragePath(value: string) {
  if (!value.startsWith("storage://")) {
    return null;
  }

  const normalized = value.replace("storage://", "");
  const slashIndex = normalized.indexOf("/");
  if (slashIndex === -1) {
    return null;
  }

  const bucketId = normalized.slice(0, slashIndex).trim();
  const objectPath = normalized.slice(slashIndex + 1).trim();

  if (!bucketId || !objectPath) {
    return null;
  }

  return { bucketId, objectPath };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const rawPath = request.nextUrl.searchParams.get("path")?.trim() ?? "";
    const parsed = parseStoragePath(rawPath);
    if (!parsed) {
      return NextResponse.json(
        { error: "invalid storage path" },
        { status: 400 },
      );
    }

    const client = await ensureStorageBucket(parsed.bucketId);
    const { data, error } = await client.storage
      .from(parsed.bucketId)
      .createSignedUrl(parsed.objectPath, 60 * 60);

    if (error || !data?.signedUrl) {
      throw error ?? new Error("signed URL generation failed");
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    console.error("admin content media preview error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "failed to preview media",
      },
      { status: 500 },
    );
  }
}
