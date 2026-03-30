DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.calendar_logs'::regclass
      AND conname = 'calendar_logs_entry_type_check'
  ) THEN
    ALTER TABLE public.calendar_logs
      DROP CONSTRAINT calendar_logs_entry_type_check;
  END IF;
END $$;

ALTER TABLE public.calendar_logs
  ADD CONSTRAINT calendar_logs_entry_type_check
  CHECK (
    entry_type IN (
      'chat_saved',
      'symptom_note',
      'ai_summary',
      'emotion_checkin',
      'survey_response',
      'today_info_view'
    )
  );

CREATE OR REPLACE FUNCTION public.generate_daily_conversation_summaries(
  summary_date date DEFAULT (((now() AT TIME ZONE 'Asia/Seoul')::date) - 1)
)
RETURNS TABLE (
  target_date date,
  processed_users integer,
  inserted_rows integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, content
AS $$
DECLARE
  v_target_date date := COALESCE(summary_date, ((now() AT TIME ZONE 'Asia/Seoul')::date) - 1);
  v_processed_users integer := 0;
  v_inserted_rows integer := 0;
BEGIN
  DELETE FROM public.calendar_logs
  WHERE date = v_target_date
    AND entry_type = 'ai_summary'
    AND COALESCE(payload->>'source', '') = 'daily_conversation_summary';

  WITH session_messages AS (
    SELECT
      cs.user_id,
      cs.id AS session_id,
      COALESCE(NULLIF(BTRIM(cs.title), ''), '대화') AS session_title,
      MAX(cm.created_at) AS last_message_at,
      STRING_AGG(
        LEFT(BTRIM(cm.plain_text), 80),
        ' / ' ORDER BY cm.created_at
      ) FILTER (
        WHERE cm.role = 'user'
          AND NULLIF(BTRIM(cm.plain_text), '') IS NOT NULL
      ) AS user_message_snippets
    FROM public.chat_sessions cs
    JOIN public.chat_messages cm
      ON cm.session_id = cs.id
    WHERE (cm.created_at AT TIME ZONE 'Asia/Seoul')::date = v_target_date
    GROUP BY cs.user_id, cs.id, cs.title
  ),
  ranked_sessions AS (
    SELECT
      session_messages.*,
      ROW_NUMBER() OVER (
        PARTITION BY session_messages.user_id
        ORDER BY session_messages.last_message_at DESC, session_messages.session_id DESC
      ) AS recency_rank
    FROM session_messages
  ),
  user_rollups AS (
    SELECT
      ranked_sessions.user_id,
      MAX(ranked_sessions.session_id::text) FILTER (WHERE ranked_sessions.recency_rank = 1)::uuid AS latest_session_id,
      COUNT(*)::integer AS session_count,
      STRING_AGG(ranked_sessions.session_title, ', ' ORDER BY ranked_sessions.last_message_at DESC) AS session_titles,
      STRING_AGG(
        ranked_sessions.user_message_snippets,
        ' / ' ORDER BY ranked_sessions.last_message_at DESC
      ) FILTER (
        WHERE NULLIF(BTRIM(ranked_sessions.user_message_snippets), '') IS NOT NULL
      ) AS combined_snippets
    FROM ranked_sessions
    GROUP BY ranked_sessions.user_id
  ),
  rollup_counts AS (
    SELECT COUNT(*)::integer AS total_users
    FROM user_rollups
  ),
  inserted AS (
    INSERT INTO public.calendar_logs (
      user_id,
      session_id,
      date,
      entry_type,
      title,
      summary,
      payload
    )
    SELECT
      user_rollups.user_id,
      user_rollups.latest_session_id,
      v_target_date,
      'ai_summary',
      '하루 대화 요약',
      CASE
        WHEN NULLIF(BTRIM(user_rollups.combined_snippets), '') IS NOT NULL THEN
          LEFT(
            FORMAT(
              '이날에는 %s개의 대화를 나눴어요. 주로 "%s" 같은 이야기를 남겼어요.',
              user_rollups.session_count,
              user_rollups.combined_snippets
            ),
            2000
          )
        ELSE
          FORMAT(
            '이날에는 %s개의 대화를 나눴어요. 대화 제목은 %s였어요.',
            user_rollups.session_count,
            COALESCE(user_rollups.session_titles, '기록된 대화')
          )
      END,
      jsonb_build_object(
        'source', 'daily_conversation_summary',
        'sessionCount', user_rollups.session_count,
        'sessionTitles', COALESCE(user_rollups.session_titles, ''),
        'generatedAt', timezone('utc', now())
      )
    FROM user_rollups
    RETURNING 1
  )
  SELECT
    COALESCE((SELECT total_users FROM rollup_counts), 0),
    COUNT(*)::integer
  INTO v_processed_users, v_inserted_rows
  FROM inserted;

  RETURN QUERY
  SELECT
    v_target_date,
    COALESCE(v_processed_users, 0),
    COALESCE(v_inserted_rows, 0);
END;
$$;

COMMENT ON FUNCTION public.generate_daily_conversation_summaries(date)
IS 'Generates one ai_summary calendar log per user for the target KST date from that day''s chat sessions.';
