import { NextRequest, NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { getSchiftClient } from "@/lib/mobile/schift-client";

export async function GET() {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const schift = getSchiftClient();
    if (!schift) return NextResponse.json({ error: "SCHIFT_API_KEY not configured" }, { status: 503 });

    const timeout = (ms: number) =>
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), ms),
      );

    const collections = await Promise.race([
      schift.listCollections(),
      timeout(8000),
    ]).catch(() => []);

    let workflows: unknown[] = [];
    try {
      const apiKey = process.env.SCHIFT_API_KEY;
      if (apiKey) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const wfRes = await fetch("https://api.schift.io/v1/workflows", {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (wfRes.ok) {
          const wfData = await wfRes.json();
          workflows = Array.isArray(wfData) ? wfData : wfData.workflows ?? [];
        }
      }
    } catch {
      // workflows fetch is best-effort
    }

    return NextResponse.json({ collections, workflows });
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
