import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";
import { ensureStorageBucketWithOptions } from "@/lib/admin/supabase-storage";
import { getSchiftClient } from "@/lib/mobile/schift-client";
import {
  supabaseInsert,
  supabaseSelect,
  supabaseUpdate,
} from "@/lib/supabase/admin-client";

const RAG_FILES_BUCKET = "rag-files";
const SCHIFT_BUCKET = "pregnancy-knowledge";
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

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

/** GET /api/admin/rag/files — 파일 목록 조회 */
export async function GET() {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const rows = await supabaseSelect<RagFileRow[]>(
      "content_rag_files?select=id,filename,storage_path,schift_bucket,file_size,mime_type,status,enabled,error_message,uploaded_by,created_at,updated_at&order=created_at.desc",
    );

    return NextResponse.json({ files: rows });
  } catch (error) {
    console.error("admin rag files list error", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "failed to list files",
      },
      { status: 500 },
    );
  }
}

/** POST /api/admin/rag/files — 파일 업로드 (Supabase Storage + Schift ingest) */
export async function POST(request: NextRequest) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || !file.size) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "파일 크기는 20MB 이하만 가능합니다." },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "PDF, DOCX, TXT 파일만 업로드할 수 있습니다." },
        { status: 400 },
      );
    }

    const fileId = randomUUID();
    const ext = (file.name || "").split(".").pop()?.toLowerCase() || "bin";
    const storagePath = `rag/${fileId}.${ext}`;

    // 1. Supabase Storage에 원본 저장
    const storageClient = await ensureStorageBucketWithOptions(
      RAG_FILES_BUCKET,
      { isPublic: false },
    );
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await storageClient.storage
      .from(RAG_FILES_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage 업로드 실패: ${uploadError.message}`);
    }

    // 2. DB에 메타데이터 행 삽입 (processing 상태)
    await supabaseInsert("content_rag_files", {
      id: fileId,
      filename: file.name,
      storage_path: storagePath,
      schift_bucket: SCHIFT_BUCKET,
      file_size: file.size,
      mime_type: file.type,
      status: "processing",
      enabled: true,
      uploaded_by: admin.id,
    });

    // 3. Schift ingest (비동기적으로 처리 — 실패해도 메타 행은 유지)
    try {
      const schift = getSchiftClient();
      if (!schift) {
        throw new Error("Schift 클라이언트가 설정되지 않았습니다.");
      }

      const safeSchiftName = `${fileId}.${ext}`;
      const schiftFile = new File([buffer], safeSchiftName, {
        type: file.type,
      });
      await schift.db.upload(SCHIFT_BUCKET, { files: [schiftFile] });

      await supabaseUpdate(`content_rag_files?id=eq.${fileId}`, {
        status: "ready",
        updated_at: new Date().toISOString(),
      });
    } catch (schiftError) {
      const message =
        schiftError instanceof Error
          ? schiftError.message
          : "Schift ingest 실패";
      console.error("Schift ingest failed for", fileId, schiftError);

      await supabaseUpdate(`content_rag_files?id=eq.${fileId}`, {
        status: "failed",
        error_message: message,
        updated_at: new Date().toISOString(),
      });
    }

    // 최종 상태 조회
    const rows = await supabaseSelect<RagFileRow[]>(
      `content_rag_files?select=id,filename,storage_path,schift_bucket,file_size,mime_type,status,enabled,error_message,uploaded_by,created_at,updated_at&id=eq.${fileId}`,
    );

    return NextResponse.json({ file: rows[0] ?? null, ok: true });
  } catch (error) {
    console.error("admin rag file upload error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "파일 업로드에 실패했습니다.",
      },
      { status: 500 },
    );
  }
}
