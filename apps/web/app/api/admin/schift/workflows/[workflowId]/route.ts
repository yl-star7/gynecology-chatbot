import { NextRequest, NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { getSchiftClient } from "@/lib/mobile/schift-client";

type Ctx = { params: Promise<{ workflowId: string }> };

/** GET /api/admin/schift/workflows/:id — get workflow detail (with graph) */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const admin = await readAdminSessionUser();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const schift = getSchiftClient();
  if (!schift) return NextResponse.json({ error: "SCHIFT_API_KEY not configured" }, { status: 503 });

  try {
    const { workflowId } = await ctx.params;
    const workflow = await schift.workflows.get(workflowId);
    return NextResponse.json(workflow);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}

/** PATCH /api/admin/schift/workflows/:id — update workflow */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  const admin = await readAdminSessionUser();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const schift = getSchiftClient();
  if (!schift) return NextResponse.json({ error: "SCHIFT_API_KEY not configured" }, { status: 503 });

  try {
    const { workflowId } = await ctx.params;
    const body = await request.json();
    const workflow = await schift.workflows.update(workflowId, body);
    return NextResponse.json(workflow);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}

/** DELETE /api/admin/schift/workflows/:id — delete workflow */
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const admin = await readAdminSessionUser();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const schift = getSchiftClient();
  if (!schift) return NextResponse.json({ error: "SCHIFT_API_KEY not configured" }, { status: 503 });

  try {
    const { workflowId } = await ctx.params;
    await schift.workflows.delete(workflowId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}
