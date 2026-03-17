CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
  );
$$;

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

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_pregnancy_profiles_updated_at ON public.pregnancy_profiles;
CREATE TRIGGER trg_pregnancy_profiles_updated_at
BEFORE UPDATE ON public.pregnancy_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER trg_chat_sessions_updated_at
BEFORE UPDATE ON public.chat_sessions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_knowledge_items_updated_at ON public.knowledge_items;
CREATE TRIGGER trg_knowledge_items_updated_at
BEFORE UPDATE ON public.knowledge_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.touch_chat_session_last_message()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.chat_sessions
  SET last_message_at = NEW.created_at,
      updated_at = timezone('utc', now())
  WHERE id = NEW.session_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_chat_messages_touch_session ON public.chat_messages;
CREATE TRIGGER trg_chat_messages_touch_session
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.touch_chat_session_last_message();

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pregnancy_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emotion_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pregnancy_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_self_select ON public.users;
CREATE POLICY users_self_select
ON public.users
FOR SELECT
USING (auth.uid() = id OR public.is_admin_user());

DROP POLICY IF EXISTS users_self_update ON public.users;
CREATE POLICY users_self_update
ON public.users
FOR UPDATE
USING (auth.uid() = id OR public.is_admin_user())
WITH CHECK (auth.uid() = id OR public.is_admin_user());

DROP POLICY IF EXISTS pregnancy_profiles_owner_access ON public.pregnancy_profiles;
CREATE POLICY pregnancy_profiles_owner_access
ON public.pregnancy_profiles
FOR ALL
USING (auth.uid() = user_id OR public.is_admin_user())
WITH CHECK (auth.uid() = user_id OR public.is_admin_user());

DROP POLICY IF EXISTS chat_sessions_owner_access ON public.chat_sessions;
CREATE POLICY chat_sessions_owner_access
ON public.chat_sessions
FOR ALL
USING (auth.uid() = user_id OR public.is_admin_user())
WITH CHECK (auth.uid() = user_id OR public.is_admin_user());

DROP POLICY IF EXISTS chat_messages_owner_access ON public.chat_messages;
CREATE POLICY chat_messages_owner_access
ON public.chat_messages
FOR ALL
USING (auth.uid() = user_id OR public.is_admin_user())
WITH CHECK (auth.uid() = user_id OR public.is_admin_user());

DROP POLICY IF EXISTS emotion_logs_owner_access ON public.emotion_logs;
CREATE POLICY emotion_logs_owner_access
ON public.emotion_logs
FOR ALL
USING (auth.uid() = user_id OR public.is_admin_user())
WITH CHECK (auth.uid() = user_id OR public.is_admin_user());

DROP POLICY IF EXISTS calendar_logs_owner_access ON public.calendar_logs;
CREATE POLICY calendar_logs_owner_access
ON public.calendar_logs
FOR ALL
USING (auth.uid() = user_id OR public.is_admin_user())
WITH CHECK (auth.uid() = user_id OR public.is_admin_user());

DROP POLICY IF EXISTS knowledge_items_published_select ON public.knowledge_items;
CREATE POLICY knowledge_items_published_select
ON public.knowledge_items
FOR SELECT
USING (status = 'published' OR public.is_admin_user());

DROP POLICY IF EXISTS knowledge_items_admin_write ON public.knowledge_items;
CREATE POLICY knowledge_items_admin_write
ON public.knowledge_items
FOR ALL
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS message_links_owner_select ON public.message_links;
CREATE POLICY message_links_owner_select
ON public.message_links
FOR SELECT
USING (
  public.is_admin_user()
  OR EXISTS (
    SELECT 1
    FROM public.chat_messages cm
    JOIN public.chat_sessions cs ON cs.id = cm.session_id
    WHERE cm.id = message_id
      AND cs.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS message_links_admin_write ON public.message_links;
CREATE POLICY message_links_admin_write
ON public.message_links
FOR ALL
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS pregnancy_documents_admin_select ON public.pregnancy_documents;
CREATE POLICY pregnancy_documents_admin_select
ON public.pregnancy_documents
FOR SELECT
USING (public.is_admin_user());

DROP POLICY IF EXISTS pregnancy_documents_admin_write ON public.pregnancy_documents;
CREATE POLICY pregnancy_documents_admin_write
ON public.pregnancy_documents
FOR ALL
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS admin_audit_logs_admin_access ON public.admin_audit_logs;
CREATE POLICY admin_audit_logs_admin_access
ON public.admin_audit_logs
FOR ALL
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

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
