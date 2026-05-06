import type { Workflow } from "@schift-io/sdk";
import { NextRequest, NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { getSchiftClient } from "@/lib/mobile/schift-client";
import { listSchiftWorkflows } from "@/lib/mobile/schift-workflows-api";
import {
  loadMaternalNursingWorkflow,
  refreshWorkflowFromStorage,
} from "@/lib/mobile/workflows/load-workflow-yaml";

function normalizeWorkflow(workflow: Record<string, unknown>) {
  const graph = workflow.graph as Record<string, unknown> | undefined;
  if (!graph) return workflow;
  const nodes = (graph.nodes ?? graph.blocks ?? []) as unknown[];
  return { ...workflow, graph: { ...graph, blocks: nodes, nodes } };
}

async function buildFallbackWorkflow(): Promise<Workflow> {
  const workflow =
    (await refreshWorkflowFromStorage()) ?? loadMaternalNursingWorkflow();
  const now = new Date().toISOString();
  const fallback: Workflow = {
    id: "maternal-nursing-current",
    name: workflow.name,
    description: workflow.description,
    status: "active",
    graph: workflow.graph,
    created_at: now,
    updated_at: now,
  };

  return normalizeWorkflow(
    fallback as unknown as Record<string, unknown>,
  ) as unknown as Workflow;
}

/** GET /api/admin/schift/workflows — list all workflows */
export async function GET() {
  const admin = await readAdminSessionUser();
  if (!admin)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const workflows = await listSchiftWorkflows();
    const plain = JSON.parse(JSON.stringify(workflows)) as Record<
      string,
      unknown
    >[];
    return NextResponse.json(plain.map(normalizeWorkflow));
  } catch (error) {
    console.error("admin schift workflows unavailable", error);
    return NextResponse.json([await buildFallbackWorkflow()]);
  }
}

/** POST /api/admin/schift/workflows — create a workflow */
export async function POST(request: NextRequest) {
  const admin = await readAdminSessionUser();
  if (!admin)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const schift = getSchiftClient();
  if (!schift)
    return NextResponse.json(
      { error: "SCHIFT_API_KEY not configured" },
      { status: 503 },
    );

  try {
    const body = await request.json();
    const workflow = await schift.workflows.create(body);
    return NextResponse.json(JSON.parse(JSON.stringify(workflow)));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "failed" },
      { status: 500 },
    );
  }
}
