-- calendar_logs.session_id를 nullable로 변경 (cron 요약은 세션 없이 insert)
ALTER TABLE public.calendar_logs ALTER COLUMN session_id DROP NOT NULL;

-- 체크리스트/질문 이벤트에 답변 텍스트 직접 저장 (cron 요약용)
ALTER TABLE public.user_checklist_events
  ADD COLUMN IF NOT EXISTS answer_text text;

ALTER TABLE public.user_question_events
  ADD COLUMN IF NOT EXISTS answer_text text;

COMMENT ON COLUMN public.user_checklist_events.answer_text IS '사용자가 quick reply로 응답한 텍스트 (예: "다리 올려놓기 했어요")';
COMMENT ON COLUMN public.user_question_events.answer_text IS '사용자가 quick reply로 응답한 텍스트 (예: "괜찮아요")';

-- calendar_logs entry_type에 question_summary 추가
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
      'question_summary',
      'emotion_checkin',
      'survey_response',
      'today_info_view'
    )
  );
