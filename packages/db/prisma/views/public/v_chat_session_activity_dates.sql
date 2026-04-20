SELECT
  cs.user_id,
  cm.session_id,
  ((cm.created_at AT TIME ZONE 'Asia/Seoul' :: text)) :: date AS activity_date,
  max(cm.created_at) AS last_message_at
FROM
  (
    chat_messages cm
    JOIN chat_sessions cs ON ((cs.id = cm.session_id))
  )
GROUP BY
  cs.user_id,
  cm.session_id,
  (
    ((cm.created_at AT TIME ZONE 'Asia/Seoul' :: text)) :: date
  );