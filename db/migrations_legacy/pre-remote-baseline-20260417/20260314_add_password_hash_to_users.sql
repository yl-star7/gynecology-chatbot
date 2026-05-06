ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS password_hash text;

CREATE INDEX IF NOT EXISTS idx_users_phone_password_hash
  ON public.users (phone_number)
  WHERE password_hash IS NOT NULL;
