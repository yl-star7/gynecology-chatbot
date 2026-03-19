-- Keep weeks 5-12 as draft placeholders until validated source content is ready.
-- This seed is idempotent and intentionally clears any accidental day/checklist/question
-- payloads for the unfinished range.

WITH target_weeks AS (
  SELECT id, week_number
  FROM content.pregnancy_week_data
  WHERE week_number BETWEEN 5 AND 12
),
deleted_checklists AS (
  DELETE FROM content.week_checklists checklist
  USING target_weeks target
  WHERE checklist.week_data_id = target.id
  RETURNING checklist.id
),
deleted_questions AS (
  DELETE FROM content.week_questions question
  USING target_weeks target
  WHERE question.week_data_id = target.id
  RETURNING question.id
),
deleted_days AS (
  DELETE FROM content.pregnancy_day_contents day_content
  USING target_weeks target
  WHERE day_content.week_data_id = target.id
  RETURNING day_content.id
)
UPDATE content.pregnancy_week_data week_data
SET
  title = week_data.week_number || '주차',
  baby_size_label = NULL,
  baby_size_compare_object = NULL,
  baby_summary = NULL,
  mother_summary = NULL,
  warning_signs = NULL,
  recommended_actions = NULL,
  checklist_intro = NULL,
  question_intro = NULL,
  status = 'draft',
  updated_at = timezone('utc', now())
FROM target_weeks target
WHERE week_data.id = target.id;
