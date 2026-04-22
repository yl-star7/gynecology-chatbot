import { NextRequest, NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";
import { proxyAdminApiRequest } from "@/lib/admin/api-server";
import { revalidateAdminKnowledgeCache } from "@/lib/admin/admin-cache";

export async function GET() {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    return proxyAdminApiRequest("content/knowledge-items", {
      admin,
      method: "GET",
    });
  } catch (error) {
    console.error("admin knowledge items GET proxy error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to load knowledge items",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const response = await proxyAdminApiRequest("content/knowledge-items", {
      admin,
      request,
    });
    if (response.ok) revalidateAdminKnowledgeCache();
    return response;
  } catch (error) {
    console.error("admin knowledge items POST proxy error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to create knowledge item",
      },
      { status: 400 },
    );
  }
}
