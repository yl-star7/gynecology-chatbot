import { NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { createAdminServices } from "@/lib/admin/create-admin-services";
import type { AdminRagDocumentInput } from "@gynecology-chatbot/app-core";

function parseDocumentInput(body: unknown): AdminRagDocumentInput | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = body as Record<string, unknown>;
  const title = typeof record.title === "string" ? record.title.trim() : "";
  const category =
    typeof record.category === "string" ? record.category.trim() : "";
  const content =
    typeof record.content === "string" ? record.content.trim() : "";
  const pregnancyWeek =
    typeof record.pregnancyWeek === "number" ? record.pregnancyWeek : null;

  if (!title || !category || !content) {
    return null;
  }

  return {
    title,
    category,
    content,
    pregnancyWeek,
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ documentId: string }> },
) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { documentId } = await context.params;
    if (!documentId) {
      return NextResponse.json({ error: "documentId is required" }, { status: 400 });
    }

    const services = createAdminServices();
    const document = await services.adminContentPort.getDocument(documentId);
    if (!document) {
      return NextResponse.json({ error: "document not found" }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("admin rag document get route error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "failed to load document" },
      { status: 400 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ documentId: string }> },
) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { documentId } = await context.params;
    if (!documentId) {
      return NextResponse.json({ error: "documentId is required" }, { status: 400 });
    }

    const payload = parseDocumentInput(await request.json());
    if (!payload) {
      return NextResponse.json({ error: "invalid document payload" }, { status: 400 });
    }

    const services = createAdminServices();
    const document = await services.adminContentPort.updateDocument(
      documentId,
      payload,
    );
    if (!document) {
      return NextResponse.json({ error: "document not found" }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("admin rag document patch route error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "failed to update document" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ documentId: string }> },
) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { documentId } = await context.params;
    if (!documentId) {
      return NextResponse.json({ error: "documentId is required" }, { status: 400 });
    }

    const services = createAdminServices();
    await services.adminContentPort.deleteDocument(documentId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin rag document delete route error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "failed to delete document" },
      { status: 400 },
    );
  }
}
