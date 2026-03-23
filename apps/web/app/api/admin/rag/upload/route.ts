import { NextRequest, NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { createAdminServices } from "@/lib/admin/create-admin-services";
import { revalidateAdminDocumentsCache } from "@/lib/admin/admin-cache";

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

    const services = createAdminServices();
    const document = await services.adminContentPort.createDocument({
      title,
      content,
      pregnancyWeek,
      category,
    });

    revalidateAdminDocumentsCache();

    return NextResponse.json({ id: document.id, ok: true });
  } catch (error) {
    console.error("admin rag upload route error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed to upload rag document" }, { status: 400 });
  }
}
