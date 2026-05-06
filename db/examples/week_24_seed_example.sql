-- Sample seed for week-based content and user event logs
-- Scope:
--   content.pregnancy_week_data
--   content.week_checklists
--   content.week_questions
--   public.user_checklist_events
--   public.user_question_events

BEGIN;

-- 1) Fill in week 24 core content
UPDATE content.pregnancy_week_data
SET
  title = '24주차 몸 상태 점검',
  baby_size_label = '옥수수',
  baby_size_compare_object = '길쭉한 옥수수 한 개',
  baby_summary = '청각 반응이 더 또렷해지고 수면-각성 패턴이 조금씩 드러날 수 있습니다.',
  mother_summary = '배뭉침, 피로감, 수면 불편이 자주 느껴질 수 있어 생활 패턴 점검이 중요합니다.',
  warning_signs = '규칙적인 수축, 선명한 출혈, 맑은 액체 유출, 태동 급감이 있으면 바로 진료가 필요합니다.',
  recommended_actions = '수분 섭취, 휴식, 수축 간격 기록, 증상 지속 시 병원 연락을 우선합니다.',
  checklist_intro = '이번 주에는 몸 상태와 생활 패턴을 짧게 점검하는 체크리스트를 먼저 보냅니다.',
  question_intro = '체크리스트 후에는 증상과 걱정을 더 구체적으로 확인하는 질문을 보냅니다.',
  status = 'published',
  updated_at = timezone('utc', now())
WHERE week_number = 24;

-- 2) Define week 24 checklists
WITH week_data AS (
  SELECT id
  FROM content.pregnancy_week_data
  WHERE week_number = 24
)
INSERT INTO content.week_checklists (
  week_data_id,
  day_number,
  code,
  title,
  description,
  checklist_payload,
  display_order,
  is_required,
  is_active,
  updated_at
)
SELECT
  week_data.id,
  payload.day_number,
  payload.code,
  payload.title,
  payload.description,
  payload.checklist_payload,
  payload.display_order,
  payload.is_required,
  true,
  timezone('utc', now())
FROM week_data
CROSS JOIN (
  VALUES
    (
      1,
      'uterine-tightening',
      '배뭉침 체크',
      '오늘 배가 단단해지는 느낌이 있었는지 확인합니다.',
      '{"items":[{"id":"had-tightening","label":"배뭉침이 있었다"},{"id":"regular-pattern","label":"규칙적으로 반복됐다"},{"id":"rest-improved","label":"쉬면 줄어들었다"}]}'::jsonb,
      1,
      true
    ),
    (
      3,
      'fluid-and-rest',
      '수분과 휴식 체크',
      '오늘 수분 섭취와 휴식 시간이 충분했는지 점검합니다.',
      '{"items":[{"id":"water-intake","label":"물을 자주 마셨다"},{"id":"rest-time","label":"중간중간 쉬었다"},{"id":"sleep-quality","label":"수면이 크게 깨지지 않았다"}]}'::jsonb,
      2,
      false
    ),
    (
      5,
      'movement-awareness',
      '태동/몸 상태 체크',
      '태동과 몸의 불편 신호를 함께 점검합니다.',
      '{"items":[{"id":"movement-noticed","label":"태동을 느꼈다"},{"id":"pain-increase","label":"통증이 점점 심해졌다"},{"id":"bleeding-none","label":"출혈은 없었다"}]}'::jsonb,
      3,
      true
    )
) AS payload(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE
SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload,
  display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active,
  updated_at = EXCLUDED.updated_at;

-- 3) Define week 24 questions
WITH week_data AS (
  SELECT id
  FROM content.pregnancy_week_data
  WHERE week_number = 24
)
INSERT INTO content.week_questions (
  week_data_id,
  day_number,
  code,
  question_text,
  question_type,
  help_text,
  question_payload,
  display_order,
  is_required,
  is_active,
  updated_at
)
SELECT
  week_data.id,
  payload.day_number,
  payload.code,
  payload.question_text,
  payload.question_type,
  payload.help_text,
  payload.question_payload,
  payload.display_order,
  payload.is_required,
  true,
  timezone('utc', now())
