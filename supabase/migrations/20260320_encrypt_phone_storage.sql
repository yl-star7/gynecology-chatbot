ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS phone_number_encrypted text,
  ADD COLUMN IF NOT EXISTS phone_number_blind_index text,
  ADD COLUMN IF NOT EXISTS phone_number_last4 varchar(4);

ALTER TABLE public.phone_verification_requests
  ADD COLUMN IF NOT EXISTS phone_number_encrypted text,
  ADD COLUMN IF NOT EXISTS phone_number_blind_index text,
  ADD COLUMN IF NOT EXISTS phone_number_last4 varchar(4);

ALTER TABLE public.allowed_phone_numbers
  ADD COLUMN IF NOT EXISTS phone_number_encrypted text,
  ADD COLUMN IF NOT EXISTS phone_number_blind_index text,
  ADD COLUMN IF NOT EXISTS phone_number_last4 varchar(4);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_number_blind_index
  ON public.users (phone_number_blind_index);

CREATE INDEX IF NOT EXISTS idx_phone_verification_requests_phone_created
  ON public.phone_verification_requests (phone_number_blind_index, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_allowed_phone_numbers_phone_number_blind_index
  ON public.allowed_phone_numbers (phone_number_blind_index);
