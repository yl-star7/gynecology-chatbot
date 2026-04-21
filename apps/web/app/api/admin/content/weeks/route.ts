import { NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";
import { proxyAdminApiRequest } from "@/lib/admin/api-server";

export async function GET() {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    return proxyAdminApiRequest("content/weeks", { admin, method: "GET" });
  } catch (error) {
    console.error("admin content weeks GET proxy error", error);
    return NextResponse.json(
      { error: "failed to load weeks" },
      { status: 500 },
    );
  }
}