FROM week_data
CROSS JOIN (
  VALUES
    (
      2,
      'main-concern',
      '오늘 가장 걱정되는 증상은 무엇인가요?',
      'text',
      '배뭉침, 통증, 분비물, 수면 문제 등 자유롭게 적어주세요.',
      '{}'::jsonb,
      1,
      true
    ),
    (
      4,
      'tightening-frequency',
      '배뭉침이 있었다면 몇 번 정도 반복됐나요?',
      'single_choice',
      '대략적인 횟수만 골라도 됩니다.',
      '{"choices":[{"id":"none","label":"없음"},{"id":"1-2","label":"1~2번"},{"id":"3-5","label":"3~5번"},{"id":"5+","label":"5번 이상"}]}'::jsonb,
      2,
      false
    ),
    (
      6,
      'visit-needed',
      '지금 바로 병원에 연락해야 할 정도로 느껴지나요?',
      'yes_no',
      '직감적으로 불안하면 예를 선택하세요.',
      '{"yesLabel":"예","noLabel":"아니오"}'::jsonb,
      3,
      true
    )
) AS payload(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE
SET
  question_text = EXCLUDED.question_text,
  question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text,
  question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active,
  updated_at = EXCLUDED.updated_at;

-- 4) Example: mark that a checklist prompt was sent to a user
-- Replace the phone number or user lookup as needed.
WITH target_user AS (
  SELECT id
  FROM public.users
  WHERE phone_number = '+821012345678'
  LIMIT 1
),
target_checklist AS (
  SELECT wc.id
  FROM content.week_checklists wc
  JOIN content.pregnancy_week_data wd ON wd.id = wc.week_data_id
  WHERE wd.week_number = 24
    AND wc.code = 'uterine-tightening'
  LIMIT 1
),
target_session AS (
  SELECT id
  FROM public.chat_sessions
  WHERE user_id = (SELECT id FROM target_user)
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO public.user_checklist_events (
  user_id,
  checklist_id,
  session_id,
  status,
  sent_at,
  updated_at
)
SELECT
  target_user.id,
  target_checklist.id,
  target_session.id,
  'sent',
  timezone('utc', now()),
  timezone('utc', now())
FROM target_user, target_checklist, target_session;

-- 5) Example: mark that a question was sent and later answered in chat
WITH target_user AS (
  SELECT id
  FROM public.users
  WHERE phone_number = '+821012345678'
  LIMIT 1
),
target_question AS (
  SELECT wq.id
  FROM content.week_questions wq
  JOIN content.pregnancy_week_data wd ON wd.id = wq.week_data_id
  WHERE wd.week_number = 24
    AND wq.code = 'main-concern'
  LIMIT 1
),
target_session AS (
  SELECT id
  FROM public.chat_sessions
  WHERE user_id = (SELECT id FROM target_user)
  ORDER BY created_at DESC
  LIMIT 1
),
prompt_message AS (
  SELECT id
  FROM public.chat_messages
  WHERE session_id = (SELECT id FROM target_session)
    AND role = 'assistant'
  ORDER BY created_at DESC
  LIMIT 1
),
answer_message AS (
  SELECT id
  FROM public.chat_messages
  WHERE session_id = (SELECT id FROM target_session)
    AND role = 'user'
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO public.user_question_events (
  user_id,
  question_id,
  session_id,
  prompt_message_id,
  answer_message_id,
  status,
  sent_at,
  answered_at,
  updated_at
)
SELECT
  target_user.id,
  target_question.id,
  target_session.id,
  prompt_message.id,
  answer_message.id,
  'answered',
  timezone('utc', now()) - interval '10 minutes',
  timezone('utc', now()),
  timezone('utc', now())
FROM target_user, target_question, target_session, prompt_message, answer_message;

COMMIT;
