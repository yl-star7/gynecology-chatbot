CREATE TABLE IF NOT EXISTS public.blocked_phone_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number_encrypted text NOT NULL,
  phone_number_blind_index text NOT NULL UNIQUE,
  phone_number_last4 varchar(4) NOT NULL,
  display_name varchar(100),
  note text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.content_pregnancy_week_data (
  id uuid PRIMARY KEY,
  week_number integer NOT NULL UNIQUE,
  title varchar(200),
  baby_size_label varchar(120),
  baby_size_compare_object varchar(120),
  baby_summary text,
  mother_summary text,
  warning_signs text,
  recommended_actions text,
  checklist_intro text,
  question_intro text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT content_pregnancy_week_data_week_number_range CHECK (week_number BETWEEN 1 AND 40)
);

CREATE TABLE IF NOT EXISTS public.content_pregnancy_day_contents (
  id uuid PRIMARY KEY,
  week_data_id uuid NOT NULL REFERENCES public.content_pregnancy_week_data(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  title varchar(120),
  baby_development_payload jsonb NOT NULL DEFAULT '{"items":[]}'::jsonb,
  baby_message text,
  mother_changes_payload jsonb NOT NULL DEFAULT '{"items":[]}'::jsonb,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT content_pregnancy_day_contents_week_day_unique UNIQUE (week_data_id, day_number),
  CONSTRAINT content_pregnancy_day_contents_day_number_range CHECK (day_number BETWEEN 1 AND 7)
);

CREATE TABLE IF NOT EXISTS public.content_week_checklists (
  id uuid PRIMARY KEY,
  week_data_id uuid NOT NULL REFERENCES public.content_pregnancy_week_data(id) ON DELETE CASCADE,
  day_content_id uuid REFERENCES public.content_pregnancy_day_contents(id) ON DELETE CASCADE,
  day_number integer,
  code varchar(120) NOT NULL,
  title varchar(200) NOT NULL,
  description text,
  checklist_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  display_order integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT content_week_checklists_day_number_range CHECK (day_number IS NULL OR day_number BETWEEN 1 AND 7)
);

CREATE TABLE IF NOT EXISTS public.content_week_questions (
  id uuid PRIMARY KEY,
  week_data_id uuid NOT NULL REFERENCES public.content_pregnancy_week_data(id) ON DELETE CASCADE,
  day_content_id uuid REFERENCES public.content_pregnancy_day_contents(id) ON DELETE CASCADE,
  day_number integer,
  code varchar(120) NOT NULL,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'text' CHECK (question_type IN ('text', 'single_choice', 'multi_choice', 'yes_no', 'number')),
  help_text text,
  question_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  display_order integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT content_week_questions_day_number_range CHECK (day_number IS NULL OR day_number BETWEEN 1 AND 7)
);

CREATE TABLE IF NOT EXISTS public.content_pregnancy_week_media (
  id uuid PRIMARY KEY,
  week_data_id uuid NOT NULL REFERENCES public.content_pregnancy_week_data(id) ON DELETE CASCADE,
  day_content_id uuid REFERENCES public.content_pregnancy_day_contents(id) ON DELETE CASCADE,
  day_number integer,
  media_scope varchar(40) NOT NULL DEFAULT 'week' CHECK (media_scope IN ('week', 'day')),
  bucket_id varchar(120) NOT NULL,
  object_path text NOT NULL,
  media_role varchar(80) NOT NULL DEFAULT 'reference',
  alt_text text,
  source_file_name varchar(255),
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.content_pregnancy_documents (
  id uuid PRIMARY KEY,
  title varchar,
  content text NOT NULL,
  pregnancy_week integer,
  category varchar NOT NULL,
  image_url text,
  embedding vector(1536),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.content_knowledge_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(120) NOT NULL UNIQUE,
  section text NOT NULL CHECK (section IN ('knowledge', 'notebook')),
  title text NOT NULL,
  body text NOT NULL,
  image_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

INSERT INTO public.content_pregnancy_week_data (
  id, week_number, title, baby_size_label, baby_size_compare_object, baby_summary,
  mother_summary, warning_signs, recommended_actions, checklist_intro, question_intro,
  status, created_at, updated_at
)
SELECT
  id, week_number, title, baby_size_label, baby_size_compare_object, baby_summary,
  mother_summary, warning_signs, recommended_actions, checklist_intro, question_intro,
  status, created_at, updated_at
FROM content.pregnancy_week_data
ON CONFLICT (id) DO UPDATE SET
  week_number = EXCLUDED.week_number,
  title = EXCLUDED.title,
  baby_size_label = EXCLUDED.baby_size_label,
  baby_size_compare_object = EXCLUDED.baby_size_compare_object,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  warning_signs = EXCLUDED.warning_signs,
  recommended_actions = EXCLUDED.recommended_actions,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO public.content_pregnancy_day_contents (
  id, week_data_id, day_number, title, baby_development_payload, baby_message,
  mother_changes_payload, display_order, created_at, updated_at
)
SELECT
  id, week_data_id, day_number, title, baby_development_payload, baby_message,
  mother_changes_payload, display_order, created_at, updated_at
FROM content.pregnancy_day_contents
ON CONFLICT (id) DO UPDATE SET
  week_data_id = EXCLUDED.week_data_id,
  day_number = EXCLUDED.day_number,
  title = EXCLUDED.title,
  baby_development_payload = EXCLUDED.baby_development_payload,
  baby_message = EXCLUDED.baby_message,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  display_order = EXCLUDED.display_order,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO public.content_week_checklists (
  id, week_data_id, day_content_id, day_number, code, title, description,
  checklist_payload, display_order, is_required, is_active, created_at, updated_at
)
SELECT
  id, week_data_id, day_content_id, day_number, code, title, description,
  checklist_payload, display_order, is_required, is_active, created_at, updated_at
FROM content.week_checklists
ON CONFLICT (id) DO UPDATE SET
  week_data_id = EXCLUDED.week_data_id,
  day_content_id = EXCLUDED.day_content_id,
  day_number = EXCLUDED.day_number,
  code = EXCLUDED.code,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload,
  display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO public.content_week_questions (
  id, week_data_id, day_content_id, day_number, code, question_text, question_type,
  help_text, question_payload, display_order, is_required, is_active, created_at, updated_at
)
SELECT
  id, week_data_id, day_content_id, day_number, code, question_text, question_type,
  help_text, question_payload, display_order, is_required, is_active, created_at, updated_at
FROM content.week_questions
ON CONFLICT (id) DO UPDATE SET
  week_data_id = EXCLUDED.week_data_id,
  day_content_id = EXCLUDED.day_content_id,
  day_number = EXCLUDED.day_number,
  code = EXCLUDED.code,
  question_text = EXCLUDED.question_text,
  question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text,
  question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO public.content_pregnancy_week_media (
  id, week_data_id, day_content_id, day_number, media_scope, bucket_id, object_path,
  media_role, alt_text, source_file_name, display_order, created_at, updated_at
)
SELECT
  id, week_data_id, day_content_id, day_number, media_scope, bucket_id, object_path,
  media_role, alt_text, source_file_name, display_order, created_at, updated_at
FROM content.pregnancy_week_media
ON CONFLICT (id) DO UPDATE SET
  week_data_id = EXCLUDED.week_data_id,
  day_content_id = EXCLUDED.day_content_id,
  day_number = EXCLUDED.day_number,
  media_scope = EXCLUDED.media_scope,
  bucket_id = EXCLUDED.bucket_id,
  object_path = EXCLUDED.object_path,
  media_role = EXCLUDED.media_role,
  alt_text = EXCLUDED.alt_text,
  source_file_name = EXCLUDED.source_file_name,
  display_order = EXCLUDED.display_order,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO public.content_pregnancy_documents (
  id, title, content, pregnancy_week, category, image_url, embedding, metadata, created_at, updated_at
)
SELECT
  id, title, content, pregnancy_week, category, NULL::text AS image_url, embedding, metadata, created_at, created_at AS updated_at
FROM content.pregnancy_documents
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  pregnancy_week = EXCLUDED.pregnancy_week,
  category = EXCLUDED.category,
  embedding = EXCLUDED.embedding,
  metadata = EXCLUDED.metadata,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'knowledge_items'
  ) THEN
    INSERT INTO public.content_knowledge_items (
      id, slug, section, title, body, image_url, status, published_at, created_at, updated_at
    )
    SELECT
      gen_random_uuid(),
      md5(title || '-' || created_at::text),
      'knowledge',
      title,
      body,
      NULL,
      status,
      CASE WHEN status = 'published' THEN created_at ELSE NULL END,
      created_at,
      created_at
    FROM public.knowledge_items
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;

DROP VIEW IF EXISTS public.published_weeks;

DROP FUNCTION IF EXISTS public.match_pregnancy_documents(vector, integer, integer);

CREATE OR REPLACE FUNCTION public.match_pregnancy_documents(
  query_embedding vector(1536),
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
  FROM public.content_pregnancy_documents pd
  WHERE (
    current_week IS NULL
    OR pd.pregnancy_week IS NULL
    OR pd.pregnancy_week BETWEEN current_week - 1 AND current_week + 1
  )
  ORDER BY pd.embedding <=> query_embedding
  LIMIT GREATEST(match_count, 1);
$$;

ALTER TABLE public.user_checklist_events DROP CONSTRAINT IF EXISTS user_checklist_events_checklist_id_fkey;
ALTER TABLE public.user_question_events DROP CONSTRAINT IF EXISTS user_question_events_question_id_fkey;

ALTER TABLE public.user_checklist_events
  ADD CONSTRAINT user_checklist_events_checklist_id_fkey
  FOREIGN KEY (checklist_id) REFERENCES public.content_week_checklists(id) ON DELETE CASCADE;

ALTER TABLE public.user_question_events
  ADD CONSTRAINT user_question_events_question_id_fkey
  FOREIGN KEY (question_id) REFERENCES public.content_week_questions(id) ON DELETE CASCADE;

DROP TABLE IF EXISTS public.allowed_phone_numbers;
