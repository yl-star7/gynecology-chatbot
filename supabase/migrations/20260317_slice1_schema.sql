ALTER TABLE public.pregnancy_profiles
  ADD COLUMN IF NOT EXISTS baby_sex text CHECK (baby_sex IN ('male', 'female', 'unknown')),
  ADD COLUMN IF NOT EXISTS baby_nickname varchar(80),
  ADD COLUMN IF NOT EXISTS theme_key varchar(40),
  ADD COLUMN IF NOT EXISTS notification_time time,
  ADD COLUMN IF NOT EXISTS notification_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS week_override integer,
  ADD COLUMN IF NOT EXISTS day_override integer;

CREATE TABLE IF NOT EXISTS public.pregnancy_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number integer NOT NULL,
  title text,
  baby_size_label text,
  baby_size_compare_object text,
  baby_summary text,
  mother_summary text,
  hero_image_path text,
  compare_image_path text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (week_number),
  CONSTRAINT pregnancy_weeks_week_number_range CHECK (week_number BETWEEN 1 AND 40)
);

CREATE TABLE IF NOT EXISTS public.pregnancy_week_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id uuid NOT NULL REFERENCES public.pregnancy_weeks (id) ON DELETE CASCADE,
  section_key text NOT NULL,
  title text,
  body text,
  display_order integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.pregnancy_week_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id uuid NOT NULL REFERENCES public.pregnancy_weeks (id) ON DELETE CASCADE,
  asset_type text NOT NULL,
  storage_path text NOT NULL,
  alt_text text,
  style_key text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.pregnancy_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pregnancy_week_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pregnancy_week_assets ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_pregnancy_weeks_updated_at ON public.pregnancy_weeks;
CREATE TRIGGER trg_pregnancy_weeks_updated_at
BEFORE UPDATE ON public.pregnancy_weeks
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP POLICY IF EXISTS pregnancy_weeks_public_select ON public.pregnancy_weeks;
CREATE POLICY pregnancy_weeks_public_select
ON public.pregnancy_weeks
FOR SELECT
USING (
  public.is_admin_user()
  OR (auth.uid() IS NOT NULL AND status = 'published')
);

DROP POLICY IF EXISTS pregnancy_weeks_admin_write ON public.pregnancy_weeks;
CREATE POLICY pregnancy_weeks_admin_write
ON public.pregnancy_weeks
FOR ALL
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS pregnancy_week_sections_public_select ON public.pregnancy_week_sections;
CREATE POLICY pregnancy_week_sections_public_select
ON public.pregnancy_week_sections
FOR SELECT
USING (
  public.is_admin_user()
  OR (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.pregnancy_weeks pw
      WHERE pw.id = pregnancy_week_sections.week_id
        AND pw.status = 'published'
    )
  )
);

DROP POLICY IF EXISTS pregnancy_week_sections_admin_write ON public.pregnancy_week_sections;
CREATE POLICY pregnancy_week_sections_admin_write
ON public.pregnancy_week_sections
FOR ALL
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS pregnancy_week_assets_public_select ON public.pregnancy_week_assets;
CREATE POLICY pregnancy_week_assets_public_select
ON public.pregnancy_week_assets
FOR SELECT
USING (
  public.is_admin_user()
  OR (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.pregnancy_weeks pw
      WHERE pw.id = pregnancy_week_assets.week_id
        AND pw.status = 'published'
    )
  )
);

DROP POLICY IF EXISTS pregnancy_week_assets_admin_write ON public.pregnancy_week_assets;
CREATE POLICY pregnancy_week_assets_admin_write
ON public.pregnancy_week_assets
FOR ALL
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

INSERT INTO public.pregnancy_weeks (
  week_number,
  title,
  baby_size_label,
  baby_size_compare_object,
  baby_summary,
  mother_summary,
  hero_image_path,
  compare_image_path,
  status
)
SELECT
  gs.week_number,
  'Week ' || gs.week_number,
  ''::text,
  ''::text,
  ''::text,
  ''::text,
  NULL::text,
  NULL::text,
  'draft'::text
FROM generate_series(1, 40) AS gs(week_number)
ON CONFLICT (week_number) DO NOTHING;
