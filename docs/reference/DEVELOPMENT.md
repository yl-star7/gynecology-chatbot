# 부인과 챗봇 개발 문서

> 최종 업데이트: 2026-04-17

## 1. 현재 개발 기준

- 저장소는 모노레포를 유지한다.
- `apps/web`는 관리자 웹과 모바일용 서버 API를 담당한다.
- `apps/mobile`은 Expo React Native 사용자 앱이다.
- `packages/app-core`는 도메인 타입, 포트, DI 계약을 담당한다.
- 백엔드 데이터 소스는 `SERVER_DATA_PROVIDER=docker|supabase`로 명시 선택한다.
- 사용자 인증은 `전화번호 + OTP + auth_sessions`를 사용한다.
- 채팅은 `chat_sessions` 중심으로 관리한다.
- 저장 링크는 기본적으로 `session_id`를 사용하고, 특정 답변을 다시 열어야 할 때만 `message_id`를 사용한다.
- 운영 API는 public mirror 테이블을 우선 사용한다. 주차/질문/체크리스트/문헌은 `content_*` public 테이블과 view 기준으로 조회한다.
- RAG는 임신 주차별 문서를 우선 조회하는 구조를 사용한다.
- 상담 성향은 사용자 고정 컬럼이 아니라 `user_persona_signals` 이벤트와 `v_user_persona_profiles` view로 관리한다.

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
│   ├── migrations/             # 원격 Supabase history와 맞는 active migration chain
│   └── migrations_legacy/      # baseline 이전 historical migration 보관
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
- `content_knowledge_items` CRUD
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
- `user_persona_signals`
- `admin_audit_logs`
- `content_knowledge_items`
- `content_pregnancy_documents`
- `content_pregnancy_week_data`
- `content_pregnancy_day_contents`
- `content_week_checklists`
- `content_week_questions`
- `content_pregnancy_week_media`

주요 view:

- `v_user_persona_profiles`
- `v_user_calendar_activity`

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
  - `content_knowledge_items`
  - RAG 문헌
  - 주차별 콘텐츠
  - 상담 성향 profile/signals 조회와 수동 signal 추가 (`/api/admin/users/persona`)

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
- 정적 콘텐츠는 운영 REST API에서 public mirror 테이블을 기준으로 다룬다.

## 8. Supabase migration 운영 기준

`supabase/migrations/`는 linked Supabase 프로젝트의 remote migration history와 1:1로 맞는 active chain만 둔다.

현재 active chain:

```text
20251223_create_calendar_logs.sql
20260331172420_move_content_to_public_and_drop_allowlist.sql
20260417120200_add_user_persona_signals.sql
```

baseline 이전 historical SQL은 `supabase/migrations_legacy/pre-remote-baseline-20260417/`에 보관한다. 운영 DB에 다시 push하지 않는다.

새 migration 규칙:

- 파일명은 `YYYYMMDDHHMMSS_description.sql` 형식으로 만든다.
- 같은 날짜 prefix만 쓰는 migration을 만들지 않는다.
- seed/drop/compatibility SQL은 운영 DB 재실행 위험이 있으므로 active chain에 되살리지 않는다.
- 적용 전후에 아래 명령으로 remote/local 차이를 확인한다.

```bash
direnv exec /Users/jskang/Projects/si supabase db push --dry-run
direnv exec /Users/jskang/Projects/si supabase migration list
```

정상 상태:

```text
Remote database is up to date.

Local          | Remote
20251223       | 20251223
20260331172420 | 20260331172420
20260417120200 | 20260417120200
```
