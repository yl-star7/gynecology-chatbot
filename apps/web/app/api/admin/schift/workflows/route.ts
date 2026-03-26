import { NextRequest, NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { getSchiftClient } from "@/lib/mobile/schift-client";

/** GET /api/admin/schift/workflows — list all workflows */
export async function GET() {
  const admin = await readAdminSessionUser();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const schift = getSchiftClient();
  if (!schift) return NextResponse.json({ error: "SCHIFT_API_KEY not configured" }, { status: 503 });

  try {
    const workflows = await schift.workflows.list();
    return NextResponse.json(workflows);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}

/** POST /api/admin/schift/workflows — create a workflow */
export async function POST(request: NextRequest) {
  const admin = await readAdminSessionUser();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const schift = getSchiftClient();
  if (!schift) return NextResponse.json({ error: "SCHIFT_API_KEY not configured" }, { status: 503 });

  try {
    const body = await request.json();
    const workflow = await schift.workflows.create(body);
    return NextResponse.json(workflow);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}
