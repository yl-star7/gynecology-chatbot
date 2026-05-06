-- Public views for content schema tables
-- Avoids needing to expose content schema directly to API callers

CREATE OR REPLACE VIEW public.v_pregnancy_week_data AS
  SELECT * FROM content.pregnancy_week_data;

CREATE OR REPLACE VIEW public.v_pregnancy_day_contents AS
  SELECT * FROM content.pregnancy_day_contents;

CREATE OR REPLACE VIEW public.v_week_checklists AS
  SELECT * FROM content.week_checklists;

CREATE OR REPLACE VIEW public.v_week_questions AS
  SELECT * FROM content.week_questions;
