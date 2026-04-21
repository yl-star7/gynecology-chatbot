import { NextRequest, NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";
import { proxyAdminApiRequest } from "@/lib/admin/api-server";

export async function POST(request: NextRequest) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    return proxyAdminApiRequest("users/reset-session", { admin, request });
  } catch (error) {
    console.error("admin reset session proxy error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "failed to reset session",
      },
      { status: 400 },
    );
  }
}
