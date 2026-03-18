CREATE TABLE IF NOT EXISTS public.user_action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.chat_sessions (id) ON DELETE SET NULL,
  message_id uuid REFERENCES public.chat_messages (id) ON DELETE SET NULL,
  action_type text NOT NULL CHECK (
    action_type IN (
      'login_succeeded',
      'phone_verification_started',
      'phone_verified',
      'password_set',
      'password_reset_requested',
      'onboarding_completed',
      'profile_updated',
      'chat_message_sent'
    )
  ),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_user_action_logs_user_occurred
  ON public.user_action_logs (user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_action_logs_action_occurred
  ON public.user_action_logs (action_type, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_action_logs_session_occurred
  ON public.user_action_logs (session_id, occurred_at DESC);

ALTER TABLE public.user_action_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_action_logs_user_select ON public.user_action_logs;
CREATE POLICY user_action_logs_user_select
ON public.user_action_logs
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_action_logs_user_insert ON public.user_action_logs;
CREATE POLICY user_action_logs_user_insert
ON public.user_action_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_action_logs_admin_access ON public.user_action_logs;
CREATE POLICY user_action_logs_admin_access
ON public.user_action_logs
FOR ALL
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());
