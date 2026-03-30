-- pg_cron 설정 (Supabase Dashboard > SQL Editor에서 실행)
-- 참고: pg_cron은 Supabase Pro 플랜 이상에서 사용 가능

-- 1. pg_cron 및 pg_net 확장 활성화
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. 매일 아침 9시에 daily_check 트리거
SELECT cron.schedule(
  'proactive-daily-check',           -- job name
  '0 9 * * *',                        -- cron: 매일 09:00 (UTC 기준, KST는 0 0 * * *)
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/proactive-chat',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY'
    ),
    body := jsonb_build_object('triggerId', 'daily_check')
  );
  $$
);

-- 3. 매주 월요일 10시에 weekly_milestone 트리거
SELECT cron.schedule(
  'proactive-weekly-milestone',
  '0 10 * * 1',                       -- 매주 월요일 10:00
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/proactive-chat',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY'
    ),
    body := jsonb_build_object('triggerId', 'weekly_milestone')
  );
  $$
);

-- 4. 매일 저녁 6시에 checkup_reminder 트리거
SELECT cron.schedule(
  'proactive-checkup-reminder',
  '0 18 * * *',                       -- 매일 18:00
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/proactive-chat',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY'
    ),
    body := jsonb_build_object('triggerId', 'checkup_reminder')
  );
  $$
);

-- 5. 매일 정오(KST)에 전날 대화 요약 생성 (Edge Function으로 AI 요약)
-- pg_cron 기본 시간대가 UTC라면 KST 12:00는 UTC 03:00 입니다.
SELECT cron.schedule(
  'mobile-daily-conversation-summary',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-summary',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 스케줄된 job 확인
SELECT * FROM cron.job;

-- job 삭제하려면:
-- SELECT cron.unschedule('proactive-daily-check');
-- SELECT cron.unschedule('mobile-daily-conversation-summary');
