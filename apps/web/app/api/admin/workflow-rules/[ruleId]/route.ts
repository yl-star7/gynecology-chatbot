import { NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";
import { proxyAdminApiRequest } from "@/lib/admin/api-server";
import { revalidateAdminWorkflowCache } from "@/lib/admin/admin-cache";

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
    const response = await proxyAdminApiRequest(
      `workflow-rules/${encodeURIComponent(ruleId)}`,
      { admin, request, method: "PATCH" },
    );
    if (response.ok) revalidateAdminWorkflowCache();
    return response;
  } catch (error) {
    console.error("admin workflow rule PATCH proxy error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to update workflow rule",
      },
      { status: 400 },
    );
  }
}
