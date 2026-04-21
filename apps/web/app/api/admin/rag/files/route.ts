import { NextRequest, NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";
import { proxyAdminApiRequest } from "@/lib/admin/api-server";

export async function GET() {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    return proxyAdminApiRequest("rag/files", { admin, method: "GET" });
  } catch (error) {
    console.error("admin rag files GET proxy error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "failed to list files",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    return proxyAdminApiRequest("rag/files", { admin, request });
  } catch (error) {
    console.error("admin rag files POST proxy error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "파일 업로드에 실패했습니다.",
      },
      { status: 500 },
    );
  }
}
