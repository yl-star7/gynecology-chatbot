import { NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";
import { proxyAdminApiRequest } from "@/lib/admin/api-server";

export async function GET(request: Request) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    return proxyAdminApiRequest(`content/checklists${new URL(request.url).search}`, {
      admin,
      method: "GET",
    });
  } catch (error) {
    console.error("admin content checklists GET proxy error", error);
    return NextResponse.json(
      { error: "failed to load checklists" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    return proxyAdminApiRequest("content/checklists", { admin, request });
  } catch (error) {
    console.error("admin content checklists POST proxy error", error);
    return NextResponse.json(
      { error: "failed to create checklist" },
      { status: 500 },
    );
  }
}
