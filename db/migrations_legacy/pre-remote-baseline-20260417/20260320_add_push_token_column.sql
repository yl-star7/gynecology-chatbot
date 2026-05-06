ALTER TABLE public.pregnancy_profiles
  ADD COLUMN IF NOT EXISTS push_token text;
