import { NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { createAdminServices } from "@/lib/admin/create-admin-services";
import type { AdminRagDocumentInput } from "@gynecology-chatbot/app-core";
import { revalidateAdminDocumentsCache } from "@/lib/admin/admin-cache";

function parseImageUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return null;
    return trimmed;
  } catch {
    return null;
  }
}

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
  const imageUrl =
    record.imageUrl === null || record.imageUrl === undefined
      ? null
      : parseImageUrl(record.imageUrl);

  // If imageUrl was provided as a non-empty string but failed validation, reject
  if (
    typeof record.imageUrl === "string" &&
    record.imageUrl.trim() !== "" &&
    imageUrl === null
  ) {
    return null;
  }

  if (!title || !category || !content) {
    return null;
  }

  return {
    title,
    category,
    content,
    pregnancyWeek,
    imageUrl,
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
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 },
      );
    }

    const services = createAdminServices();
    const document = await services.adminContentPort.getDocument(documentId);
    if (!document) {
      return NextResponse.json(
        { error: "document not found" },
        { status: 404 },
      );
    }

    revalidateAdminDocumentsCache();

    return NextResponse.json({ document });
  } catch (error) {
    console.error("admin rag document get route error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "failed to load document",
      },
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
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 },
      );
    }

    const payload = parseDocumentInput(await request.json());
    if (!payload) {
      return NextResponse.json(
        { error: "invalid document payload" },
        { status: 400 },
      );
    }

    const services = createAdminServices();
    const document = await services.adminContentPort.updateDocument(
      documentId,
      payload,
      admin.id,
    );
    if (!document) {
      return NextResponse.json(
        { error: "document not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("admin rag document patch route error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "failed to update document",
      },
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
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 },
      );
    }

    const services = createAdminServices();
    await services.adminContentPort.deleteDocument(documentId, admin.id);
    revalidateAdminDocumentsCache();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin rag document delete route error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "failed to delete document",
      },
      { status: 400 },
    );
  }
}
