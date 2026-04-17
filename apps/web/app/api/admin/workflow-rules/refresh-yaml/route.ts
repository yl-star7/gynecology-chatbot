import { NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";
import { refreshWorkflowFromStorage } from "@/lib/mobile/workflows/load-workflow-yaml";

export async function POST() {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const result = await refreshWorkflowFromStorage();
    if (!result) {
      return NextResponse.json(
        { error: "Supabase Storage에서 YAML을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      name: result.name,
      adminMetadata: result.adminMetadata,
      blockCount: result.graph.blocks.length,
      refreshedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("admin workflow refresh-yaml route error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to refresh workflow yaml",
      },
      { status: 500 },
    );
  }
}
