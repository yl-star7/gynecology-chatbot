-- RAG 파일 업로드 메타데이터 관리 테이블
CREATE TABLE IF NOT EXISTS public.content_rag_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  storage_path text NOT NULL,
  schift_bucket text NOT NULL DEFAULT 'pregnancy-knowledge',
  file_size integer NOT NULL DEFAULT 0,
  mime_type text NOT NULL DEFAULT 'application/octet-stream',
  category text NOT NULL DEFAULT '',
  pregnancy_week integer,
  status text NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'ready', 'failed')),
  error_message text,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rag_files_status ON public.content_rag_files (status);
CREATE INDEX IF NOT EXISTS idx_rag_files_created ON public.content_rag_files (created_at DESC);
