CREATE SCHEMA IF NOT EXISTS content;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_id_users_id_fk;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_id_fkey;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active';

ALTER TABLE public.pregnancy_profiles
  ADD COLUMN IF NOT EXISTS display_name varchar(100);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'display_name'
  ) THEN
    EXECUTE $sql$
      UPDATE public.pregnancy_profiles pp
      SET display_name = u.display_name
      FROM public.users u
      WHERE pp.user_id = u.id
        AND pp.display_name IS NULL
        AND u.display_name IS NOT NULL
    $sql$;
  END IF;
END $$;

ALTER TABLE public.users
  DROP COLUMN IF EXISTS display_name,
  DROP COLUMN IF EXISTS password_hash,
  DROP COLUMN IF EXISTS password_set_at;

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
  ON public.auth_sessions (user_id, last_used_at DESC);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at
  ON public.auth_sessions (expires_at);

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

CREATE INDEX IF NOT EXISTS idx_phone_verification_requests_phone_created
  ON public.phone_verification_requests (phone_number, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_phone_verification_requests_status_created
  ON public.phone_verification_requests (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.allowed_phone_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number varchar(20) NOT NULL UNIQUE,
  display_name varchar(100),
  note text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_allowed_phone_numbers_phone_number
  ON public.allowed_phone_numbers (phone_number);

DROP TABLE IF EXISTS public.emotion_logs;

ALTER TABLE public.message_links
  ADD COLUMN IF NOT EXISTS target_type text,
  ADD COLUMN IF NOT EXISTS target_id uuid,
  ADD COLUMN IF NOT EXISTS target_path text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'message_links'
      AND column_name = 'knowledge_item_id'
  ) THEN
    EXECUTE $sql$
      UPDATE public.message_links
      SET
        target_type = COALESCE(target_type, 'knowledge_item'),
        target_id = COALESCE(target_id, knowledge_item_id)
      WHERE knowledge_item_id IS NOT NULL
    $sql$;
  END IF;
END $$;

ALTER TABLE public.message_links
  ALTER COLUMN target_type SET DEFAULT 'knowledge_item';

UPDATE public.message_links
SET target_type = 'knowledge_item'
WHERE target_type IS NULL;

ALTER TABLE public.message_links
  ALTER COLUMN target_type SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'message_links'
      AND constraint_name = 'message_links_knowledge_item_id_knowledge_items_id_fk'
  ) THEN
    ALTER TABLE public.message_links
      DROP CONSTRAINT message_links_knowledge_item_id_knowledge_items_id_fk;
  END IF;
END $$;

ALTER TABLE public.message_links
  DROP COLUMN IF EXISTS knowledge_item_id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'message_links_target_type_check'
  ) THEN
    ALTER TABLE public.message_links
      ADD CONSTRAINT message_links_target_type_check
      CHECK (target_type IN ('knowledge_item', 'pregnancy_week', 'pregnancy_document', 'external'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_message_links_target_type
  ON public.message_links (target_type);

ALTER TABLE IF EXISTS public.knowledge_items SET SCHEMA content;
ALTER TABLE IF EXISTS public.pregnancy_documents SET SCHEMA content;
ALTER TABLE IF EXISTS public.pregnancy_weeks SET SCHEMA content;
ALTER TABLE IF EXISTS public.pregnancy_week_sections SET SCHEMA content;
ALTER TABLE IF EXISTS public.pregnancy_week_assets SET SCHEMA content;

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

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'admin_audit_logs_action_type_check'
      AND conrelid = 'public.admin_audit_logs'::regclass
  ) THEN
    ALTER TABLE public.admin_audit_logs
      DROP CONSTRAINT admin_audit_logs_action_type_check;
  END IF;
END $$;

ALTER TABLE public.admin_audit_logs
  ADD CONSTRAINT admin_audit_logs_action_type_check
  CHECK (action_type IN ('phone_change', 'login_id_change', 'session_reset', 'content_update', 'knowledge_publish'));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_action_logs_action_type_check'
      AND conrelid = 'public.user_action_logs'::regclass
  ) THEN
    ALTER TABLE public.user_action_logs
      DROP CONSTRAINT user_action_logs_action_type_check;
  END IF;
END $$;

ALTER TABLE public.user_action_logs
  ADD CONSTRAINT user_action_logs_action_type_check
  CHECK (action_type IN (
    'login_succeeded',
    'phone_verification_started',
    'phone_verified',
    'onboarding_completed',
    'profile_updated',
    'chat_message_sent'
  ));
