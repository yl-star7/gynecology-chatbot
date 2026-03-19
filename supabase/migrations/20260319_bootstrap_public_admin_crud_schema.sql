BEGIN;

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.allowed_phone_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number varchar(20) NOT NULL UNIQUE,
  display_name varchar(100),
  note text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.workflow_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  provider text NOT NULL DEFAULT 'managed',
  status text NOT NULL DEFAULT 'draft',
  is_active boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.knowledge_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(120) NOT NULL UNIQUE,
  section text NOT NULL CHECK (section IN ('knowledge', 'notebook')),
  title varchar(200) NOT NULL,
  body text NOT NULL,
  card_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.pregnancy_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(500) NOT NULL,
  content text NOT NULL,
  pregnancy_week integer,
  category varchar(100) NOT NULL,
  embedding vector NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.pregnancy_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number integer NOT NULL,
  title text,
  baby_size_label text,
  baby_size_compare_object text,
  baby_summary text,
  mother_summary text,
  hero_image_path text,
  compare_image_path text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (week_number),
  CONSTRAINT pregnancy_weeks_week_number_range CHECK (week_number BETWEEN 1 AND 40)
);

CREATE TABLE IF NOT EXISTS public.pregnancy_week_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id uuid NOT NULL REFERENCES public.pregnancy_weeks (id) ON DELETE CASCADE,
  section_key text NOT NULL,
  title text,
  body text,
  display_order integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.pregnancy_week_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id uuid NOT NULL REFERENCES public.pregnancy_weeks (id) ON DELETE CASCADE,
  asset_type text NOT NULL,
  storage_path text NOT NULL,
  alt_text text,
  style_key text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_allowed_phone_numbers_phone_number
  ON public.allowed_phone_numbers (phone_number);

CREATE INDEX IF NOT EXISTS idx_knowledge_items_section_status
  ON public.knowledge_items (section, status);

CREATE INDEX IF NOT EXISTS idx_pregnancy_documents_week
  ON public.pregnancy_documents (pregnancy_week);

CREATE INDEX IF NOT EXISTS idx_pregnancy_documents_category
  ON public.pregnancy_documents (category);

INSERT INTO public.pregnancy_weeks (
  week_number,
  title,
  baby_size_label,
  baby_size_compare_object,
  baby_summary,
  mother_summary,
  hero_image_path,
  compare_image_path,
  status
)
SELECT
  gs.week_number,
  'Week ' || gs.week_number,
  ''::text,
  ''::text,
  ''::text,
  ''::text,
  NULL::text,
  NULL::text,
  'draft'::text
FROM generate_series(1, 40) AS gs(week_number)
ON CONFLICT (week_number) DO NOTHING;

INSERT INTO public.workflow_definitions (
  slug,
  name,
  provider,
  status,
  is_active,
  config,
  metadata
)
VALUES
  (
    'wf-chat-default',
    '기본 채팅 응답',
    'managed',
    'published',
    true,
    '{"modelName":"gemini-2.5-flash-lite","retrievalScope":"현재 주차 ±1주 + 공통 문서"}'::jsonb,
    '{"trigger":"일반 채팅","retrievalScope":"현재 주차 ±1주 + 공통 문서","modelName":"gemini-2.5-flash-lite"}'::jsonb
  ),
  (
    'wf-image-triage',
    '이미지 동반 채팅',
    'managed',
    'draft',
    false,
    '{"modelName":"gemini-2.5-flash-lite","retrievalScope":"위험 신호 문서 우선"}'::jsonb,
    '{"trigger":"이미지 + 텍스트 입력","retrievalScope":"위험 신호 문서 우선","modelName":"gemini-2.5-flash-lite"}'::jsonb
  )
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  provider = EXCLUDED.provider,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  config = EXCLUDED.config,
  metadata = EXCLUDED.metadata,
  updated_at = timezone('utc', now());

CREATE OR REPLACE FUNCTION public.match_pregnancy_documents(
  query_embedding vector,
  current_week integer DEFAULT NULL,
  match_count integer DEFAULT 8
)
RETURNS TABLE (
  id uuid,
  title varchar,
  content text,
  pregnancy_week integer,
  category varchar,
  metadata jsonb,
  similarity double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    pd.id,
    pd.title,
    pd.content,
    pd.pregnancy_week,
    pd.category,
    pd.metadata,
    1 - (pd.embedding <=> query_embedding) AS similarity
  FROM public.pregnancy_documents pd
  WHERE (
    current_week IS NULL
    OR pd.pregnancy_week IS NULL
    OR pd.pregnancy_week BETWEEN current_week - 1 AND current_week + 1
  )
  ORDER BY pd.embedding <=> query_embedding
  LIMIT GREATEST(match_count, 1);
$$;

COMMIT;
