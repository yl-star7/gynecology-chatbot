import { NextRequest, NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";
import { proxyAdminApiRequest } from "@/lib/admin/api-server";

export async function GET() {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    return proxyAdminApiRequest("schedule", { admin, method: "GET" });
  } catch (error) {
    console.error("admin schedule GET proxy error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "failed to load schedule",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    return proxyAdminApiRequest("schedule", { admin, request });
  } catch (error) {
    console.error("admin schedule PUT proxy error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "failed to save schedule",
      },
      { status: 500 },
    );
  }
}
