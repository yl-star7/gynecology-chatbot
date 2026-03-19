import { NextRequest, NextResponse } from "next/server";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";
import { supabaseSelect } from "@/lib/mobile/supabase-rest";

export async function GET(request: NextRequest) {
  try {
    await requireMobileSession(request);
    const target = request.nextUrl.searchParams.get("target");
    const entityId = request.nextUrl.searchParams.get("entityId");

    if (!target) {
      return NextResponse.json({ error: "target is required" }, { status: 400 });
    }

    const column = entityId ? `id=eq.${entityId}` : `section=eq.${target}&status=eq.published`;
    const items = await supabaseSelect<Array<{ title: string; section: string; body: string }>>(
      `content.knowledge_items?select=title,section,body&${column}&limit=1`,
    );

    if (!items[0]) {
      return NextResponse.json({ error: "link target not found" }, { status: 404 });
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
