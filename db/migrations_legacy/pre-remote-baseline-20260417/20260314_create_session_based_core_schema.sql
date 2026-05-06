CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  phone_number varchar(20) NOT NULL UNIQUE,
  display_name varchar(100) NOT NULL,
  account_status text NOT NULL DEFAULT 'active' CHECK (
    account_status IN ('active', 'paused', 'deleted', 'pending_recovery')
  ),
  password_set_at timestamptz,
  phone_verified_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.pregnancy_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users (id) ON DELETE CASCADE,
  pregnancy_status text NOT NULL CHECK (pregnancy_status IN ('pregnant', 'trying', 'general')),
  pregnancy_day_count integer NOT NULL DEFAULT 0,
  pregnancy_week integer,
  pregnancy_day_in_week integer,
  due_date date,
  onboarding_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  title varchar(200) NOT NULL DEFAULT '새 대화',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  last_message_at timestamptz,
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

CREATE TABLE IF NOT EXISTS public.emotion_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  date date NOT NULL,
  emotion_tone text NOT NULL CHECK (emotion_tone IN ('calm', 'joyful', 'anxious', 'tired', 'sad')),
  note text,
  source text NOT NULL CHECK (source IN ('manual', 'chat_inferred', 'survey')),
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

CREATE TABLE IF NOT EXISTS public.knowledge_items (
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
  knowledge_item_id uuid NOT NULL REFERENCES public.knowledge_items (id) ON DELETE CASCADE,
  target_section text NOT NULL CHECK (target_section IN ('knowledge', 'notebook')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.pregnancy_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(500) NOT NULL,
  content text NOT NULL,
  pregnancy_week integer,
  category varchar(100) NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  target_user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  action_type text NOT NULL CHECK (
    action_type IN (
      'phone_change',
      'login_id_change',
      'password_reset',
      'content_update',
      'knowledge_publish'
    )
  ),
  entity_type text NOT NULL,
  entity_id uuid,
  reason text NOT NULL,
  before_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  after_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_last_message
  ON public.chat_sessions (user_id, last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created
  ON public.chat_messages (session_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created
  ON public.chat_messages (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_emotion_logs_user_date
  ON public.emotion_logs (user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_calendar_logs_user_date
  ON public.calendar_logs (user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_calendar_logs_session_date
  ON public.calendar_logs (session_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_knowledge_items_section_status
  ON public.knowledge_items (section, status);

CREATE INDEX IF NOT EXISTS idx_message_links_message
  ON public.message_links (message_id);

CREATE INDEX IF NOT EXISTS idx_pregnancy_documents_week
  ON public.pregnancy_documents (pregnancy_week);

CREATE INDEX IF NOT EXISTS idx_pregnancy_documents_category
  ON public.pregnancy_documents (category);

CREATE INDEX IF NOT EXISTS idx_pregnancy_documents_embedding
  ON public.pregnancy_documents
  USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_created
  ON public.admin_audit_logs (admin_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_created
  ON public.admin_audit_logs (target_user_id, created_at DESC);

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
  FROM public.pregnancy_documents pd
  WHERE (
    current_week IS NULL
    OR pd.pregnancy_week IS NULL
    OR pd.pregnancy_week BETWEEN current_week - 1 AND current_week + 1
  )
  ORDER BY pd.embedding <=> query_embedding
  LIMIT GREATEST(match_count, 1);
$$;
