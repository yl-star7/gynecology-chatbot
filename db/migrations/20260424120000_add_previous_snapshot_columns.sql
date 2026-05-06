-- Admin v3.3 IA: 롤백 1단계 지원용 previous_snapshot 컬럼 추가.
-- 편집 시 current row를 jsonb로 저장 → 롤백 시 snapshot 복원.
-- 전수 버전 이력은 admin_audit_logs에서 확인.

-- 1. content_pregnancy_week_data
ALTER TABLE public.content_pregnancy_week_data
  ADD COLUMN IF NOT EXISTS previous_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS updated_by uuid;

-- 2. content_pregnancy_day_contents
ALTER TABLE public.content_pregnancy_day_contents
  ADD COLUMN IF NOT EXISTS previous_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS updated_by uuid;

-- 3. content_week_checklists
ALTER TABLE public.content_week_checklists
  ADD COLUMN IF NOT EXISTS previous_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS updated_by uuid;

-- 4. content_week_questions
ALTER TABLE public.content_week_questions
  ADD COLUMN IF NOT EXISTS previous_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS updated_by uuid;

-- 5. content_knowledge_items
ALTER TABLE public.content_knowledge_items
  ADD COLUMN IF NOT EXISTS previous_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS updated_by uuid;

-- 6. content_pregnancy_week_media
ALTER TABLE public.content_pregnancy_week_media
  ADD COLUMN IF NOT EXISTS previous_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS updated_by uuid;

-- 7. content_pregnancy_documents (RAG)
ALTER TABLE public.content_pregnancy_documents
  ADD COLUMN IF NOT EXISTS previous_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS updated_by uuid;

-- 8. system_config (홈카피·변주·스케줄 등 singleton rows)
ALTER TABLE public.system_config
  ADD COLUMN IF NOT EXISTS previous_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS updated_by uuid;

-- 모든 updated_by 는 users(id) 참조. NULL 허용은 legacy row 보호.
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'content_pregnancy_week_data',
      'content_pregnancy_day_contents',
      'content_week_checklists',
      'content_week_questions',
      'content_knowledge_items',
      'content_pregnancy_week_media',
      'content_pregnancy_documents',
      'system_config'
    ])
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I
         DROP CONSTRAINT IF EXISTS %I,
         ADD CONSTRAINT %I
           FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL',
      t, t || '_updated_by_fkey', t || '_updated_by_fkey'
    );
  END LOOP;
END
$$;
