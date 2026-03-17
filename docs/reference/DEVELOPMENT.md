# 부인과 챗봇 개발 문서

> 최종 업데이트: 2026-03-14

## 1. 현재 개발 기준

- 저장소는 모노레포를 유지한다.
- `apps/web`는 관리자 웹과 모바일용 서버 API만 담당한다.
- `apps/mobile`은 Expo React Native 사용자 앱이다.
- `packages/app-core`는 도메인 타입, 포트, DI 계약을 담당한다.
- 백엔드 데이터 소스는 `SERVER_DATA_PROVIDER=docker|supabase`로 명시 선택한다.
- 채팅은 메시지 단건보다 `chat_sessions` 중심으로 관리한다.
- 저장 링크는 기본적으로 `session_id`를 사용하고, 특정 답변을 다시 열어야 할 때만 `message_id`를 사용한다.
- RAG는 임신 주차별 문서를 우선 조회하는 구조를 사용한다.

## 2. 저장소 구조

```text
gynecology-chatbot/
├── apps/
│   ├── web/                    # 관리자 웹, 모바일 API
│   └── mobile/                 # Expo RN 사용자 앱
├── packages/
│   └── app-core/               # 공용 도메인 / 포트 / DI
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
  - 인사 문구
  - 캘린더 dot 및 감정 색상
  - 임신수첩
  - 임신 지식
  - FAB 기반 채팅 진입
- 채팅 뷰
  - ChatGPT 스타일 세션 목록
  - 세션 단위 recent chats
  - JSON 렌더링 메시지 파트
  - 이미지 + 텍스트 첨부
  - 앱 내부 deep link

### 관리자 웹

- 대시보드
- 사용자 검색 및 계정 복구
- 전화번호 변경, 로그인 ID 정정, 비밀번호 재설정
- 상담 로그 및 세션 기록 조회
- 감사 로그 조회

## 4. 데이터 기준

자세한 스키마는 [DATABASE_SCHEMA.md](/Users/jskang/si/gynecology-chatbot/docs/reference/DATABASE_SCHEMA.md)를 따른다.

주요 테이블:

- `users`
- `pregnancy_profiles`
- `chat_sessions`
- `chat_messages`
- `calendar_logs`
- `emotion_logs`
- `knowledge_items`
- `message_links`
- `pregnancy_documents`
- `admin_audit_logs`

핵심 관계:

- 사용자는 여러 `chat_sessions`를 가진다.
- 한 `chat_session`은 여러 `chat_messages`를 가진다.
- `calendar_logs`는 기본적으로 `session_id`를 링크한다.
- 특정 답변을 저장하거나 재오픈해야 할 때만 `message_id`를 링크한다.
- `pregnancy_documents`는 임신 주차와 카테고리 기준으로 RAG 검색에 사용한다.

## 5. API 방향

현재 방향의 최소 API 책임:

- `POST /api/mobile/chat`
  - 모바일 채팅 요청 처리
  - 세션 문맥 기준 응답 생성
  - 이미지 첨부 입력 허용
- `POST /api/push/register`
  - Expo push token 등록
- 관리자용 API
  - 사용자 검색
  - 계정 복구 액션
  - 감사 로그 조회

## 6. 환경 변수

기본 실행 명령:

```bash
pnpm dev:d   # 로컬 Docker Postgres + 로컬 시드 데이터
pnpm dev:s   # Supabase REST + Supabase 데이터
```

환경 변수 기준:

```bash
SERVER_DATA_PROVIDER=docker
ADMIN_DATA_PROVIDER=backend
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
GEMINI_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3005
EXPO_PUBLIC_API_BASE_URL=http://localhost:3005
EXPO_PUBLIC_WEB_URL=http://localhost:3005
```

## 7. 개발 원칙

- 현재 레거시 코드 구조를 기준으로 설계하지 않는다.
- PRD와 Supabase 스키마를 우선 기준으로 맞춘다.
- 모바일과 웹은 관심사를 분리하되 모노레포에서 함께 관리한다.
- 채팅은 세션 중심으로 본다.
- 임신 주차별 RAG 문서는 초기부터 스키마에 포함한다.
