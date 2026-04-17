-- Drop week_number CHECK (1..40) to allow weeks 41~42 (post-due) and weeks 1~4.
-- Mirrors live change applied on 2026-04-17.

ALTER TABLE public.content_pregnancy_week_data
  DROP CONSTRAINT IF EXISTS content_pregnancy_week_data_week_number_range;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'content' AND table_name = 'pregnancy_week_data'
  ) THEN
    EXECUTE 'ALTER TABLE content.pregnancy_week_data DROP CONSTRAINT IF EXISTS pregnancy_week_data_week_number_range';
  END IF;
END $$;
