-- Add content schema tables to Supabase
-- These exist in local docker, now adding to Supabase

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'content'
  ) THEN
    EXECUTE 'CREATE SCHEMA content';
  END IF;
END $$;

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
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS content.week_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_data_id uuid REFERENCES content.pregnancy_week_data(id),
  day_content_id uuid,
  day_number integer,
  code varchar(50) NOT NULL,
  title varchar(200),
  description text,
  checklist_payload jsonb,
  display_order integer,
  is_required boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS content.week_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_data_id uuid REFERENCES content.pregnancy_week_data(id),
  day_content_id uuid,
  day_number integer,
  code varchar(50) NOT NULL,
  question_type varchar(50) NOT NULL,
  question_text text NOT NULL,
  help_text text,
  question_payload jsonb,
  display_order integer,
  is_required boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS content.pregnancy_day_contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_data_id uuid REFERENCES content.pregnancy_week_data(id),
  day_number integer NOT NULL,
  title varchar(200),
  baby_development_payload jsonb,
  baby_message text,
  mother_changes_payload jsonb,
  display_order integer,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS content.knowledge_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(100) NOT NULL UNIQUE,
  section varchar(50) NOT NULL,
  title varchar(200) NOT NULL,
  body text NOT NULL,
  image_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS content.pregnancy_week_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_data_id uuid REFERENCES content.pregnancy_week_data(id),
  day_content_id uuid,
  day_number integer,
  media_scope varchar(20) DEFAULT 'week',
  bucket_id varchar(100) NOT NULL,
  object_path text NOT NULL,
  media_role varchar(50) NOT NULL,
  alt_text text,
  source_file_name text,
  display_order integer,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);