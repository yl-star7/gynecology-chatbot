-- pg_net 확장 활성화.
-- pg_cron의 mobile-daily-conversation-summary 잡이 net.http_post를 호출하는데
-- pg_net 확장이 미설치 상태라 "schema 'net' does not exist" 에러로 매일 실패하고 있음.
-- 프로덕션 cron.job_run_details 로그 확인: 2026-04-12 ~ 2026-04-16 전부 failed.

CREATE EXTENSION IF NOT EXISTS pg_net;
