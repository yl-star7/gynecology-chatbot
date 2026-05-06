-- Edge Function에서 호출하는 일별 채팅 스니펫 집계 RPC
CREATE OR REPLACE FUNCTION public.get_chat_snippets_for_date(
  target_date date
)
RETURNS TABLE (
  user_id uuid,
  session_title text,
  user_messages text,
  message_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cs.user_id,
    COALESCE(NULLIF(BTRIM(cs.title), ''), '대화') AS session_title,
    LEFT(
      STRING_AGG(
        LEFT(BTRIM(cm.plain_text), 120),
        ' / ' ORDER BY cm.created_at
      ) FILTER (
        WHERE cm.role = 'user'
          AND NULLIF(BTRIM(cm.plain_text), '') IS NOT NULL
      ),
      2000
    ) AS user_messages,
    COUNT(*)::integer AS message_count
  FROM public.chat_sessions cs
  JOIN public.chat_messages cm ON cm.session_id = cs.id
  WHERE (cm.created_at AT TIME ZONE 'Asia/Seoul')::date = target_date
  GROUP BY cs.user_id, cs.id, cs.title;
$$;

COMMENT ON FUNCTION public.get_chat_snippets_for_date(date)
IS 'Returns per-user chat message snippets for a given KST date, used by daily-summary Edge Function.';
