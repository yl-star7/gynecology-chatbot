-- 사용자 상담 성향은 고정 프로필 컬럼이 아니라 대화에서 관찰되는 신호로 저장한다.
-- 현재 대표 성향은 view에서 confidence weight와 recency weight를 합산해 계산한다.

CREATE TABLE IF NOT EXISTS public.user_persona_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.chat_sessions (id) ON DELETE SET NULL,
  source_message_id uuid REFERENCES public.chat_messages (id) ON DELETE SET NULL,
  persona_hint text NOT NULL,
  confidence text NOT NULL DEFAULT 'low',
  evidence text,
  weight numeric(6, 2) NOT NULL DEFAULT 1,
  observed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_persona_signals_persona_hint_check
    CHECK (persona_hint IN ('anxious', 'positive', 'introverted', 'practical', 'unknown')),
  CONSTRAINT user_persona_signals_confidence_check
    CHECK (confidence IN ('low', 'medium', 'high')),
  CONSTRAINT user_persona_signals_weight_check
    CHECK (weight > 0)
);

CREATE INDEX IF NOT EXISTS idx_user_persona_signals_user_observed_at
  ON public.user_persona_signals (user_id, observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_persona_signals_user_hint
  ON public.user_persona_signals (user_id, persona_hint);

CREATE OR REPLACE VIEW public.v_user_persona_profiles AS
WITH scored_signals AS (
  SELECT
    ups.user_id,
    ups.persona_hint,
    ups.confidence,
    ups.evidence,
    ups.observed_at,
    ups.weight *
      CASE
        WHEN ups.observed_at >= now() - interval '7 days' THEN 1.0
        WHEN ups.observed_at >= now() - interval '30 days' THEN 0.7
        WHEN ups.observed_at >= now() - interval '90 days' THEN 0.4
        ELSE 0.2
      END AS recency_weighted_score
  FROM public.user_persona_signals ups
  WHERE ups.persona_hint <> 'unknown'
),
ranked_personas AS (
  SELECT
    ss.user_id,
    ss.persona_hint,
    SUM(ss.recency_weighted_score)::numeric(8, 2) AS weighted_score,
    MAX(ss.observed_at) AS last_observed_at,
    STRING_AGG(ss.evidence, ' / ' ORDER BY ss.observed_at DESC)
      FILTER (WHERE ss.evidence IS NOT NULL AND btrim(ss.evidence) <> '') AS evidence_summary,
    ROW_NUMBER() OVER (
      PARTITION BY ss.user_id
      ORDER BY SUM(ss.recency_weighted_score) DESC, MAX(ss.observed_at) DESC
    ) AS rank
  FROM scored_signals ss
  GROUP BY ss.user_id, ss.persona_hint
)
SELECT
  rp.user_id,
  rp.persona_hint,
  CASE
    WHEN rp.weighted_score >= 6 THEN 'high'
    WHEN rp.weighted_score >= 2 THEN 'medium'
    ELSE 'low'
  END AS confidence,
  rp.evidence_summary,
  rp.weighted_score,
  rp.last_observed_at
FROM ranked_personas rp
WHERE rp.rank = 1;

COMMENT ON TABLE public.user_persona_signals IS
  '대화에서 관찰한 사용자 상담 성향 신호. 사용자에게 노출하지 않는 내부 톤 조절용 데이터.';

COMMENT ON VIEW public.v_user_persona_profiles IS
  'user_persona_signals를 confidence weight와 recency weight로 합산한 현재 대표 상담 성향 view.';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_persona_signals TO authenticated;
GRANT SELECT ON public.v_user_persona_profiles TO authenticated;
