import { NextRequest, NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { getSchiftClient } from "@/lib/mobile/schift-client";

export async function POST(request: NextRequest) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const schift = getSchiftClient();
    if (!schift) return NextResponse.json({ error: "SCHIFT_API_KEY not configured" }, { status: 503 });

    const { bucketId, message } = await request.json();
    if (!bucketId || !message) {
      return NextResponse.json({ error: "bucketId and message required" }, { status: 400 });
    }

    const result = await schift.chat({ bucketId, message });
    return NextResponse.json(result);
  } catch (error) {
    console.error("admin schift chat route error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}
