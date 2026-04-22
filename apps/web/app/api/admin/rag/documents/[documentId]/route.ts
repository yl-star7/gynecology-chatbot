import { NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";
import { proxyAdminApiRequest } from "@/lib/admin/api-server";
import { revalidateAdminDocumentsCache } from "@/lib/admin/admin-cache";

async function proxyDocument(
  request: Request | null,
  params: Promise<{ documentId: string }>,
  method: string,
) {
  const admin = await readAdminSessionUser();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { documentId } = await params;
  if (!documentId) {
    return NextResponse.json({ error: "documentId is required" }, { status: 400 });
  }
  const response = await proxyAdminApiRequest(
    `rag/documents/${encodeURIComponent(documentId)}`,
    { admin, request, method },
  );
  if (response.ok && method !== "GET") revalidateAdminDocumentsCache();
  return response;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ documentId: string }> },
) {
  try {
    return proxyDocument(null, context.params, "GET");
  } catch (error) {
    console.error("admin rag document GET proxy error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "failed to load document" },
      { status: 400 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ documentId: string }> },
) {
  try {
    return proxyDocument(request, context.params, "PATCH");
  } catch (error) {
    console.error("admin rag document PATCH proxy error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "failed to update document" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ documentId: string }> },
) {
  try {
    return proxyDocument(null, context.params, "DELETE");
  } catch (error) {
    console.error("admin rag document DELETE proxy error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "failed to delete document" },
      { status: 400 },
    );
  }
}
