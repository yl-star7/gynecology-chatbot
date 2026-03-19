CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE SCHEMA IF NOT EXISTS content;
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  phone_number varchar(20) NOT NULL UNIQUE,
  account_status text NOT NULL DEFAULT 'active' CHECK (
    account_status IN ('active', 'paused', 'deleted', 'pending_recovery')
  ),
  phone_verified_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.pregnancy_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users (id) ON DELETE CASCADE,
  display_name varchar(100),
  pregnancy_status text NOT NULL CHECK (pregnancy_status IN ('pregnant', 'trying', 'general')),
  pregnancy_day_count integer NOT NULL DEFAULT 0,
  pregnancy_week integer,
  pregnancy_day_in_week integer,
  due_date date,
  onboarding_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  baby_sex text CHECK (baby_sex IN ('male', 'female', 'unknown') OR baby_sex IS NULL),
  baby_nickname varchar(80),
  theme_key varchar(40),
  notification_time time,
  notification_enabled boolean NOT NULL DEFAULT true,
  week_override integer,
  day_override integer,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

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

CREATE TABLE IF NOT EXISTS public.phone_verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number varchar(20) NOT NULL,
  verification_sid varchar(100),
  channel text NOT NULL DEFAULT 'sms' CHECK (channel IN ('sms', 'voice', 'whatsapp')),
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'expired', 'canceled', 'failed')
  ),
  attempt_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.allowed_phone_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number varchar(20) NOT NULL UNIQUE,
  display_name varchar(100),
  note text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  title varchar(200) NOT NULL DEFAULT '새 대화',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  last_message_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.chat_sessions (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  parts jsonb NOT NULL DEFAULT '[]'::jsonb,
  plain_text text NOT NULL DEFAULT '',
  image_attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  model_name varchar(100),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.calendar_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.chat_sessions (id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.chat_messages (id) ON DELETE SET NULL,
  date date NOT NULL,
  entry_type text NOT NULL CHECK (
    entry_type IN ('chat_saved', 'symptom_note', 'ai_summary', 'emotion_checkin')
  ),
  title varchar(200) NOT NULL,
  summary text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS content.knowledge_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(120) NOT NULL UNIQUE,
  section text NOT NULL CHECK (section IN ('knowledge', 'notebook')),
  title varchar(200) NOT NULL,
  body text NOT NULL,
  card_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.message_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages (id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (
    target_type IN (
      'knowledge_item',
      'pregnancy_week',
      'pregnancy_document',
      'week_data',
      'week_checklist',
      'week_question',
      'external'
    )
  ),
  target_id uuid,
  target_path text,
  target_section text NOT NULL CHECK (target_section IN ('knowledge', 'notebook')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS content.pregnancy_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(500) NOT NULL,
  content text NOT NULL,
  pregnancy_week integer,
  category varchar(100) NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS content.pregnancy_week_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number integer NOT NULL UNIQUE,
  title varchar(200),
  baby_size_label varchar(120),
  baby_size_compare_object varchar(120),
  baby_summary text,
  mother_summary text,
  warning_signs text,
  recommended_actions text,
  checklist_intro text,
  question_intro text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT pregnancy_week_data_week_number_range CHECK (week_number BETWEEN 1 AND 40)
);

CREATE TABLE IF NOT EXISTS content.week_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_data_id uuid NOT NULL REFERENCES content.pregnancy_week_data (id) ON DELETE CASCADE,
  code varchar(120) NOT NULL,
  title varchar(200) NOT NULL,
  description text,
  checklist_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  display_order integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (week_data_id, code)
);

CREATE TABLE IF NOT EXISTS content.week_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_data_id uuid NOT NULL REFERENCES content.pregnancy_week_data (id) ON DELETE CASCADE,
  code varchar(120) NOT NULL,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'text' CHECK (
    question_type IN ('text', 'single_choice', 'multi_choice', 'yes_no', 'number')
  ),
  help_text text,
  question_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  display_order integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (week_data_id, code)
);

CREATE TABLE IF NOT EXISTS public.user_checklist_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  checklist_id uuid NOT NULL REFERENCES content.week_checklists (id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.chat_sessions (id) ON DELETE SET NULL,
  prompt_message_id uuid REFERENCES public.chat_messages (id) ON DELETE SET NULL,
  completion_message_id uuid REFERENCES public.chat_messages (id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'completed', 'skipped')),
  sent_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.user_question_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES content.week_questions (id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.chat_sessions (id) ON DELETE SET NULL,
  prompt_message_id uuid REFERENCES public.chat_messages (id) ON DELETE SET NULL,
  answer_message_id uuid REFERENCES public.chat_messages (id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'answered', 'skipped')),
  sent_at timestamptz,
  answered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  target_user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  action_type text NOT NULL CHECK (
    action_type IN ('phone_change', 'login_id_change', 'session_reset', 'content_update', 'knowledge_publish')
  ),
  entity_type text NOT NULL,
  entity_id uuid,
  reason text NOT NULL,
  before_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  after_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.user_action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.chat_sessions (id) ON DELETE SET NULL,
  message_id uuid REFERENCES public.chat_messages (id) ON DELETE SET NULL,
  action_type text NOT NULL CHECK (
    action_type IN ('login_succeeded', 'phone_verification_started', 'phone_verified', 'onboarding_completed', 'profile_updated', 'chat_message_sent')
  ),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.workflow_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  provider text NOT NULL DEFAULT 'managed',
  status text NOT NULL DEFAULT 'draft',
  is_active boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_last_message
  ON public.chat_sessions (user_id, last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created
  ON public.chat_messages (session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created
  ON public.chat_messages (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_logs_user_date
  ON public.calendar_logs (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_logs_session_date
  ON public.calendar_logs (session_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_message_links_message
  ON public.message_links (message_id);
CREATE INDEX IF NOT EXISTS idx_message_links_target_type
  ON public.message_links (target_type);
CREATE INDEX IF NOT EXISTS idx_pregnancy_documents_week
  ON content.pregnancy_documents (pregnancy_week);
CREATE INDEX IF NOT EXISTS idx_pregnancy_documents_category
  ON content.pregnancy_documents (category);
CREATE INDEX IF NOT EXISTS idx_pregnancy_documents_embedding
  ON content.pregnancy_documents
  USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_created
  ON public.admin_audit_logs (admin_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_created
  ON public.admin_audit_logs (target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_action_logs_user_occurred
  ON public.user_action_logs (user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_action_logs_action_occurred
  ON public.user_action_logs (action_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_action_logs_session_occurred
  ON public.user_action_logs (session_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION public.match_pregnancy_documents(
  query_embedding vector(1536),
  current_week integer DEFAULT NULL,
  match_count integer DEFAULT 8
)
RETURNS TABLE (
  id uuid,
  title varchar,
  content text,
  pregnancy_week integer,
  category varchar,
  metadata jsonb,
  similarity double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    pd.id,
    pd.title,
    pd.content,
    pd.pregnancy_week,
    pd.category,
    pd.metadata,
    1 - (pd.embedding <=> query_embedding) AS similarity
  FROM content.pregnancy_documents pd
  WHERE (
    current_week IS NULL
    OR pd.pregnancy_week IS NULL
    OR pd.pregnancy_week BETWEEN current_week - 1 AND current_week + 1
  )
  ORDER BY pd.embedding <=> query_embedding
  LIMIT GREATEST(match_count, 1);
$$;
