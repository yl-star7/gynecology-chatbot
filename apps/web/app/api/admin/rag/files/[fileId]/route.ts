import { NextRequest, NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";
import { ensureStorageBucketWithOptions } from "@/lib/admin/supabase-storage";
import { supabaseDelete, supabaseSelect } from "@/lib/supabase/admin-client";

const RAG_FILES_BUCKET = "rag-files";

type RagFileRow = {
  id: string;
  filename: string;
  storage_path: string;
  schift_bucket: string;
  file_size: number;
  mime_type: string;
  category: string;
  pregnancy_week: number | null;
  status: string;
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

    const rows = await supabaseSelect<RagFileRow[]>(
      `content_rag_files?select=*&id=eq.${fileId}`,
    );
    const file = rows[0];
    if (!file) {
      return NextResponse.json(
        { error: "파일을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // Supabase Storage에서 원본 삭제
    try {
      const storageClient = await ensureStorageBucketWithOptions(
        RAG_FILES_BUCKET,
        { isPublic: false },
      );
      await storageClient.storage
        .from(RAG_FILES_BUCKET)
        .remove([file.storage_path]);
    } catch (storageError) {
      console.warn("Storage 파일 삭제 실패 (무시):", storageError);
    }

    // DB 메타데이터 삭제
    await supabaseDelete(`content_rag_files?id=eq.${fileId}`);

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
