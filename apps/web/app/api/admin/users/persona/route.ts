import { NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";
import { proxyAdminApiRequest } from "@/lib/admin/api-server";

export async function GET(request: Request) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    return proxyAdminApiRequest(`users/persona${new URL(request.url).search}`, {
      admin,
      method: "GET",
    });
  } catch (error) {
    console.error("admin user persona GET proxy error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "failed to load persona data",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    return proxyAdminApiRequest("users/persona", { admin, request });
  } catch (error) {
    console.error("admin user persona POST proxy error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to create persona signal",
      },
      { status: 400 },
    );
  }
}
