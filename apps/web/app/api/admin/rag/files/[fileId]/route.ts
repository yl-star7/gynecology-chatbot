import { NextRequest, NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";
import { deleteStorageObject } from "@/lib/admin/gcs-storage";
import { prisma } from "@gynecology-chatbot/db/prisma";

const RAG_FILES_BUCKET = "rag-files";

type RagFileRow = {
  id: string;
  filename: string;
  storage_path: string;
  schift_bucket: string;
  file_size: number;
  mime_type: string;
  status: string;
  enabled: boolean;
  error_message: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
};

/** DELETE /api/admin/rag/files/[fileId] */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { fileId } = await params;

    const file = await prisma.content_rag_files.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        filename: true,
        storage_path: true,
        schift_bucket: true,
        file_size: true,
        mime_type: true,
        status: true,
        enabled: true,
        error_message: true,
        uploaded_by: true,
        created_at: true,
        updated_at: true,
      },
    });
    if (!file) {
      return NextResponse.json(
        { error: "파일을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // Supabase Storage에서 원본 삭제
    try {
      await deleteStorageObject({
        bucketId: RAG_FILES_BUCKET,
        objectPath: file.storage_path,
      });
    } catch (storageError) {
      console.warn("Storage 파일 삭제 실패 (무시):", storageError);
    }

    // DB 메타데이터 삭제
    await prisma.content_rag_files.delete({ where: { id: fileId } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin rag file delete error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "파일 삭제에 실패했습니다.",
      },
      { status: 500 },
    );
  }
}

/** PATCH /api/admin/rag/files/[fileId] — 반영 여부 토글 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { fileId } = await params;
    const body = (await request.json()) as { enabled?: boolean };

    if (typeof body.enabled !== "boolean") {
      return NextResponse.json(
        { error: "enabled (boolean) is required" },
        { status: 400 },
      );
    }

    await prisma.content_rag_files.update({
      where: { id: fileId },
      data: {
        enabled: body.enabled,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin rag file patch error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "반영 상태 변경에 실패했습니다.",
      },
      { status: 500 },
    );
  }
}
