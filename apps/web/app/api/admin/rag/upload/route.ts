import { NextRequest, NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";
import { proxyAdminApiRequest } from "@/lib/admin/api-server";
import { revalidateAdminDocumentsCache } from "@/lib/admin/admin-cache";

export async function POST(request: NextRequest) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const response = await proxyAdminApiRequest("rag/upload", { admin, request });
    if (response.ok) revalidateAdminDocumentsCache();
    return response;
  } catch (error) {
    console.error("admin rag upload POST proxy error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "failed to upload rag document",
      },
      { status: 400 },
    );
  }
}
