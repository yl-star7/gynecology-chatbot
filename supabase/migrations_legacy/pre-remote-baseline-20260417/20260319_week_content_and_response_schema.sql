DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.schemata
    WHERE schema_name = 'content'
  ) THEN
    EXECUTE 'CREATE SCHEMA content';
  END IF;
END $$;

ALTER TABLE public.chat_sessions
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chat_sessions_status_check'
      AND conrelid = 'public.chat_sessions'::regclass
  ) THEN
    ALTER TABLE public.chat_sessions
      DROP CONSTRAINT chat_sessions_status_check;
  END IF;
END $$;

ALTER TABLE public.chat_sessions
  ADD CONSTRAINT chat_sessions_status_check
  CHECK (status IN ('active', 'archived', 'deleted'));

CREATE TABLE IF NOT EXISTS content.pregnancy_week_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
  CONSTRAINT pregnancy_week_data_week_number_range CHECK (week_number BETWEEN 1 AND 40)
);

INSERT INTO content.pregnancy_week_data (
  week_number,
  title,
  status,
  created_at,
  updated_at
)
SELECT
  gs.week_number,
  gs.week_number || '주차',
  'draft',
  timezone('utc', now()),
  timezone('utc', now())
FROM generate_series(1, 40) AS gs(week_number)
ON CONFLICT (week_number) DO NOTHING;

CREATE TABLE IF NOT EXISTS content.pregnancy_day_contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_data_id uuid NOT NULL REFERENCES content.pregnancy_week_data (id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  title varchar(120),
  baby_development_payload jsonb NOT NULL DEFAULT '{"items":[]}'::jsonb,
  baby_message text,
  mother_changes_payload jsonb NOT NULL DEFAULT '{"items":[]}'::jsonb,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT pregnancy_day_contents_week_day_unique UNIQUE (week_data_id, day_number),
  CONSTRAINT pregnancy_day_contents_day_number_range CHECK (day_number BETWEEN 1 AND 7)
);

CREATE INDEX IF NOT EXISTS idx_pregnancy_day_contents_display
  ON content.pregnancy_day_contents (week_data_id, display_order);

CREATE TABLE IF NOT EXISTS content.pregnancy_week_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_data_id uuid NOT NULL REFERENCES content.pregnancy_week_data (id) ON DELETE CASCADE,
  day_content_id uuid REFERENCES content.pregnancy_day_contents (id) ON DELETE CASCADE,
  day_number integer,
  media_scope varchar(40) NOT NULL DEFAULT 'week',
  bucket_id varchar(120) NOT NULL,
  object_path text NOT NULL,
  media_role varchar(80) NOT NULL DEFAULT 'reference',
  alt_text text,
  source_file_name varchar(255),
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT pregnancy_week_media_object_unique UNIQUE (week_data_id, object_path),
  CONSTRAINT pregnancy_week_media_day_number_range CHECK (day_number IS NULL OR day_number BETWEEN 1 AND 7),
  CONSTRAINT pregnancy_week_media_scope_check CHECK (media_scope IN ('week', 'day'))
);

CREATE INDEX IF NOT EXISTS idx_pregnancy_week_media_display
  ON content.pregnancy_week_media (week_data_id, day_number, display_order);

CREATE TABLE IF NOT EXISTS content.week_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_data_id uuid NOT NULL REFERENCES content.pregnancy_week_data (id) ON DELETE CASCADE,
  day_content_id uuid REFERENCES content.pregnancy_day_contents (id) ON DELETE CASCADE,
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
  CONSTRAINT week_checklists_day_number_range CHECK (day_number IS NULL OR day_number BETWEEN 1 AND 7)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_week_checklists_week_code
  ON content.week_checklists (week_data_id, day_number, code);

CREATE INDEX IF NOT EXISTS idx_week_checklists_week_display
  ON content.week_checklists (week_data_id, day_number, display_order);

CREATE TABLE IF NOT EXISTS content.week_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_data_id uuid NOT NULL REFERENCES content.pregnancy_week_data (id) ON DELETE CASCADE,
  day_content_id uuid REFERENCES content.pregnancy_day_contents (id) ON DELETE CASCADE,
  day_number integer,
  code varchar(120) NOT NULL,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'text' CHECK (
    question_type IN ('text', 'single_choice', 'multi_choice', 'yes_no', 'number')
  ),
  help_text text,
  question_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  display_order integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT week_questions_day_number_range CHECK (day_number IS NULL OR day_number BETWEEN 1 AND 7)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_week_questions_week_code
  ON content.week_questions (week_data_id, day_number, code);

CREATE INDEX IF NOT EXISTS idx_week_questions_week_display
  ON content.week_questions (week_data_id, day_number, display_order);

CREATE TABLE IF NOT EXISTS public.user_checklist_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  checklist_id uuid NOT NULL REFERENCES content.week_checklists (id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.chat_sessions (id) ON DELETE SET NULL,
  prompt_message_id uuid REFERENCES public.chat_messages (id) ON DELETE SET NULL,
  completion_message_id uuid REFERENCES public.chat_messages (id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'completed', 'skipped')),
  sent_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_user_checklist_events_user_checklist
  ON public.user_checklist_events (user_id, checklist_id);

CREATE INDEX IF NOT EXISTS idx_user_checklist_events_status
  ON public.user_checklist_events (status);

CREATE TABLE IF NOT EXISTS public.user_question_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES content.week_questions (id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.chat_sessions (id) ON DELETE SET NULL,
  prompt_message_id uuid REFERENCES public.chat_messages (id) ON DELETE SET NULL,
  answer_message_id uuid REFERENCES public.chat_messages (id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'answered', 'skipped')),
  sent_at timestamptz,
  answered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_user_question_events_user_question
  ON public.user_question_events (user_id, question_id);

CREATE INDEX IF NOT EXISTS idx_user_question_events_status
  ON public.user_question_events (status);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'message_links_target_type_check'
      AND conrelid = 'public.message_links'::regclass
  ) THEN
    ALTER TABLE public.message_links
      DROP CONSTRAINT message_links_target_type_check;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'message_links_target_type_check'
      AND conrelid = 'public.message_links'::regclass
      AND pg_get_constraintdef(oid) LIKE '%week_data%'
  ) THEN
    ALTER TABLE public.message_links
      ADD CONSTRAINT message_links_target_type_check
      CHECK (
        target_type IN (
          'knowledge_item',
          'pregnancy_week',
          'pregnancy_document',
          'week_data',
          'week_checklist',
          'week_question',
          'external'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'content'
      AND table_name = 'pregnancy_weeks'
  ) THEN
    INSERT INTO content.pregnancy_week_data (
      week_number,
      title,
      baby_size_label,
      baby_size_compare_object,
      baby_summary,
      mother_summary,
      status,
      created_at,
      updated_at
    )
    SELECT
      pw.week_number,
      pw.title,
      pw.baby_size_label,
      pw.baby_size_compare_object,
      pw.baby_summary,
      pw.mother_summary,
      pw.status,
      pw.created_at,
      pw.updated_at
    FROM content.pregnancy_weeks pw
    ON CONFLICT (week_number) DO NOTHING;
  END IF;
END $$;
