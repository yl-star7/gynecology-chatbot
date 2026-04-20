SELECT
  cs.user_id,
  date((cm.created_at AT TIME ZONE 'Asia/Seoul' :: text)) AS date,
  'chat' :: text AS entry_type,
  cs.title AS summary
FROM
  (
    chat_sessions cs
    JOIN chat_messages cm ON ((cm.session_id = cs.id))
  )
WHERE
  (cm.role = 'user' :: text)
GROUP BY
  cs.user_id,
  (
    date((cm.created_at AT TIME ZONE 'Asia/Seoul' :: text))
  ),
  cs.title
UNION
ALL
SELECT
  uce.user_id,
  date(
    (uce.completed_at AT TIME ZONE 'Asia/Seoul' :: text)
  ) AS date,
  'checklist' :: text AS entry_type,
  NULL :: character varying AS summary
FROM
  user_checklist_events uce
WHERE
  (
    (uce.status = 'completed' :: text)
    AND (uce.completed_at IS NOT NULL)
  )
UNION
ALL
SELECT
  uqe.user_id,
  date(
    (uqe.answered_at AT TIME ZONE 'Asia/Seoul' :: text)
  ) AS date,
  'question' :: text AS entry_type,
  NULL :: character varying AS summary
FROM
  user_question_events uqe
WHERE
  (
    (uqe.status = 'answered' :: text)
    AND (uqe.answered_at IS NOT NULL)
  )
UNION
ALL
SELECT
  cl.user_id,
  cl.date,
  cl.entry_type,
  cl.summary
FROM
  calendar_logs cl;