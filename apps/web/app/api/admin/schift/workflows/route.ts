import { NextRequest, NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { listSchiftWorkflows } from "@/lib/mobile/schift-workflows-api";
import { getSchiftClient } from "@/lib/mobile/schift-client";

/** GET /api/admin/schift/workflows — list all workflows */
export async function GET() {
  const admin = await readAdminSessionUser();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const workflows = await listSchiftWorkflows();
    const plain = JSON.parse(JSON.stringify(workflows)) as Record<string, unknown>[];
    const normalized = plain.map((wf) => {
      const graph = wf.graph as Record<string, unknown> | undefined;
      if (!graph) return wf;
      const nodes = (graph.nodes ?? graph.blocks ?? []) as unknown[];
      return { ...wf, graph: { ...graph, blocks: nodes, nodes } };
    });
    return NextResponse.json(normalized);
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
    return NextResponse.json(JSON.parse(JSON.stringify(workflow)));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}
