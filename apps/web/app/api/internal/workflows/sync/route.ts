import { NextRequest, NextResponse } from "next/server";

import { createDefaultInternalAnswerWorkflow } from "@/lib/mobile/schift-workflows-api";
import {
  loadMaternalNursingWorkflow,
  refreshWorkflowFromStorage,
} from "@/lib/mobile/workflows/load-workflow-yaml";

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  return Boolean(
    secret && request.headers.get("authorization") === `Bearer ${secret}`,
  );
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const workflowDefinition =
      (await refreshWorkflowFromStorage()) ?? loadMaternalNursingWorkflow();
    const workflow = await createDefaultInternalAnswerWorkflow(
      workflowDefinition,
    );
    const graph = workflow.graph as typeof workflow.graph & {
      nodes?: typeof workflow.graph.blocks;
    };

    return NextResponse.json({
      ok: true,
      workflowId: workflow.id,
      name: workflow.name,
      status: workflow.status,
      blockCount: (graph.nodes ?? graph.blocks ?? []).length,
      edgeCount: graph.edges?.length ?? 0,
    });
  } catch (error) {
    console.error("internal workflow sync error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "failed to sync workflow",
      },
      { status: 500 },
    );
  }
}
