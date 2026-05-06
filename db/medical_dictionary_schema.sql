-- 의료 사전 하이브리드 스키마
-- RDB + JSONB + Vector Search 결합

-- 필요한 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- 유사 텍스트 검색용

-- 의료 사전 메인 테이블
CREATE TABLE medical_dictionary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 기본 필드
  term VARCHAR(255) NOT NULL,  -- 의료 용어
  term_en VARCHAR(255),         -- 영문명
  category VARCHAR(100) NOT NULL, -- 카테고리 (질병, 증상, 약물, 검사 등)

  -- 태그 시스템
  tags TEXT[],                  -- 관련 태그들
  related_terms TEXT[],         -- 관련 용어들

  -- JSONB로 유연한 콘텐츠 저장
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  /* content 구조 예시:
  {
    "definition": "정의",
    "symptoms": ["증상1", "증상2"],
    "causes": ["원인1", "원인2"],
    "treatment": "치료법",
    "prevention": "예방법",
    "cautions": ["주의사항1", "주의사항2"],
    "pregnancy_related": true,
    "pregnancy_week_relevant": [1, 40],
    "images": ["url1", "url2"],
    "references": ["참고문헌1", "참고문헌2"]
  }
  */

  -- 메타데이터
  metadata JSONB DEFAULT '{}'::jsonb,
  /* metadata 구조:
  {
    "icd_code": "ICD-10 코드",
    "severity": "low|medium|high",
    "frequency": "common|uncommon|rare",
    "department": "산부인과|소아과|내과 등",
    "last_reviewed": "2024-01-01",
    "reviewer": "전문의명"
  }
  */

  -- Vector embedding for semantic search
  embedding vector(1536),  -- OpenAI/Gemini embedding

  -- Full-text search를 위한 벡터
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(term, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(term_en, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(content->>'definition', '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(tags, ' '), '')), 'D')
  ) STORED,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 소프트 삭제
  deleted_at TIMESTAMPTZ,

  -- 품질 관리
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ
);

-- 인덱스들
CREATE INDEX idx_medical_dict_term ON medical_dictionary(term);
CREATE INDEX idx_medical_dict_term_trgm ON medical_dictionary USING gin(term gin_trgm_ops);
CREATE INDEX idx_medical_dict_category ON medical_dictionary(category);
CREATE INDEX idx_medical_dict_tags ON medical_dictionary USING GIN(tags);
CREATE INDEX idx_medical_dict_content ON medical_dictionary USING GIN(content);
CREATE INDEX idx_medical_dict_search ON medical_dictionary USING GIN(search_vector);
CREATE INDEX idx_medical_dict_embedding ON medical_dictionary USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_medical_dict_pregnancy ON medical_dictionary((content->>'pregnancy_related'));

-- 사용자 검색 히스토리 (검색 개선용)
CREATE TABLE medical_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  search_query TEXT NOT NULL,
  search_type VARCHAR(50), -- 'text', 'semantic', 'tag', 'category'
  results_count INTEGER,
  clicked_result_id UUID REFERENCES medical_dictionary(id),
  session_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 자주 묻는 의료 질문 (FAQ)
CREATE TABLE medical_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100),
  tags TEXT[],
  related_terms UUID[] REFERENCES medical_dictionary(id),
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 함수: 텍스트 검색
CREATE OR REPLACE FUNCTION search_medical_dictionary(
  search_term TEXT,
  search_category VARCHAR DEFAULT NULL,
  search_tags TEXT[] DEFAULT NULL,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  term VARCHAR,
  category VARCHAR,
  tags TEXT[],
  content JSONB,
  relevance REAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    md.id,
    md.term,
    md.category,
    md.tags,
    md.content,
    ts_rank(md.search_vector, plainto_tsquery('simple', search_term)) +
    CASE
      WHEN md.term ILIKE '%' || search_term || '%' THEN 10
      WHEN md.term_en ILIKE '%' || search_term || '%' THEN 5
      ELSE 0
    END AS relevance
  FROM medical_dictionary md
  WHERE
    md.deleted_at IS NULL
    AND (
      md.search_vector @@ plainto_tsquery('simple', search_term)
      OR md.term ILIKE '%' || search_term || '%'
      OR md.term_en ILIKE '%' || search_term || '%'
    )
    AND (search_category IS NULL OR md.category = search_category)
    AND (search_tags IS NULL OR md.tags && search_tags)
  ORDER BY relevance DESC
  LIMIT limit_count;
END;
$$;

-- 함수: 벡터 유사도 검색
CREATE OR REPLACE FUNCTION search_medical_similar(
  query_embedding vector(1536),
  limit_count INTEGER DEFAULT 10,
  threshold REAL DEFAULT 0.5
)
RETURNS TABLE (
  id UUID,
  term VARCHAR,
  category VARCHAR,
  content JSONB,
  similarity REAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    md.id,
    md.term,
    md.category,
    md.content,
    1 - (md.embedding <=> query_embedding) AS similarity
  FROM medical_dictionary md
  WHERE
    md.deleted_at IS NULL
    AND md.embedding IS NOT NULL
    AND 1 - (md.embedding <=> query_embedding) > threshold
  ORDER BY md.embedding <=> query_embedding
  LIMIT limit_count;
END;
$$;

-- 함수: 임신 주차별 관련 정보 검색
CREATE OR REPLACE FUNCTION search_pregnancy_week_info(
  week_number INTEGER
)
RETURNS TABLE (
  id UUID,
  term VARCHAR,
  category VARCHAR,
  content JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    md.id,
    md.term,
    md.category,
    md.content
  FROM medical_dictionary md
  WHERE
    md.deleted_at IS NULL
    AND (md.content->>'pregnancy_related')::boolean = true
    AND week_number BETWEEN
      COALESCE((md.content->'pregnancy_week_relevant'->0)::integer, 0)
      AND COALESCE((md.content->'pregnancy_week_relevant'->1)::integer, 42)
  ORDER BY md.category, md.term;
END;
$$;

-- RLS (Row Level Security) 정책
ALTER TABLE medical_dictionary ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_faq ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 의료 사전 읽기 가능
CREATE POLICY "Anyone can view medical dictionary" ON medical_dictionary
  FOR SELECT USING (deleted_at IS NULL);

-- 인증된 사용자만 검색 히스토리 생성
CREATE POLICY "Users can create their own search history" ON medical_search_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 검색 히스토리만 볼 수 있음
CREATE POLICY "Users can view their own search history" ON medical_search_history
  FOR SELECT USING (auth.uid() = user_id);

-- 모든 사용자가 FAQ 읽기 가능
CREATE POLICY "Anyone can view medical FAQ" ON medical_faq
  FOR SELECT USING (true);

-- 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_medical_dictionary_updated_at
  BEFORE UPDATE ON medical_dictionary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_faq_updated_at
  BEFORE UPDATE ON medical_faq
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 삽입
INSERT INTO medical_dictionary (term, term_en, category, tags, content, metadata) VALUES
(
  '입덧',
  'Morning Sickness',
  '임신증상',
  ARRAY['임신초기', '구토', '메스꺼움', '오심'],
  '{
    "definition": "임신 초기에 나타나는 구역질과 구토 증상",
    "symptoms": ["아침 메스꺼움", "구토", "식욕부진", "특정 냄새에 대한 과민반응"],
    "causes": ["호르몬 변화(hCG 증가)", "에스트로겐 증가", "프로게스테론 증가"],
    "treatment": "생강차, 비타민 B6, 소량 자주 식사, 충분한 수분 섭취",
    "prevention": "공복 피하기, 기름진 음식 피하기, 충분한 휴식",
    "cautions": ["심한 탈수", "체중 감소", "임신오조증 가능성"],
    "pregnancy_related": true,
    "pregnancy_week_relevant": [4, 16]
  }'::jsonb,
  '{
    "severity": "medium",
    "frequency": "common",
    "department": "산부인과"
  }'::jsonb
),
(
  '임신성 당뇨',
  'Gestational Diabetes',
  '임신합병증',
  ARRAY['당뇨', '혈당', '임신중기', '고위험임신'],
  '{
    "definition": "임신 중 처음 발견되거나 시작된 당뇨병",
    "symptoms": ["과도한 갈증", "빈뇨", "피로감", "시야 흐림"],
    "causes": ["인슐린 저항성 증가", "태반 호르몬", "비만", "가족력"],
    "treatment": "식이요법, 운동, 혈당 모니터링, 필요시 인슐린",
    "prevention": "적정 체중 유지, 균형잡힌 식사, 규칙적인 운동",
    "cautions": ["거대아", "조산", "제왕절개 가능성", "신생아 저혈당"],
    "pregnancy_related": true,
    "pregnancy_week_relevant": [24, 28]
  }'::jsonb,
  '{
    "icd_code": "O24.4",
    "severity": "high",
    "frequency": "common",
    "department": "산부인과"
  }'::jsonb
);

-- 인덱스 통계 업데이트
ANALYZE medical_dictionary;
ANALYZE medical_search_history;
ANALYZE medical_faq;