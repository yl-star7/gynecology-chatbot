ALTER TABLE public.chat_sessions
ADD COLUMN IF NOT EXISTS memory_payload jsonb NOT NULL DEFAULT '{}'::jsonb;
