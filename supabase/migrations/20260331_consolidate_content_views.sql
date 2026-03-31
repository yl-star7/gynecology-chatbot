-- Consolidate and clean up content views
-- 1. Drop unused published_pregnancy_weeks view
-- 2. Replace v_pregnancy_week_data with published_weeks (filtered at view level)
-- 3. Replace v_week_checklists with active_week_checklists (is_active=true)
-- 4. Replace v_week_questions with active_week_questions (is_active=true)

DROP VIEW IF EXISTS public.published_pregnancy_weeks;

CREATE OR REPLACE VIEW public.published_weeks AS
  SELECT id, week_number, title, baby_size_label, baby_size_compare_object, baby_summary, mother_summary, warning_signs, recommended_actions, checklist_intro, question_intro, status, updated_at
  FROM content.pregnancy_week_data
  WHERE status = 'published'
  ORDER BY week_number;

CREATE OR REPLACE VIEW public.active_week_checklists AS
  SELECT id, week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, created_at, updated_at
  FROM content.week_checklists
  WHERE is_active = true
  ORDER BY day_number ASC NULLS LAST, display_order ASC NULLS LAST;

CREATE OR REPLACE VIEW public.active_week_questions AS
  SELECT id, week_data_id, day_number, code, question_type, question_text, help_text, question_payload, display_order, is_required, is_active, created_at, updated_at
  FROM content.week_questions
  WHERE is_active = true
  ORDER BY day_number ASC NULLS LAST, display_order ASC NULLS LAST;

-- Keep v_pregnancy_day_contents as-is for now (no consistent filter pattern)