ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_account_status_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_account_status_check
  CHECK (account_status IN ('active', 'paused', 'deleted', 'pending_recovery', 'pending_approval'));

INSERT INTO public.system_config (key, value, updated_at)
VALUES ('mobile_approval_policy', '{"requireApproval": true}'::jsonb, now())
ON CONFLICT (key) DO NOTHING;
