-- content_rag_files: enabled 컬럼 추가, category/pregnancy_week 컬럼 제거
ALTER TABLE public.content_rag_files
  ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT true;

ALTER TABLE public.content_rag_files
  DROP COLUMN IF EXISTS category;

ALTER TABLE public.content_rag_files
  DROP COLUMN IF EXISTS pregnancy_week;
