# 부인과 AI 챗봇 (Gynecology AI Chatbot)

> 전문의와 함께하는 건강한 임신 여정을 위한 AI 기반 상담 서비스

![License](https://img.shields.io/badge/license-MIT-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)
![Turborepo](https://img.shields.io/badge/Turborepo-2-EF4444.svg)

## 🌟 주요 기능

- **🤖 AI 상담**: Google Gemini 2.0 Flash + LangChain RAG
- **💬 실시간 채팅**: SSE 스트리밍 (Vercel AI SDK)
- **👤 AI 페르소나**: 따뜻한 친구 / 전문 상담사 / 간결한 답변
- **📋 스마트 설문**: Google Forms 스타일 동적 설문
- **🔔 선제적 대화**: pg_cron + Expo Push 알림
- **🎨 이미지 생성**: Google Imagen 연동
- **📱 모바일 앱**: Expo WebView (Android/iOS)
- **🔐 인증**: Supabase Auth + 카카오 OAuth

---

## 🏗️ 프로젝트 구조 (Turborepo 모노레포)

```
gynecology-chatbot/
├── apps/
│   ├── web/                    # Next.js 15 웹앱
│   │   ├── prisma/             # Prisma 스키마 + seed
│   │   └── src/
│   │       ├── app/api/        # API Routes
│   │       ├── components/     # React 컴포넌트
│   │       └── lib/            # 유틸리티
│   │           ├── langchain/  # LangChain RAG
│   │           └── rag/        # pgvector RAG
│   │
│   └── mobile/                 # Expo 앱 (WebView)
│
├── packages/
│   └── types/                  # 공유 TypeScript 타입
│
├── supabase/
│   ├── functions/              # Edge Functions
│   └── migrations/             # DB 마이그레이션
│
├── docs/                       # 문서
│   ├── DEVELOPMENT.md          # 개발 가이드
│   ├── DATABASE_SCHEMA.md      # DB 스키마
│   └── IMPLEMENTATION_PLAN.md  # 구현 계획
│
├── turbo.json
└── pnpm-workspace.yaml
```

---

## 🛠️ 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS 4 |
| **Backend** | Next.js API Routes (SSE), Prisma |
| **Database** | Supabase PostgreSQL + pgvector |
| **AI** | Gemini 2.0 Flash, LangChain, Imagen |
| **Mobile** | Expo (React Native WebView) |
| **Auth** | Supabase Auth + 카카오 OAuth |
| **Push** | Expo Push + pg_cron |

---

## 🚀 빠른 시작

### 1. 저장소 클론 및 의존성 설치

```bash
git clone <repository-url>
cd gynecology-chatbot
pnpm install
```

### 2. 환경변수 설정

`apps/web/.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Prisma
DATABASE_URL=postgresql://...

# AI
GEMINI_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=

# 카카오 OAuth
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
```

### 3. 데이터베이스 설정

```bash
cd apps/web
pnpm db:push        # 스키마 푸시
pnpm db:seed        # 초기 데이터
```

### 4. 개발 서버

```bash
pnpm dev
```

브라우저에서 http://localhost:3000 열기

---

## 📱 모바일 앱 (Expo)

```bash
cd apps/mobile
pnpm install
npx expo start
```

---

## 📚 문서

| 문서 | 설명 |
|------|------|
| [DEVELOPMENT.md](./docs/DEVELOPMENT.md) | 개발 가이드, API 레퍼런스 |
| [DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md) | DB 테이블 상세, form_schema 예시 |
| [IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md) | 전체 구현 계획 |
| [SYSTEM_DOCUMENTATION.md](./SYSTEM_DOCUMENTATION.md) | 비개발자용 설명서 |

---

## 🔧 주요 스크립트

```bash
# 루트
pnpm dev          # 전체 개발 서버
pnpm build        # 전체 빌드
pnpm lint         # 린트

# apps/web
pnpm db:push      # Prisma 스키마 푸시
pnpm db:migrate   # 마이그레이션 생성
pnpm db:seed      # 시드 데이터
pnpm db:studio    # Prisma Studio
```

---

## 🗄️ 데이터베이스 테이블

| 테이블 | 용도 |
|--------|------|
| `users` | 사용자 (auth.users 참조) |
| `conversations` | 채팅 세션 |
| `messages` | 채팅 메시지 |
| `ai_personas` | AI 페르소나 설정 |
| `survey_templates` | 동적 설문 스키마 |
| `proactive_trigger_types` | 선제 대화 트리거 (pg_cron) |
| `pregnancy_documents` | RAG 문서 (pgvector) |

자세한 내용: [DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md)

---

## 📞 문의

이메일: support@gynecology-ai.com
