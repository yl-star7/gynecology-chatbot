# 부인과 챗봇 개발 문서

> 최종 업데이트: 2026-03-19

## 1. 현재 개발 기준

- 저장소는 모노레포를 유지한다.
- `apps/web`는 관리자 웹과 모바일용 서버 API를 담당한다.
- `apps/mobile`은 Expo React Native 사용자 앱이다.
- `packages/app-core`는 도메인 타입, 포트, DI 계약을 담당한다.
- 백엔드 데이터 소스는 `SERVER_DATA_PROVIDER=docker|supabase`로 명시 선택한다.
- 사용자 인증은 `전화번호 + OTP + auth_sessions`를 사용한다.
- 채팅은 `chat_sessions` 중심으로 관리한다.
- 저장 링크는 기본적으로 `session_id`를 사용하고, 특정 답변을 다시 열어야 할 때만 `message_id`를 사용한다.
- 정적 문헌은 `content` 스키마에서 관리한다.
- RAG는 임신 주차별 문서를 우선 조회하는 구조를 사용한다.

## 2. 저장소 구조

```text
gynecology-chatbot/
├── apps/
│   ├── web/                    # 관리자 웹, 모바일 API
│   └── mobile/                 # Expo RN 사용자 앱
├── packages/
│   ├── app-core/               # 공용 도메인 / 포트 / DI
│   └── db/                     # Drizzle 스키마
├── supabase/
│   └── migrations/             # SQL 마이그레이션
├── docs/
│   └── reference/              # PRD, 스키마, 구현 기준
├── turbo.json
└── pnpm-workspace.yaml
```

## 3. 핵심 도메인

### 사용자 앱

- 홈 뷰
- 온보딩
- 세션 기반 채팅
- 임신수첩 문헌 목록과 단건 문서
- 임신 지식 문헌 목록과 단건 문서

### 관리자 웹

- 허용 전화번호 관리
- 사용자 계정 운영
- RAG 문헌 업로드
- `knowledge_items` CRUD
- 주차별 데이터 CRUD
- 감사 로그 / 사용자 이벤트 모니터링

현재 남아 있는 관리자 TODO:

- 주차별 이미지 매핑 관리 UI
- day별 세밀 편집 UI
- 주차 콘텐츠 편집 UX 단순화

## 4. 데이터 기준

주요 테이블:

- `users`
- `auth_sessions`
- `phone_verification_requests`
- `allowed_phone_numbers`
- `pregnancy_profiles`
- `chat_sessions`
- `chat_messages`
- `calendar_logs`
- `message_links`
- `user_action_logs`
- `admin_audit_logs`
- `content.knowledge_items`
- `content.pregnancy_documents`
- `content.pregnancy_weeks`
- `content.pregnancy_week_sections`
- `content.pregnancy_week_assets`

제외:

- `emotion_logs`

## 5. API 방향

현재 최소 API 책임:

- `POST /api/mobile/auth/start-phone-verification`
- `POST /api/mobile/auth/login`
- `GET /api/mobile/auth/session`
- `POST /api/mobile/chat`
- `GET /api/mobile/content-items`
- `GET /api/mobile/link`
- 관리자용 CRUD API
  - 허용 전화번호
  - `knowledge_items`
  - RAG 문헌
  - 주차별 콘텐츠

## 6. 환경 변수

기본 실행 명령:

```bash
pnpm dev:d
pnpm dev:s
```

핵심 환경 변수:

```bash
SERVER_DATA_PROVIDER=docker
ADMIN_DATA_PROVIDER=backend
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_VERIFY_SERVICE_SID=
NEXT_PUBLIC_APP_URL=http://localhost:3005
EXPO_PUBLIC_API_BASE_URL=http://localhost:3005
EXPO_PUBLIC_WEB_URL=http://localhost:3005
```

## 7. 개발 원칙

- 레거시 구조를 기준으로 설계하지 않는다.
- 현재 스키마와 런타임 구현을 우선 기준으로 맞춘다.
- 모바일과 웹은 관심사를 분리하되 모노레포에서 함께 관리한다.
- 채팅은 세션 중심으로 본다.
- 정적 콘텐츠는 `content` 스키마로 분리한다.
