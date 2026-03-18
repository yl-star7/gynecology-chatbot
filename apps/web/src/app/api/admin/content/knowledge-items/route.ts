import { NextRequest, NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { createAdminServices } from "@/lib/admin/create-admin-services";
import type { AdminKnowledgeItemInput } from "@gynecology-chatbot/app-core";

function parseKnowledgeItemInput(body: unknown): AdminKnowledgeItemInput | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = body as Record<string, unknown>;
  const slug = typeof record.slug === "string" ? record.slug.trim() : "";
  const section = record.section;
  const title = typeof record.title === "string" ? record.title.trim() : "";
  const bodyText = typeof record.body === "string" ? record.body.trim() : "";
  const status = record.status;

  if (
    !slug ||
    !title ||
    !bodyText ||
    (section !== "knowledge" && section !== "notebook") ||
    (status !== "draft" && status !== "published" && status !== "archived")
  ) {
    return null;
  }

  return {
    slug,
    section,
    title,
    body: bodyText,
    status,
  };
}

export async function GET() {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const services = createAdminServices();
    const knowledgeItems = await services.adminContentPort.listKnowledgeItems();
    return NextResponse.json({ knowledgeItems });
  } catch (error) {
    console.error("admin knowledge items get route error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "failed to load knowledge items",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const payload = parseKnowledgeItemInput(await request.json());
    if (!payload) {
      return NextResponse.json(
        { error: "invalid knowledge item payload" },
        { status: 400 },
      );
    }

    const services = createAdminServices();
    const knowledgeItem = await services.adminContentPort.createKnowledgeItem(
      payload,
    );
    return NextResponse.json({ knowledgeItem });
  } catch (error) {
    console.error("admin knowledge items post route error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "failed to create knowledge item",
      },
      { status: 400 },
    );
  }
}
