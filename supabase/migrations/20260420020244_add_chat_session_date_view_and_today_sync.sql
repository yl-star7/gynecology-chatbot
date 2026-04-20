CREATE OR REPLACE VIEW public.v_chat_session_activity_dates
WITH (security_invoker = true) AS
SELECT
  cs.user_id,
  cm.session_id,
  ((cm.created_at AT TIME ZONE 'Asia/Seoul')::date) AS activity_date,
  MAX(cm.created_at) AS last_message_at
FROM public.chat_messages cm
JOIN public.chat_sessions cs ON cs.id = cm.session_id
GROUP BY
  cs.user_id,
  cm.session_id,
  ((cm.created_at AT TIME ZONE 'Asia/Seoul')::date);

COMMENT ON VIEW public.v_chat_session_activity_dates IS '사용자별 일자별 채팅 세션 activity read model';
