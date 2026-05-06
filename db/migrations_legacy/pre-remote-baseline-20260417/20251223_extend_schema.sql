-- Migration: Extend schema for gynecology chatbot
-- Date: 2025-12-23

-- ============ Enable Extensions ============
CREATE EXTENSION IF NOT EXISTS vector;

-- ============ Extend users table ============
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS ai_persona_id VARCHAR(50) DEFAULT 'default',
ADD COLUMN IF NOT EXISTS push_token TEXT,
ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS kakao_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'email';

-- Create index for kakao_id lookups
CREATE INDEX IF NOT EXISTS idx_users_kakao_id ON public.users(kakao_id);

-- ============ Extend messages table ============
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- ============ AI Personas Table ============
CREATE TABLE IF NOT EXISTS public.ai_personas (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  tone VARCHAR(50) NOT NULL CHECK (tone IN ('warm', 'professional', 'concise')),
  emoji_enabled BOOLEAN DEFAULT TRUE,
  avatar_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default personas
INSERT INTO public.ai_personas (id, name, description, system_prompt, tone) VALUES
('default', '따뜻한 산부인과 전문의', '공감과 따뜻함을 강조하는 기본 페르소나',
  '당신은 따뜻하고 공감적인 산부인과 전문의입니다. 사용자의 감정을 이해하고, 친근하면서도 전문적인 조언을 제공합니다. 이모지를 적절히 사용하여 친근한 분위기를 만들어주세요. 항상 사용자의 건강과 안전을 최우선으로 생각하며, 응급 상황에서는 즉시 병원 방문을 권유합니다.',
  'warm'),
('professional', '전문적인 산부인과 전문의', '의학적 정확성과 전문성을 강조',
  '당신은 전문적이고 정확한 산부인과 전문의입니다. 의학적 근거에 기반한 정보를 제공하며, 명확하고 신뢰할 수 있는 조언을 합니다. 사용자가 이해하기 쉽게 설명하되, 전문 용어도 필요시 사용합니다.',
  'professional'),
('concise', '간결한 산부인과 전문의', '핵심 정보만 빠르게 전달',
  '당신은 핵심만 간결하게 전달하는 산부인과 전문의입니다. 불필요한 설명 없이 핵심 정보와 조언을 빠르게 제공합니다. 바쁜 사용자를 위해 효율적인 상담을 진행합니다.',
  'concise')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for ai_personas
ALTER TABLE public.ai_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active personas" ON public.ai_personas
  FOR SELECT USING (is_active = TRUE);

-- ============ Saved Messages Table ============
CREATE TABLE IF NOT EXISTS public.saved_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(200),
  note TEXT,
  tags TEXT[],
  is_shared BOOLEAN DEFAULT FALSE,
  share_token VARCHAR(100) UNIQUE,
  share_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_messages_user_id ON public.saved_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_messages_share_token ON public.saved_messages(share_token);

-- Enable RLS for saved_messages
ALTER TABLE public.saved_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved messages" ON public.saved_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved messages" ON public.saved_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved messages" ON public.saved_messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved messages" ON public.saved_messages
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view shared messages" ON public.saved_messages
  FOR SELECT USING (is_shared = TRUE AND (share_expires_at IS NULL OR share_expires_at > NOW()));

-- ============ Survey Templates Table ============
CREATE TABLE IF NOT EXISTS public.survey_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  pregnancy_week_min INTEGER,
  pregnancy_week_max INTEGER,
  questions JSONB NOT NULL,
  is_ai_assisted BOOLEAN DEFAULT FALSE,
  ai_follow_up_prompt TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_survey_templates_week ON public.survey_templates(pregnancy_week_min, pregnancy_week_max);

-- Enable RLS for survey_templates
ALTER TABLE public.survey_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active surveys" ON public.survey_templates
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = TRUE);

-- ============ Survey Responses Table ============
CREATE TABLE IF NOT EXISTS public.survey_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES public.survey_templates(id) ON DELETE CASCADE NOT NULL,
  responses JSONB NOT NULL,
  ai_generated_questions JSONB,
  pregnancy_week INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id ON public.survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_template_id ON public.survey_responses(template_id);

-- Enable RLS for survey_responses
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own survey responses" ON public.survey_responses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own survey responses" ON public.survey_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============ Proactive Conversations Table ============
CREATE TABLE IF NOT EXISTS public.proactive_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('daily_check', 'milestone', 'symptom_follow_up')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  message_content TEXT NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'read', 'responded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proactive_scheduled ON public.proactive_conversations(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_proactive_user_status ON public.proactive_conversations(user_id, status);

-- Enable RLS for proactive_conversations
ALTER TABLE public.proactive_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own proactive conversations" ON public.proactive_conversations
  FOR SELECT USING (auth.uid() = user_id);

-- ============ Pregnancy Documents Table (pgvector RAG) ============
CREATE TABLE IF NOT EXISTS public.pregnancy_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  pregnancy_week INTEGER,
  category VARCHAR(100) NOT NULL,
  source_file VARCHAR(500),
  embedding VECTOR(1536) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create HNSW index for fast similarity search (cosine distance)
CREATE INDEX IF NOT EXISTS idx_pregnancy_documents_embedding
ON public.pregnancy_documents USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_pregnancy_documents_week ON public.pregnancy_documents(pregnancy_week);
CREATE INDEX IF NOT EXISTS idx_pregnancy_documents_category ON public.pregnancy_documents(category);

-- Enable RLS for pregnancy_documents
ALTER TABLE public.pregnancy_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view pregnancy documents" ON public.pregnancy_documents
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============ Vector Similarity Search Function ============
CREATE OR REPLACE FUNCTION match_pregnancy_documents(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  filter_week INT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title VARCHAR(500),
  content TEXT,
  pregnancy_week INTEGER,
  category VARCHAR(100),
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pd.id,
    pd.title,
    pd.content,
    pd.pregnancy_week,
    pd.category,
    1 - (pd.embedding <=> query_embedding) AS similarity
  FROM public.pregnancy_documents pd
  WHERE
    1 - (pd.embedding <=> query_embedding) > match_threshold
    AND (filter_week IS NULL OR pd.pregnancy_week = filter_week OR pd.pregnancy_week IS NULL)
  ORDER BY pd.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============ Trigger for updated_at ============
CREATE TRIGGER update_ai_personas_updated_at
  BEFORE UPDATE ON public.ai_personas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_survey_templates_updated_at
  BEFORE UPDATE ON public.survey_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pregnancy_documents_updated_at
  BEFORE UPDATE ON public.pregnancy_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============ Grant Permissions ============
GRANT ALL ON public.ai_personas TO authenticated;
GRANT ALL ON public.saved_messages TO authenticated;
GRANT ALL ON public.survey_templates TO authenticated;
GRANT ALL ON public.survey_responses TO authenticated;
GRANT ALL ON public.proactive_conversations TO authenticated;
GRANT ALL ON public.pregnancy_documents TO authenticated;
