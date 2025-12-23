# 부인과 챗봇 Supabase 확장 구현 계획

> 작성일: 2025-12-23
> 상태: 승인됨

## 1. 개요

기존 Next.js 부인과 챗봇을 확장하여 다음 기능들을 구현합니다:

- 카카오 로그인
- 온보딩 시스템 (사용자 preferences → AI persona 변경)
- 챗봇 세션 & 채팅 (저장/공유 기능)
- 설문 시스템 (주차별 정해진 설문 + AI 보조 질문)
- 푸시 알림 (Expo Push)
- AI 선제적 대화 (하루 1번)
- Imagen 연동 (그림 생성)
- 이미지 업로드
- pgvector RAG (임신 주차별 DOCX 데이터)
- Expo WebView 앱 (모노레포)

---

## 2. 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS |
| **AI Framework** | Vercel AI SDK (스트리밍) + LangChain (RAG/에이전트) |
| **Database** | Supabase (PostgreSQL + pgvector) |
| **Auth** | Supabase Auth (카카오 OAuth) |
| **Push** | Expo Push |
| **RAG** | Supabase pgvector (Gemini embedding, 1536 dim) |
| **Mobile** | Expo WebView (Turborepo 모노레포) |
| **AI Model** | Gemini 2.0 Flash |

---

## 3. 모노레포 구조

