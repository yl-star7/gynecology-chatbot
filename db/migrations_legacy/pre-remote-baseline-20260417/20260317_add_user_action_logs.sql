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
