import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@gynecology-chatbot/db/prisma";
import {
  buildKnowledgeLinkContent,
  buildPregnancyDocumentLinkContent,
  isUuidEntityId,
} from "@gynecology-chatbot/mobile-api/link-target";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";
import { loadCachedAdminKnowledgeItems } from "@/lib/admin/admin-cache";

type PregnancyDocumentRow = {
  id: string;
  title: string | null;
  content: string;
  category: string;
  pregnancy_week: number | null;
};

const pregnancyDocumentSelect = {
  id: true,
  title: true,
  content: true,
  category: true,
  pregnancy_week: true,
} as const;

async function findFallbackPregnancyDocument(entityId: string) {
  const trimmedEntityId = entityId.trim();

  if (isUuidEntityId(trimmedEntityId)) {
    const document = (await prisma.content_pregnancy_documents.findUnique({
      where: { id: trimmedEntityId },
      select: pregnancyDocumentSelect,
    })) as PregnancyDocumentRow | null;

    if (document) {
      return document;
    }
  }

  if (trimmedEntityId) {
    return null;
  }

  return (await prisma.content_pregnancy_documents.findFirst({
    orderBy: [{ updated_at: "desc" }],
    select: pregnancyDocumentSelect,
  })) as PregnancyDocumentRow | null;
}

export async function GET(request: NextRequest) {
  try {
    await requireMobileSession(request);
    const target = request.nextUrl.searchParams.get("target")?.trim();
    const entityId = request.nextUrl.searchParams.get("entityId")?.trim() ?? "";

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

    const fallbackDocument =
      !items[0] && target === "knowledge"
        ? await findFallbackPregnancyDocument(entityId)
        : null;
    const content = items[0]
      ? buildKnowledgeLinkContent(items[0])
      : fallbackDocument
        ? buildPregnancyDocumentLinkContent(fallbackDocument)
        : null;

    if (!content) {
      return NextResponse.json(
        { error: "link target not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      content,
    });
  } catch (error) {
    console.error("mobile link route error", error);
    return mobileRouteErrorResponse(error, "failed to load link target");
  }
}
