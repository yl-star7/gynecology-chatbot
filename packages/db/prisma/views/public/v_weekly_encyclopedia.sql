SELECT
  source_week_number AS week_number,
  source_day_number AS day_number,
  source_code,
  content_scope,
  category,
  title,
  summary,
  body,
  items,
  updated_at
FROM
  content_paraphrased_items
WHERE
  (
    ((STATUS) :: text = 'ready' :: text)
    AND (is_active = TRUE)
  );