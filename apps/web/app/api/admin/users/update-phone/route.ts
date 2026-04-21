import { NextRequest, NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";
import { proxyAdminApiRequest } from "@/lib/admin/api-server";

export async function POST(request: NextRequest) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    return proxyAdminApiRequest("users/update-phone", { admin, request });
  } catch (error) {
    console.error("admin update phone proxy error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "failed to update phone number",
      },
      { status: 400 },
    );
  }
}
