import { NextRequest, NextResponse } from "next/server";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";
import { supabaseSelect } from "@/lib/mobile/supabase-rest";

type ContentItemRow = {
  id: string;
  slug: string;
  section: "knowledge" | "notebook";
  title: string;
  body: string;
};

function isValidSection(value: string | null): value is "knowledge" | "notebook" {
  return value === "knowledge" || value === "notebook";
}

function buildPreview(body: string) {
  const normalized = body.replace(/\s+/g, " ").trim();
  return normalized.length > 120 ? `${normalized.slice(0, 120)}...` : normalized;
}

export async function GET(request: NextRequest) {
  try {
    await requireMobileSession(request);

    const section = request.nextUrl.searchParams.get("section");
    if (!isValidSection(section)) {
      return NextResponse.json({ error: "valid section is required" }, { status: 400 });
    }

    const rows = await supabaseSelect<ContentItemRow[]>(
      `content.knowledge_items?select=id,slug,section,title,body&section=eq.${section}&status=eq.published&order=updated_at.desc`,
    );

    return NextResponse.json({
      items: rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        section: row.section,
        title: row.title,
        preview: buildPreview(row.body),
      })),
    });
  } catch (error) {
    console.error("mobile content items route error", error);
    return mobileRouteErrorResponse(error, "failed to load content items");
  }
}
