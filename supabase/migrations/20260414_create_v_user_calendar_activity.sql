-- 캘린더 활동을 실시간으로 집계하는 view
-- calendar_logs에만 의존하던 기존 방식 대신, 원본 테이블에서 직접 읽는다.

CREATE OR REPLACE VIEW public.v_user_calendar_activity AS

-- 1) 대화 활동: chat_sessions에 메시지가 있는 날짜
SELECT
  cs.user_id,
  DATE(cm.created_at AT TIME ZONE 'Asia/Seoul') AS date,
  'chat' AS entry_type,
  cs.title AS summary
FROM public.chat_sessions cs
JOIN public.chat_messages cm ON cm.session_id = cs.id
WHERE cm.role = 'user'
GROUP BY cs.user_id, DATE(cm.created_at AT TIME ZONE 'Asia/Seoul'), cs.title

UNION ALL

-- 2) 체크리스트 완료
SELECT
  uce.user_id,
  DATE(uce.completed_at AT TIME ZONE 'Asia/Seoul') AS date,
  'checklist' AS entry_type,
  NULL AS summary
FROM public.user_checklist_events uce
WHERE uce.status = 'completed' AND uce.completed_at IS NOT NULL

UNION ALL

-- 3) 질문 응답
SELECT
  uqe.user_id,
  DATE(uqe.answered_at AT TIME ZONE 'Asia/Seoul') AS date,
  'question' AS entry_type,
  NULL AS summary
FROM public.user_question_events uqe
WHERE uqe.status = 'answered' AND uqe.answered_at IS NOT NULL

UNION ALL

-- 4) 감정 체크인
SELECT
  el.user_id,
  el.date,
  'emotion' AS entry_type,
  el.emotion_tone AS summary
FROM public.emotion_logs el

UNION ALL

-- 5) 기존 calendar_logs (ai_summary, today_info_view 등 cron 생성 데이터)
SELECT
  cl.user_id,
  cl.date,
  cl.entry_type,
  cl.summary
FROM public.calendar_logs cl;

COMMENT ON VIEW public.v_user_calendar_activity IS '캘린더에 활동이 있었던 날짜를 실시간으로 집계하는 view';
