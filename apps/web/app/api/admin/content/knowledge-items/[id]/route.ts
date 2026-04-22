import { NextRequest, NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";
import { proxyAdminApiRequest } from "@/lib/admin/api-server";
import { revalidateAdminKnowledgeCache } from "@/lib/admin/admin-cache";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    const response = await proxyAdminApiRequest(
      `content/knowledge-items/${encodeURIComponent(id)}`,
      { admin, request, method: "PATCH" },
    );
    if (response.ok) revalidateAdminKnowledgeCache();
    return response;
  } catch (error) {
    console.error("admin knowledge items PATCH proxy error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to update knowledge item",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    const response = await proxyAdminApiRequest(
      `content/knowledge-items/${encodeURIComponent(id)}`,
      { admin, method: "DELETE" },
    );
    if (response.ok) revalidateAdminKnowledgeCache();
    return response;
  } catch (error) {
    console.error("admin knowledge items DELETE proxy error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to delete knowledge item",
      },
      { status: 400 },
    );
  }
}
