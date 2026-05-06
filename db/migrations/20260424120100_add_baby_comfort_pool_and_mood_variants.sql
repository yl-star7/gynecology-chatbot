-- Admin v3.3 IA: 신규 variation 풀 + 기분별 변주.
-- 아기 위안 풀 = 모바일 홈 "오늘의 아기 한마디" 랜덤 소스.
-- 기분별 변주 = LLM 응답 prompt_suffix, scenario × mood.

-- 1. baby_comfort_pool — 공통 풀(주차 무관 기본), tag_week/tag_mood로 좁힐 수 있음.
CREATE TABLE IF NOT EXISTS public.content_baby_comfort_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  tag_week int,                             -- null = 모든 주차
  tag_mood text,                            -- null = 모든 기분
  active boolean NOT NULL DEFAULT true,
  weight int NOT NULL DEFAULT 1,            -- random weighted pick
  previous_snapshot jsonb,                  -- 롤백 1단계
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_baby_comfort_pool_weight_check CHECK (weight > 0),
  CONSTRAINT content_baby_comfort_pool_week_check
    CHECK (tag_week IS NULL OR (tag_week BETWEEN 1 AND 42)),
  CONSTRAINT content_baby_comfort_pool_mood_check
    CHECK (tag_mood IS NULL OR tag_mood IN ('calm', 'joyful', 'anxious', 'tired', 'sad'))
);

CREATE INDEX IF NOT EXISTS idx_baby_comfort_pool_active
  ON public.content_baby_comfort_pool (active) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_baby_comfort_pool_tag_week
  ON public.content_baby_comfort_pool (tag_week);

CREATE INDEX IF NOT EXISTS idx_baby_comfort_pool_tag_mood
  ON public.content_baby_comfort_pool (tag_mood);


-- 2. mood_variants — LLM 응답 prompt_suffix. (scenario, mood) 조합 유니크.
CREATE TABLE IF NOT EXISTS public.content_mood_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario text NOT NULL,                   -- baby_info_offer / letter_reflection / empathy_chat / ...
  mood text NOT NULL,                       -- calm/joyful/anxious/tired/sad
  prompt_suffix text NOT NULL,
  tone text,                                -- 선택. 추가 설명
  active boolean NOT NULL DEFAULT true,
  previous_snapshot jsonb,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_mood_variants_mood_check
    CHECK (mood IN ('calm', 'joyful', 'anxious', 'tired', 'sad')),
  CONSTRAINT content_mood_variants_scenario_mood_unique UNIQUE (scenario, mood)
);

CREATE INDEX IF NOT EXISTS idx_mood_variants_active
  ON public.content_mood_variants (scenario, mood) WHERE active = true;
