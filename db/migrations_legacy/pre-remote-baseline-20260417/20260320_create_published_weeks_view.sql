CREATE OR REPLACE VIEW public.published_pregnancy_weeks AS
  SELECT week_number, title, baby_size_label, baby_summary, mother_summary, warning_signs, recommended_actions, status
  FROM content.pregnancy_week_data
  WHERE status = 'published'
  ORDER BY week_number;
