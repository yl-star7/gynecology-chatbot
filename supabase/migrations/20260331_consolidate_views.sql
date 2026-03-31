DROP VIEW IF EXISTS public.published_pregnancy_weeks;
DROP VIEW IF EXISTS public.v_pregnancy_week_data;
DROP VIEW IF EXISTS public.v_week_checklists;
DROP VIEW IF EXISTS public.v_week_questions;
DROP VIEW IF EXISTS public.v_pregnancy_day_contents;

CREATE OR REPLACE VIEW public.published_weeks AS
SELECT
  id,
  week_number,
  title,
  baby_size_label,
  baby_size_compare_object,
  baby_summary,
  mother_summary,
  warning_signs,
  recommended_actions,
  checklist_intro,
  question_intro,
  status,
  updated_at
FROM content.pregnancy_week_data
WHERE status = 'published'
ORDER BY week_number;