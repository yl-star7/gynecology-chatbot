-- Paraphrased user-facing encyclopedia content is stored separately from
-- imported source content so source provenance, review state, and regenerated
-- versions are preserved.

CREATE TABLE IF NOT EXISTS public.content_paraphrase_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model varchar(120) NOT NULL,
  prompt_version varchar(80) NOT NULL,
  scope varchar(40) NOT NULL,
  target_week_number integer,
  status varchar(40) NOT NULL DEFAULT 'processing',
  input_token_count integer,
  output_token_count integer,
  total_token_count integer,
  cost_usd numeric(10, 6),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  completed_at timestamptz,
  CONSTRAINT content_paraphrase_runs_scope_check
    CHECK (scope IN ('week', 'full', 'single_item')),
  CONSTRAINT content_paraphrase_runs_status_check
    CHECK (status IN ('processing', 'completed', 'failed')),
  CONSTRAINT content_paraphrase_runs_target_week_range
    CHECK (target_week_number IS NULL OR target_week_number BETWEEN 1 AND 40)
);

CREATE INDEX IF NOT EXISTS idx_content_paraphrase_runs_target_week
  ON public.content_paraphrase_runs (target_week_number, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_paraphrase_runs_status
  ON public.content_paraphrase_runs (status);

CREATE TABLE IF NOT EXISTS public.content_paraphrased_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  source_table varchar(120) NOT NULL,
  source_id uuid,
  source_week_number integer NOT NULL,
  source_day_number integer,
  source_code varchar(160),
  source_hash varchar(128) NOT NULL,

  run_id uuid REFERENCES public.content_paraphrase_runs (id) ON DELETE SET NULL,

  content_scope varchar(60) NOT NULL,
  category varchar(80) NOT NULL,

  title text,
  summary text,
  body text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,

  status varchar(40) NOT NULL DEFAULT 'needs_review',
  review_note text,
  reviewed_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  reviewed_at timestamptz,

  is_active boolean NOT NULL DEFAULT false,

  model varchar(120) NOT NULL,
  prompt_version varchar(80) NOT NULL,

  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),

  CONSTRAINT content_paraphrased_items_status_check
    CHECK (status IN ('needs_review', 'ready', 'archived', 'failed')),
  CONSTRAINT content_paraphrased_items_scope_check
    CHECK (content_scope IN ('week_summary', 'section', 'day_content', 'checklist', 'question')),
  CONSTRAINT content_paraphrased_items_category_check
    CHECK (category IN ('overview', 'baby_development', 'mother_body', 'life_guide', 'caution', 'faq', 'reflection_question')),
  CONSTRAINT content_paraphrased_items_week_number_range
    CHECK (source_week_number BETWEEN 1 AND 40),
  CONSTRAINT content_paraphrased_items_day_number_range
    CHECK (source_day_number IS NULL OR source_day_number BETWEEN 1 AND 7)
);

CREATE INDEX IF NOT EXISTS idx_content_paraphrased_items_week_category
  ON public.content_paraphrased_items (source_week_number, category, status);

CREATE INDEX IF NOT EXISTS idx_content_paraphrased_items_source_hash
  ON public.content_paraphrased_items (source_hash);

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_paraphrased_items_active_source
  ON public.content_paraphrased_items (
    source_table,
    source_week_number,
    content_scope,
    category,
    COALESCE(source_day_number, 0),
    COALESCE(source_code, '')
  )
  WHERE is_active = true;

CREATE OR REPLACE VIEW public.v_weekly_encyclopedia AS
SELECT
  source_week_number AS week_number,
  source_day_number AS day_number,
  source_code,
  content_scope,
  category,
  title,
  summary,
  body,
  items,
  updated_at
FROM public.content_paraphrased_items
WHERE status = 'ready'
  AND is_active = true;

COMMENT ON TABLE public.content_paraphrase_runs IS
  'One AI paraphrase generation run. Tracks model, prompt version, scope, usage, and failure state.';

COMMENT ON TABLE public.content_paraphrased_items IS
  'Versioned user-facing paraphrase results derived from imported source content. Source rows are preserved separately.';

COMMENT ON VIEW public.v_weekly_encyclopedia IS
  'Active, reviewed paraphrased weekly encyclopedia content for mobile app reads.';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_paraphrase_runs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_paraphrased_items TO authenticated;
GRANT SELECT ON public.v_weekly_encyclopedia TO authenticated;
