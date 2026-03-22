import { NextResponse } from "next/server";
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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const payload = parseKnowledgeItemInput(await request.json());
    if (!payload) {
      return NextResponse.json(
        { error: "invalid knowledge item payload" },
        { status: 400 },
      );
    }

    const services = createAdminServices();
    const knowledgeItem = await services.adminContentPort.updateKnowledgeItem(
      id,
      payload,
    );
    if (!knowledgeItem) {
      return NextResponse.json(
        { error: "knowledge item not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ knowledgeItem });
  } catch (error) {
    console.error("admin knowledge items patch route error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "failed to update knowledge item",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const services = createAdminServices();
    await services.adminContentPort.deleteKnowledgeItem(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin knowledge items delete route error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "failed to delete knowledge item",
      },
      { status: 400 },
    );
  }
}
