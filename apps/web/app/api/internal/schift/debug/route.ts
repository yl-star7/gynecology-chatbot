import { NextRequest, NextResponse } from "next/server";

import { getSchiftClient } from "@/lib/mobile/schift-client";
import { resolveSchiftWorkflowId } from "@/lib/mobile/schift-workflow";

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  return Boolean(
    secret && request.headers.get("authorization") === `Bearer ${secret}`,
  );
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const schift = getSchiftClient();
    if (!schift) {
      return NextResponse.json(
        { error: "SCHIFT_API_KEY not configured" },
        { status: 503 },
      );
    }

    const workflowId = await resolveSchiftWorkflowId(schift);
    const [blockTypes, workflow, validation] = await Promise.all([
      schift.workflows.getBlockTypes().catch((error) => ({
        error: error instanceof Error ? error.message : String(error),
      })),
      workflowId ? schift.workflows.get(workflowId) : Promise.resolve(null),
      workflowId
        ? schift.workflows.validate(workflowId).catch((error) => ({
            error: error instanceof Error ? error.message : String(error),
          }))
        : Promise.resolve(null),
    ]);

    const probe = request.nextUrl.searchParams.get("probe") === "1";
    const answerBlockId = workflow
      ? ((workflow.graph as typeof workflow.graph & {
          nodes?: typeof workflow.graph.blocks;
        }).nodes ??
          workflow.graph.blocks ??
          []
        ).find(
          (block) =>
            block.type === "answer" &&
            ((block.title ?? "").includes("JSON 응답") ||
              (block.config as Record<string, unknown> | undefined)
                ?.include_sources),
        )?.id
      : null;

    const probeResults = probe && workflowId && answerBlockId
      ? await runOutputProbe(workflowId, answerBlockId)
      : null;

    return NextResponse.json({
      workflowId,
      blockTypes,
      workflow,
      validation,
      answerBlockId,
      probeResults,
    });
  } catch (error) {
    console.error("internal schift debug error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "failed" },
      { status: 500 },
    );
  }
}

async function runOutputProbe(workflowId: string, answerBlockId: string) {
  const apiKey = process.env.SCHIFT_API_KEY;
  if (!apiKey) return { error: "SCHIFT_API_KEY missing" };
  const inputs = {
    query: "오늘은 마음이 좀 불안해요.",
    currentWeek: 40,
    sessionId: "probe-session",
    hasImages: false,
  };
  const candidates = [
    { label: "inputs only", body: { inputs } },
    { label: "output block id", body: { inputs, output: answerBlockId } },
    { label: "output answer", body: { inputs, output: "answer" } },
    { label: "outputs block id array", body: { inputs, outputs: [answerBlockId] } },
    { label: "outputs answer array", body: { inputs, outputs: ["answer"] } },
    { label: "output_block_id", body: { inputs, output_block_id: answerBlockId } },
    { label: "output object id", body: { inputs, output: { block_id: answerBlockId } } },
  ];

  const results = [];
  for (const candidate of candidates) {
    const response = await fetch(
      `https://api.schift.io/v1/workflows/${workflowId}/run`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(candidate.body),
      },
    );
    const text = await response.text();
    results.push({
      label: candidate.label,
      status: response.status,
      ok: response.ok,
      text: text.slice(0, 10000),
    });
  }
  return results;
}
