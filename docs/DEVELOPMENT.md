# 부인과 챗봇 개발 문서

> 최종 업데이트: 2025-12-23

## 목차
1. [프로젝트 구조](#프로젝트-구조)
2. [기술 스택](#기술-스택)
3. [데이터베이스](#데이터베이스)
4. [API 엔드포인트](#api-엔드포인트)
5. [개발 환경 설정](#개발-환경-설정)

---

## 프로젝트 구조

```
gynecology-chatbot/
├── apps/
│   ├── web/                    # Next.js 15 웹앱
│   │   ├── prisma/             # Prisma 스키마
│   │   ├── src/
│   │   │   ├── app/            # App Router
│   │   │   │   └── api/        # API Routes
│   │   │   ├── components/     # React 컴포넌트
│   │   │   │   ├── chat/       # 채팅 UI
│   │   │   │   └── onboarding/ # 온보딩 위자드
│   │   │   ├── hooks/          # 커스텀 훅
│   │   │   └── lib/            # 유틸리티
│   │   │       ├── langchain/  # LangChain 통합
│   │   │       └── rag/        # RAG 시스템
│   │   └── package.json
│   │
│   └── mobile/                 # Expo 앱 (WebView)
│       ├── app/                # Expo Router
│       ├── hooks/              # Push 알림 등
│       └── package.json
│
├── packages/
│   └── types/                  # 공유 TypeScript 타입
│
├── docs/
│   ├── IMPLEMENTATION_PLAN.md  # 구현 계획
│   └── DATABASE_SCHEMA.md      # DB 스키마 문서
│
├── turbo.json                  # Turborepo 설정
└── pnpm-workspace.yaml
```

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| **프론트엔드** | Next.js 15, React 19, TypeScript, Tailwind CSS |
| **백엔드** | Next.js API Routes (SSE 스트리밍) |
| **DB** | Supabase (PostgreSQL + pgvector) |
| **ORM** | Prisma |
| **AI** | Google Gemini 2.0 Flash, LangChain |
| **RAG** | pgvector + Gemini Embeddings (1536 dim) |
| **이미지 생성** | Google Imagen |
| **인증** | Supabase Auth + 카카오 OAuth |
| **모바일** | Expo (React Native WebView) |
| **푸시 알림** | Expo Push + pg_cron |
| **배포** | Vercel (Tokyo region) |

---

## 데이터베이스

자세한 스키마: [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

### 주요 테이블

| 테이블 | 용도 |
|--------|------|
| `users` | 사용자 프로필 (auth.users 참조) |
| `conversations` | 채팅 세션 |
| `messages` | 채팅 메시지 (SSE 완료 후 저장) |
| `ai_personas` | AI 페르소나 설정 |
| `survey_templates` | 설문 폼 스키마 (Google Forms 스타일) |
| `survey_responses` | 설문 응답 |
| `proactive_trigger_types` | 선제 대화 트리거 (pg_cron) |
| `proactive_conversations` | 선제 대화 스케줄 |
| `pregnancy_documents` | RAG 문서 (pgvector 임베딩) |

---

## API 엔드포인트

### 인증
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/auth/kakao` | 카카오 OAuth 시작 |
| GET | `/auth/kakao/callback` | 카카오 콜백 |

### 온보딩
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/onboarding` | 온보딩 데이터 저장 |
| GET | `/api/onboarding` | 온보딩 상태 확인 |

### 채팅
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/chat` | SSE 스트리밍 채팅 (RAG + 페르소나) |

### 대화
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/conversations` | 대화 목록 |
| POST | `/api/conversations` | 새 대화 생성 |
| GET | `/api/conversations/[id]/messages` | 대화 메시지 조회 |

### 페르소나
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/personas` | 페르소나 목록 |
| GET | `/api/personas/current` | 현재 페르소나 |
| POST | `/api/personas/switch` | 페르소나 변경 |

### 메시지
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/messages/save` | 메시지 저장 |
| GET | `/api/messages/saved` | 저장된 메시지 목록 |
| POST | `/api/messages/share` | 공유 활성화 |

### 설문
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/surveys/current` | 현재 주차 설문 |
| POST | `/api/surveys/[id]/submit` | 설문 제출 |

### RAG
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/rag` | 문서 검색 |
| POST | `/api/rag/ingest` | DOCX 업로드 |

### 푸시
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/push/register` | 푸시 토큰 등록 |
| POST | `/api/push/send` | 푸시 알림 전송 (Edge Function용) |

---

## 개발 환경 설정

### 1. 의존성 설치
```bash
pnpm install
```

### 2. 환경 변수
```bash
# apps/web/.env.local

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

### 3. DB 마이그레이션
```bash
cd apps/web
pnpm db:push       # 개발: 스키마 직접 푸시
pnpm db:migrate    # 프로덕션: 마이그레이션 생성
pnpm db:studio     # GUI
```

### 4. 개발 서버
```bash
pnpm dev
```

### 5. 모바일 (Expo)
```bash
cd apps/mobile
npx expo start
```

---

## 참고 문서

- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - 상세 구현 계획
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - DB 스키마 상세
- [SYSTEM_DOCUMENTATION.md](../SYSTEM_DOCUMENTATION.md) - 비개발자용 설명서
