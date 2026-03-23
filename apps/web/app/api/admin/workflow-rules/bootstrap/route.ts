import { NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";
import { revalidateAdminWorkflowCache } from "@/lib/admin/admin-cache";
import { createDefaultInternalAnswerWorkflow } from "@/lib/mobile/schift-workflows-api";
import { mapSchiftWorkflowRule } from "@/lib/admin/adapters/schift-workflow";

export async function POST() {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const workflow = await createDefaultInternalAnswerWorkflow();
    revalidateAdminWorkflowCache();

    return NextResponse.json({
      workflowRule: mapSchiftWorkflowRule(workflow),
    });
  } catch (error) {
    console.error("admin workflow bootstrap route error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to bootstrap workflow",
      },
      { status: 500 },
    );
  }
}
