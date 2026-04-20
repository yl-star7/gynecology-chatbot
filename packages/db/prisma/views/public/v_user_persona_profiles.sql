WITH scored_signals AS (
  SELECT
    ups.user_id,
    ups.persona_hint,
    ups.confidence,
    ups.evidence,
    ups.observed_at,
    (
      ups.weight * CASE
        WHEN (ups.observed_at >= (NOW() - '7 days' :: INTERVAL)) THEN 1.0
        WHEN (ups.observed_at >= (NOW() - '30 days' :: INTERVAL)) THEN 0.7
        WHEN (ups.observed_at >= (NOW() - '90 days' :: INTERVAL)) THEN 0.4
        ELSE 0.2
      END
    ) AS recency_weighted_score
  FROM
    user_persona_signals ups
  WHERE
    (ups.persona_hint <> 'unknown' :: text)
),
ranked_personas AS (
  SELECT
    ss.user_id,
    ss.persona_hint,
    (sum(ss.recency_weighted_score)) :: numeric(8, 2) AS weighted_score,
    max(ss.observed_at) AS last_observed_at,
    string_agg(
      ss.evidence,
      ' / ' :: text
      ORDER BY
        ss.observed_at DESC
    ) FILTER (
      WHERE
        (
          (ss.evidence IS NOT NULL)
          AND (btrim(ss.evidence) <> '' :: text)
        )
    ) AS evidence_summary,
    row_number() OVER (
      PARTITION BY ss.user_id
      ORDER BY
        (sum(ss.recency_weighted_score)) DESC,
        (max(ss.observed_at)) DESC
    ) AS rank
  FROM
    scored_signals ss
  GROUP BY
    ss.user_id,
    ss.persona_hint
)
SELECT
  user_id,
  persona_hint,
  CASE
    WHEN (weighted_score >= (6) :: numeric) THEN 'high' :: text
    WHEN (weighted_score >= (2) :: numeric) THEN 'medium' :: text
    ELSE 'low' :: text
  END AS confidence,
  evidence_summary,
  weighted_score,
  last_observed_at
FROM
  ranked_personas rp
WHERE
  (rank = 1);