import { NextRequest, NextResponse } from "next/server";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";
import { loadCachedAdminKnowledgeItems } from "@/lib/admin/admin-cache";

export async function GET(request: NextRequest) {
  try {
    await requireMobileSession(request);
    const target = request.nextUrl.searchParams.get("target");
    const entityId = request.nextUrl.searchParams.get("entityId");

    if (!target) {
      return NextResponse.json(
        { error: "target is required" },
        { status: 400 },
      );
    }

    const items = (await loadCachedAdminKnowledgeItems()).filter((item) => {
      if (entityId) {
        return item.id === entityId;
      }

      return item.section === target && item.status === "published";
    });

    if (!items[0]) {
      return NextResponse.json(
        { error: "link target not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      content: {
        title: items[0].title,
        section: items[0].section,
        body: items[0].body,
      },
    });
  } catch (error) {
    console.error("mobile link route error", error);
    return mobileRouteErrorResponse(error, "failed to load link target");
  }
}
