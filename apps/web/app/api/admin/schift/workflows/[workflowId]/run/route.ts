import { NextRequest, NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { getSchiftClient } from "@/lib/mobile/schift-client";
import { runSchiftWorkflow } from "@/lib/mobile/schift-workflow";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ workflowId: string }> },
) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const schift = getSchiftClient();
    if (!schift) {
      return NextResponse.json(
        { error: "SCHIFT_API_KEY not configured" },
        { status: 503 },
      );
    }

    const { workflowId } = await context.params;
    const body = await request.json();
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    const extraInputs =
      body?.inputs && typeof body.inputs === "object"
        ? (body.inputs as Record<string, unknown>)
        : {};

    if (!workflowId || !query) {
      return NextResponse.json(
        { error: "workflowId and query required" },
        { status: 400 },
      );
    }

    const { run } = await runSchiftWorkflow({
      schift,
      workflowId,
      inputs: {
        query,
        ...extraInputs,
      },
    });

    return NextResponse.json({ ok: true, run });
  } catch (error) {
    console.error("admin schift workflow run route error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "failed" },
      { status: 500 },
    );
  }
}