```
gynecology-chatbot/
├── apps/
│   ├── web/                    # Next.js 웹앱 (기존 코드 이동)
│   │   ├── src/
│   │   ├── package.json
│   │   └── next.config.ts
│   │
│   └── mobile/                 # Expo 앱 (신규)
│       ├── app/                # Expo Router
│       ├── components/
│       ├── app.json
│       └── package.json
│
├── packages/
│   ├── ui/                     # 공유 UI 컴포넌트
│   ├── types/                  # 공유 TypeScript 타입
│   └── config/                 # ESLint, TS 설정
│
├── supabase/
│   └── migrations/             # DB 마이그레이션
│
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

---

## 4. 데이터베이스 스키마

### 4.1 기존 테이블 확장

#### users 테이블 추가 컬럼

```sql
ALTER TABLE public.users
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN onboarding_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN ai_persona_id VARCHAR(50) DEFAULT 'default',
ADD COLUMN push_token TEXT,
ADD COLUMN push_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN kakao_id VARCHAR(100),
ADD COLUMN auth_provider VARCHAR(20) DEFAULT 'email';
```

**onboarding_data 스키마:**
```json
{
  "pregnancyStatus": "pregnant" | "trying" | "general",
  "pregnancyWeek": 12,
  "dueDate": "2025-07-15",
  "firstPregnancy": true,
  "ageGroup": "20s" | "30s" | "40s",
  "healthConcerns": ["string"],
  "preferredCommunicationStyle": "formal" | "friendly" | "concise",
  "completedAt": "ISO date string"
}
```

#### messages 테이블 추가 컬럼

```sql
ALTER TABLE public.messages
ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;
```

### 4.2 신규 테이블

#### ai_personas

```sql
CREATE TABLE public.ai_personas (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  tone VARCHAR(50) NOT NULL, -- "warm", "professional", "concise"
  emoji_enabled BOOLEAN DEFAULT TRUE,
  avatar_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 페르소나
INSERT INTO public.ai_personas (id, name, description, system_prompt, tone) VALUES
('default', '따뜻한 산부인과 전문의', '공감과 따뜻함을 강조하는 기본 페르소나', '당신은 따뜻하고 공감적인 산부인과 전문의입니다...', 'warm'),
('professional', '전문적인 산부인과 전문의', '의학적 정확성과 전문성을 강조', '당신은 전문적이고 정확한 산부인과 전문의입니다...', 'professional'),
('concise', '간결한 산부인과 전문의', '핵심 정보만 빠르게 전달', '당신은 핵심만 간결하게 전달하는 산부인과 전문의입니다...', 'concise');
```

#### saved_messages

```sql
CREATE TABLE public.saved_messages (
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

CREATE INDEX idx_saved_messages_user_id ON public.saved_messages(user_id);
CREATE INDEX idx_saved_messages_share_token ON public.saved_messages(share_token);
```

#### survey_templates

```sql
CREATE TABLE public.survey_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  pregnancy_week_range INT4RANGE, -- e.g., [4, 12] for first trimester
  questions JSONB NOT NULL,
  is_ai_assisted BOOLEAN DEFAULT FALSE,
  ai_follow_up_prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**questions JSONB 스키마:**
```json
[
  {
    "id": "q1",
    "type": "single_choice" | "multi_choice" | "scale" | "text" | "ai_dynamic",
    "question": "오늘 기분은 어떠셨나요?",
    "options": ["좋아요", "보통이에요", "힘들어요"],
    "scale": { "min": 1, "max": 5 },
    "required": true,
    "ai_context": "우울 증상 선별용"
  }
]
```

#### survey_responses

```sql
CREATE TABLE public.survey_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES public.survey_templates(id) ON DELETE CASCADE NOT NULL,
  responses JSONB NOT NULL,
  ai_generated_questions JSONB,
  pregnancy_week INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_survey_responses_user_id ON public.survey_responses(user_id);
```

#### proactive_conversations

```sql
CREATE TABLE public.proactive_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  trigger_type VARCHAR(50) NOT NULL, -- 'daily_check', 'milestone', 'symptom_follow_up'
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  message_content TEXT NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'read', 'responded'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proactive_conversations_scheduled ON public.proactive_conversations(scheduled_at);
```

#### pregnancy_documents (pgvector)

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE public.pregnancy_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  pregnancy_week INTEGER, -- NULL = 일반 콘텐츠
  category VARCHAR(100) NOT NULL,
  source_file VARCHAR(500),
  embedding VECTOR(1536) NOT NULL, -- Gemini embedding dimension
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW 인덱스 (빠른 유사도 검색)
CREATE INDEX idx_pregnancy_documents_embedding
ON public.pregnancy_documents USING hnsw (embedding vector_cosine_ops);

CREATE INDEX idx_pregnancy_documents_week ON public.pregnancy_documents(pregnancy_week);
CREATE INDEX idx_pregnancy_documents_category ON public.pregnancy_documents(category);

-- 유사도 검색 함수
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
```

---

## 5. API 엔드포인트

### 5.1 인증 (Auth)

| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/auth/kakao` | GET | 카카오 OAuth 시작 |
| `/api/auth/kakao/callback` | GET | 카카오 콜백 처리 |

### 5.2 온보딩 (Onboarding)

| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/onboarding` | POST | 온보딩 응답 제출 |
| `/api/onboarding/status` | GET | 온보딩 완료 여부 |
| `/api/onboarding/questions` | GET | 동적 온보딩 질문 |

### 5.3 채팅 (Chat)

| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/chat` | POST | 메시지 전송 (기존 확장) |
| `/api/chat/image` | POST | 이미지 업로드 & 분석 |
| `/api/chat/imagen` | POST | Imagen 이미지 생성 |

### 5.4 메시지 저장/공유

| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/messages/save` | POST | 메시지 저장 |
| `/api/messages/saved` | GET | 저장된 메시지 목록 |
| `/api/messages/share` | POST | 공유 링크 생성 |
| `/api/messages/share/[token]` | GET | 공유 메시지 조회 |

### 5.5 AI 페르소나

| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/personas` | GET | 페르소나 목록 |
| `/api/personas/current` | GET | 현재 페르소나 |
| `/api/personas/switch` | POST | 페르소나 변경 |

### 5.6 설문 (Survey)

| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/surveys/current` | GET | 현재 주차 설문 |
| `/api/surveys/[id]` | GET | 특정 설문 조회 |
| `/api/surveys/[id]/submit` | POST | 설문 응답 제출 |
| `/api/surveys/ai-question` | POST | AI 추가 질문 생성 |

### 5.7 푸시 알림

| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/push/register` | POST | 푸시 토큰 등록 |
| `/api/push/unregister` | POST | 푸시 토큰 해제 |
| `/api/push/test` | POST | 테스트 알림 전송 |

### 5.8 선제적 대화

| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/proactive/schedule` | POST | 선제 메시지 스케줄 |
| `/api/proactive/pending` | GET | 대기 중 메시지 |
| `/api/proactive/send` | POST | 메시지 전송 (cron) |

### 5.9 RAG

| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/rag` | POST | 문서 검색 (기존 확장) |
| `/api/rag/embed` | POST | 임베딩 생성 |
| `/api/rag/ingest` | POST | DOCX 문서 업로드 |

---

## 6. 컴포넌트 구조

### 6.1 신규 컴포넌트

```
src/components/
├── onboarding/
│   ├── OnboardingFlow.tsx        # 메인 위자드
│   ├── OnboardingStep.tsx        # 단일 스텝
│   ├── PregnancyStatusStep.tsx   # 임신 상태
│   ├── PersonalInfoStep.tsx      # 개인 정보
│   ├── PreferencesStep.tsx       # AI 스타일 선호
│   └── OnboardingProgress.tsx    # 진행률
│
├── persona/
│   ├── PersonaSelector.tsx       # 페르소나 선택
│   ├── PersonaCard.tsx           # 페르소나 카드
│   └── PersonaContext.tsx        # Context Provider
│
├── saved/
│   ├── SavedMessagesList.tsx     # 저장 목록
│   ├── SavedMessageCard.tsx      # 저장 카드
│   ├── SaveMessageDialog.tsx     # 저장 다이얼로그
│   ├── ShareMessageDialog.tsx    # 공유 다이얼로그
│   └── SharedMessageView.tsx     # 공유 뷰
│
├── survey/
│   ├── SurveyContainer.tsx       # 설문 래퍼
│   ├── SurveyQuestion.tsx        # 질문 렌더러
│   ├── SurveyProgress.tsx        # 진행률
│   ├── AIFollowUpQuestion.tsx    # AI 추가 질문
│   └── SurveyComplete.tsx        # 완료 화면
│
├── chat/
│   ├── ImageUpload.tsx           # 이미지 업로드
│   ├── ImagePreview.tsx          # 이미지 미리보기
│   ├── ImageGenerationRequest.tsx # Imagen 요청
│   ├── ProactiveMessageBanner.tsx # 선제 메시지
│   └── (기존 컴포넌트...)
│
└── push/
    ├── PushPermissionBanner.tsx  # 권한 요청
    └── PushSettingsPanel.tsx     # 설정 패널
```

### 6.2 신규 훅

```
src/hooks/
├── use-onboarding.ts             # 온보딩 상태
├── use-persona.ts                # 페르소나 관리
├── use-saved-messages.ts         # 저장 메시지 CRUD
├── use-survey.ts                 # 설문 상태
├── use-push-notifications.ts     # 푸시 알림
└── use-proactive-chat.ts         # 선제 대화
```

### 6.3 신규 라이브러리

```
src/lib/
├── langchain/
│   ├── index.ts                  # LangChain 설정
│   ├── chains.ts                 # RAG 체인
│   ├── agents.ts                 # 의료 에이전트
│   ├── tools.ts                  # 커스텀 도구 (Imagen 등)
│   └── memory.ts                 # 대화 메모리
│
├── pgvector-rag.ts               # pgvector RAG 클라이언트
├── imagen.ts                     # Google Imagen 클라이언트
├── expo-push.ts                  # Expo Push 클라이언트
├── kakao-auth.ts                 # 카카오 OAuth
├── document-ingestion.ts         # DOCX 파싱 & 임베딩
└── proactive-chat.ts             # 선제 대화 로직
```

---

## 7. 구현 순서 (의존성 고려)

| 순서 | 작업 | 의존성 | 예상 기간 |
|------|------|--------|----------|
| 1 | 모노레포 설정 (Turborepo) | - | 0.5일 |
| 2 | DB 스키마 마이그레이션 | - | 0.5일 |
| 3 | pgvector RAG 구현 | DB 스키마 | 1일 |
| 4 | 카카오 OAuth | - | 0.5일 |
| 5 | 온보딩 시스템 | 카카오 OAuth | 1일 |
| 6 | AI 페르소나 | DB 스키마 | 0.5일 |
| 7 | LangChain 통합 | pgvector RAG | 1.5일 |
| 8 | 이미지 업로드 | Supabase Storage | 0.5일 |
| 9 | Imagen 연동 | LangChain | 0.5일 |
| 10 | 메시지 저장/공유 | DB 스키마 | 1일 |
| 11 | 설문 시스템 | DB 스키마 | 1.5일 |
| 12 | AI 선제 대화 | 설문, 페르소나 | 1일 |
| 13 | Expo Push | 선제 대화 | 0.5일 |
| 14 | Expo 앱 | 모노레포, Push | 2일 |

**총 예상: 약 12일**

---

## 8. 핵심 구현 코드

### 8.1 LangChain + Vercel AI SDK 하이브리드

```typescript
// src/lib/langchain/index.ts
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { LangChainAdapter } from "ai";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { PromptTemplate } from "@langchain/core/prompts";

const model = new ChatGoogleGenerativeAI({
  modelName: "gemini-2.0-flash",
  temperature: 0.7,
});

export async function createMedicalRAGChain(persona: AIPersona) {
  const memory = new BufferMemory({
    memoryKey: "chat_history",
    returnMessages: true,
  });

  const promptTemplate = PromptTemplate.fromTemplate(`
    ${persona.system_prompt}

    Context from medical knowledge base:
    {context}

    Chat History:
    {chat_history}

    Human: {input}
    Assistant:
  `);

  return new ConversationChain({
    llm: model,
    memory,
    prompt: promptTemplate,
  });
}

export async function streamWithLangChain(
  chain: ConversationChain,
  input: string,
  context: string
) {
  const stream = await chain.stream({ input, context });
  return LangChainAdapter.toDataStreamResponse(stream);
}
```

### 8.2 pgvector RAG

```typescript
// src/lib/pgvector-rag.ts
import { createClient } from "@/lib/supabase-server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  return result.embedding.values; // 1536 dimensions
}

export async function searchPregnancyDocuments(
  query: string,
  pregnancyWeek?: number,
  limit: number = 5
) {
  const supabase = await createClient();
  const queryEmbedding = await generateEmbedding(query);

  const { data, error } = await supabase.rpc('match_pregnancy_documents', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: limit,
    filter_week: pregnancyWeek || null,
  });

  if (error) throw error;
  return data;
}

export async function ingestDocument(
  content: string,
  title: string,
  category: string,
  pregnancyWeek?: number
) {
  const supabase = await createClient();
  const chunks = content.split(/\n\n+/).filter(chunk => chunk.length > 50);

  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk);
    await supabase.from('pregnancy_documents').insert({
      title,
      content: chunk,
      pregnancy_week: pregnancyWeek,
      category,
      embedding,
    });
  }
}
```

### 8.3 Expo Push

```typescript
// src/lib/expo-push.ts
import Expo, { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

const expo = new Expo();

export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<ExpoPushTicket> {
  if (!Expo.isExpoPushToken(pushToken)) {
    throw new Error('Invalid Expo push token');
  }

  const message: ExpoPushMessage = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  const tickets = await expo.sendPushNotificationsAsync([message]);
  return tickets[0];
}
```

---

## 9. 주의사항

1. **Embedding Dimension**: 반드시 1536 (CLAUDE.md 요구사항)
2. **No Fallback**: 폴백 로직 작성 금지
3. **git 명령어**: add, commit은 사용자 요청 시에만
4. **curl/deploy**: 실행 전 허락 필요
5. **배포**: gcloud builds submit 명령어만 사용

---

## 10. 환경 변수

```env
# 기존
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=

# 신규
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
EXPO_ACCESS_TOKEN=
IMAGEN_API_KEY=
```

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2025-12-23 | 초안 작성 및 승인 |
