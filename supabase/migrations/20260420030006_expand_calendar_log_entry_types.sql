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
      'today_info_view',
      'survey_response',
      'question_summary'
    )
  );
