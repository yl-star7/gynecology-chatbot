import { NextRequest, NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { getSchiftClient } from "@/lib/mobile/schift-client";

export async function GET() {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const schift = getSchiftClient();
    if (!schift) return NextResponse.json({ error: "SCHIFT_API_KEY not configured" }, { status: 503 });

    const collections = await schift.listCollections();
    return NextResponse.json({ collections });
  } catch (error) {
    console.error("admin schift route error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const schift = getSchiftClient();
    if (!schift) return NextResponse.json({ error: "SCHIFT_API_KEY not configured" }, { status: 503 });

    const body = await request.json();
    const { title, content, bucket = "pregnancy-knowledge" } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "title and content required" }, { status: 400 });
    }

    // Upload as a text file to the bucket
    const file = new File([content], `${title}.txt`, { type: "text/plain" });
    const result = await schift.db.upload(bucket, { files: [file] });

    return NextResponse.json({ ok: true, bucketId: result.bucket_id });
  } catch (error) {
    console.error("admin schift upload error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}
