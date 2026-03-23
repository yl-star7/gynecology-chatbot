import { NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { createAdminServices } from "@/lib/admin/create-admin-services";
import type { AdminWorkflowRuleInput } from "@gynecology-chatbot/app-core";
import { revalidateAdminWorkflowCache } from "@/lib/admin/admin-cache";

function parseWorkflowRuleInput(body: unknown): AdminWorkflowRuleInput | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = body as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  const trigger =
    typeof record.trigger === "string" ? record.trigger.trim() : "";
  const retrievalScope =
    typeof record.retrievalScope === "string"
      ? record.retrievalScope.trim()
      : "";
  const modelName =
    typeof record.modelName === "string" ? record.modelName.trim() : "";
  const status = record.status;

  if (
    !name ||
    !trigger ||
    !retrievalScope ||
    !modelName ||
    (status !== "active" && status !== "review")
  ) {
    return null;
  }

  return {
    name,
    trigger,
    retrievalScope,
    modelName,
    status,
  };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ ruleId: string }> },
) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { ruleId } = await context.params;
    if (!ruleId) {
      return NextResponse.json({ error: "ruleId is required" }, { status: 400 });
    }

    const payload = parseWorkflowRuleInput(await request.json());
    if (!payload) {
      return NextResponse.json({ error: "invalid workflow payload" }, { status: 400 });
    }

    const services = createAdminServices();
    const workflowRule = await services.adminContentPort.updateWorkflowRule(
      ruleId,
      payload,
    );
    if (!workflowRule) {
      return NextResponse.json({ error: "workflow rule not found" }, { status: 404 });
    }

    revalidateAdminWorkflowCache();

    return NextResponse.json({ workflowRule });
  } catch (error) {
    console.error("admin workflow rule patch route error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "failed to update workflow rule",
      },
      { status: 400 },
    );
  }
}
