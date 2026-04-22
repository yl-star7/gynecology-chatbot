import { NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";
import { proxyAdminApiRequest } from "@/lib/admin/api-server";

export async function GET(request: Request) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    return proxyAdminApiRequest(`content/questions${new URL(request.url).search}`, {
      admin,
      method: "GET",
    });
  } catch (error) {
    console.error("admin content questions GET proxy error", error);
    return NextResponse.json(
      { error: "failed to load questions" },
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

    return proxyAdminApiRequest("content/questions", { admin, request });
  } catch (error) {
    console.error("admin content questions POST proxy error", error);
    return NextResponse.json(
      { error: "failed to create question" },
      { status: 500 },
    );
  }
}
