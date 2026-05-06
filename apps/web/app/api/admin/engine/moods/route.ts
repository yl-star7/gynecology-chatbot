import { NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";
import { proxyAdminApiRequest } from "@/lib/admin/api-server";

export async function GET(request: Request) {
  const admin = await readAdminSessionUser();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const search = new URL(request.url).search;
  return proxyAdminApiRequest(`engine/moods${search}`, {
    admin,
    method: "GET",
  });
}

export async function POST(request: Request) {
  const admin = await readAdminSessionUser();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return proxyAdminApiRequest("engine/moods", {
    admin,
    request,
    method: "POST",
  });
}
