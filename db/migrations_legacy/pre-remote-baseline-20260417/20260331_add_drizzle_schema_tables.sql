-- Add Drizzle schema tables
-- Based on packages/db/src/schema.ts

BEGIN;

-- ============ Users ============
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL DEFAULT 'user',
  phone_number_encrypted text NOT NULL,
  phone_number_blind_index text NOT NULL,
  phone_number_last4 varchar(4) NOT NULL,
  account_status text NOT NULL DEFAULT 'active',
  phone_verified_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'super_admin')),
  CONSTRAINT users_account_status_check CHECK (account_status IN ('active', 'paused', 'deleted', 'pending_recovery'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_number_blind_index
  ON public.users (phone_number_blind_index);

-- ============ Pregnancy Profiles ============
CREATE TABLE IF NOT EXISTS public.pregnancy_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  display_name varchar(100),
  pregnancy_status text NOT NULL,
  pregnancy_day_count integer NOT NULL DEFAULT 0,
  pregnancy_week integer,
  pregnancy_day_in_week integer,
  due_date date,
  onboarding_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  baby_sex text,
  baby_nickname varchar(80),
  theme_key varchar(40),
  notification_time time,
  notification_enabled boolean NOT NULL DEFAULT true,
  week_override integer,
  day_override integer,
  push_token text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT pregnancy_profiles_status_check CHECK (pregnancy_status IN ('pregnant', 'trying', 'general')),
  CONSTRAINT pregnancy_profiles_baby_sex_check CHECK (baby_sex IS NULL OR baby_sex IN ('male', 'female', 'unknown'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pregnancy_profiles_user_id
  ON public.pregnancy_profiles (user_id);

-- ============ Auth Sessions ============
CREATE TABLE IF NOT EXISTS public.auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL,
  device_label varchar(120),
  last_used_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_last_used
  ON public.auth_sessions (user_id, last_used_at);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at
  ON public.auth_sessions (expires_at);

-- ============ Phone Verification Requests ============
CREATE TABLE IF NOT EXISTS public.phone_verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number_encrypted text NOT NULL,
  phone_number_blind_index text NOT NULL,
  phone_number_last4 varchar(4) NOT NULL,
  verification_sid varchar(100),
  channel text NOT NULL DEFAULT 'sms',
  status text NOT NULL DEFAULT 'pending',
  attempt_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT phone_verification_requests_channel_check CHECK (channel IN ('sms', 'voice', 'whatsapp')),
  CONSTRAINT phone_verification_requests_status_check CHECK (status IN ('pending', 'approved', 'expired', 'canceled', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_phone_verification_requests_phone_created
  ON public.phone_verification_requests (phone_number_blind_index, created_at);

CREATE INDEX IF NOT EXISTS idx_phone_verification_requests_status_created
  ON public.phone_verification_requests (status, created_at);

-- ============ Chat Sessions ============
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  title varchar(200) NOT NULL DEFAULT '새 대화',
  status text NOT NULL DEFAULT 'active',
  last_message_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT chat_sessions_status_check CHECK (status IN ('active', 'archived', 'deleted'))
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_last_message
  ON public.chat_sessions (user_id, last_message_at);

-- ============ Chat Messages ============
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.chat_sessions (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  role text NOT NULL,
  parts jsonb NOT NULL DEFAULT '[]'::jsonb,
  plain_text text NOT NULL DEFAULT '',
  image_attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  model_name varchar(100),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT chat_messages_role_check CHECK (role IN ('user', 'assistant', 'system'))
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created
  ON public.chat_messages (session_id, created_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created
  ON public.chat_messages (user_id, created_at);

-- ============ Calendar Logs ============
CREATE TABLE IF NOT EXISTS public.calendar_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.chat_sessions (id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.chat_messages (id) ON DELETE SET NULL,
  date date NOT NULL,
  entry_type text NOT NULL,
  title varchar(200) NOT NULL,
  summary text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT calendar_logs_entry_type_check CHECK (entry_type IN ('chat_saved', 'symptom_note', 'ai_summary', 'emotion_checkin'))
);

CREATE INDEX IF NOT EXISTS idx_calendar_logs_user_date
  ON public.calendar_logs (user_id, date);

CREATE INDEX IF NOT EXISTS idx_calendar_logs_session_date
  ON public.calendar_logs (session_id, date);

-- ============ Message Links ============
CREATE TABLE IF NOT EXISTS public.message_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages (id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id uuid,
  target_path text,
  target_section text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT message_links_target_section_check CHECK (target_section IN ('knowledge', 'notebook')),
  CONSTRAINT message_links_target_type_check CHECK (target_type IN ('knowledge_item', 'pregnancy_week', 'pregnancy_document', 'week_data', 'week_checklist', 'week_question', 'external'))
);

CREATE INDEX IF NOT EXISTS idx_message_links_message
  ON public.message_links (message_id);

CREATE INDEX IF NOT EXISTS idx_message_links_target_type
  ON public.message_links (target_type);

COMMIT;
