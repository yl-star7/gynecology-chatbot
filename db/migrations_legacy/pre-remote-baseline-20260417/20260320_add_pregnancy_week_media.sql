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

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'content'
      AND table_name = 'pregnancy_day_media'
  ) THEN
    INSERT INTO content.pregnancy_week_media (
      week_data_id,
      day_content_id,
      day_number,
      media_scope,
      bucket_id,
      object_path,
      media_role,
      alt_text,
      source_file_name,
      display_order,
      created_at,
      updated_at
    )
    SELECT
      day_content.week_data_id,
      media.day_content_id,
      day_content.day_number,
      'day',
      media.bucket_id,
      media.object_path,
      media.media_role,
      media.alt_text,
      media.source_file_name,
      media.display_order,
      media.created_at,
      media.updated_at
    FROM content.pregnancy_day_media media
    JOIN content.pregnancy_day_contents day_content
      ON day_content.id = media.day_content_id
    ON CONFLICT (week_data_id, object_path) DO NOTHING;
  END IF;
END $$;
