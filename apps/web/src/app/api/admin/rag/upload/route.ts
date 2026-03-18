import { NextRequest, NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { embedPregnancyDocument } from "@/lib/mobile/rag";
import { supabaseInsert } from "@/lib/mobile/supabase-rest";

export async function POST(request: NextRequest) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const category = typeof body.category === "string" ? body.category.trim() : "";
    const pregnancyWeek = typeof body.pregnancyWeek === "number" ? body.pregnancyWeek : null;

    if (!title || !content || !category) {
      return NextResponse.json({ error: "title, content, and category are required" }, { status: 400 });
    }

    const embedding = await embedPregnancyDocument(content);
    const inserted = await supabaseInsert<Array<{ id: string }>>("pregnancy_documents", {
      title,
      content,
      pregnancy_week: pregnancyWeek,
      category,
      embedding,
      metadata: {
        chunk_count: 1,
        source: "admin_upload",
      },
    });

    return NextResponse.json({ id: inserted[0]?.id ?? null, ok: true });
  } catch (error) {
    console.error("admin rag upload route error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed to upload rag document" }, { status: 400 });
  }
}
