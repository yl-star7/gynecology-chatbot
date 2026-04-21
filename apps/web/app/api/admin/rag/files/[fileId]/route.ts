import { NextRequest, NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";
import { proxyAdminApiRequest } from "@/lib/admin/api-server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { fileId } = await params;
    return proxyAdminApiRequest(`rag/files/${encodeURIComponent(fileId)}`, {
      admin,
      method: "DELETE",
    });
  } catch (error) {
    console.error("admin rag file DELETE proxy error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "파일 삭제에 실패했습니다.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { fileId } = await params;
    return proxyAdminApiRequest(`rag/files/${encodeURIComponent(fileId)}`, {
      admin,
      request,
    });
  } catch (error) {
    console.error("admin rag file PATCH proxy error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "반영 상태 변경에 실패했습니다.",
      },
      { status: 500 },
    );
  }
}
