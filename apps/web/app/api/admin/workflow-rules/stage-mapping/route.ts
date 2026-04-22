import { NextRequest, NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";
import { proxyAdminApiRequest } from "@/lib/admin/api-server";

export async function GET() {
  const admin = await readAdminSessionUser();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return proxyAdminApiRequest("workflow-rules/stage-mapping", {
    admin,
    method: "GET",
  });
}

export async function PUT(request: NextRequest) {
  const admin = await readAdminSessionUser();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return proxyAdminApiRequest("workflow-rules/stage-mapping", {
    admin,
    request,
  });
}
