# 모성간호 챗봇 코드 정렬 실행 계획

> 최종 정렬일: 2026-03-25
> 목적: 현재 저장소 구현 상태를 기준으로 실행 방향을 다시 고정한다.
> 이 문서는 기존의 "웹 중심 + Expo 래퍼" 가정을 수정한 코드 기준 문서다.

## 1. 현재 기준 결정

- `apps/web`는 관리자 콘솔, 모바일 웹 화면, Next.js API route를 함께 가진다.
- `apps/mobile`은 더 이상 단순 WebView 래퍼가 아니다. Expo Router 기반 네이티브 앱 화면과 세션, 포트, 푸시 등록 흐름을 직접 가진다.
- `packages/app-core`는 모바일/관리자 도메인 타입, 포트, 테마 프리셋의 기준이다.
- `packages/db`와 `db/migrations`는 현재 DB 계약을 반영한다.
- 인증은 전화번호 OTP 중심이다.
- 사용자 데이터 소스는 `mock` 또는 API 기반으로 전환 가능하다.
- 관리자 데이터는 서버 세션 기반으로 보호된다.

## 2. 코드 기준 아키텍처

### 웹

- 라우트 위치: `apps/web/app`
- 역할:
  - 관리자 콘솔 화면
  - 모바일 웹 대체 화면
  - 모바일 앱이 호출하는 서버 API
  - 푸시 등록 및 스케줄 실행 진입점

### 모바일

- 라우트 위치: `apps/mobile/app`
- 역할:
  - Expo Router 기반 사용자 앱
  - 네이티브 세션 저장
  - 포트 기반 서비스 조립
  - Expo 푸시 토큰 등록

### 공용 도메인

- 위치: `packages/app-core`
- 책임:
  - `HomeViewData`, `MobileProfileViewData`, `AdminDashboardData`
  - 모바일 테마 키와 프리셋
  - web/native 공용 포트 인터페이스

### 데이터 계층

- 실제 스키마 기준:
  - `public`: 인증, 프로필, 채팅, 기록, 이벤트 로그
  - `content`: 주차별 원문, 일차 콘텐츠, 체크리스트, 질문, 미디어
- 게시용 조회는 public view를 통해 읽는다.

## 3. 현재 구현된 사용자 표면

### 모바일 웹 화면 (`apps/web/app`)

- `/`
  - `MobileHomeView`
- `/today`
  - `MobileTodayView`
- `/knowledge`
  - `MobileContentIndexView` 기반 지식 목록
- `/notebook`
  - `MobileContentIndexView` 기반 기록/회고 목록
- `/profile`
  - `MobileProfileView`
- `/onboarding`
  - `MobileOnboardingView`
- `/auth/login`
  - `MobileLoginView`
- `/chat/[sessionId]`
  - `MobileConversationView`
- `/link/[target]`
  - `MobileContentView`
- `/records/[isoDate]`
  - `MobileRecordDayView`

### 네이티브 앱 화면 (`apps/mobile/app`)

- `/`
  - 세션 상태에 따라 `/auth/login`, `/onboarding`, `/home`로 리다이렉트
- `/home`
  - `PatientHomeScreen`
- `/today`
  - `PatientTodayScreen`
- `/profile`
  - `ProfileScreen`
- `/(tabs)/knowledge`
  - `ContentListScreen(section="knowledge")`
- `/(tabs)/notebook`
  - `PatientRecordsScreen`
- `/chat/[sessionId]`
  - `ChatScreen`
- `/chat/link/[target]`
  - `LinkTargetScreen`
- `/onboarding`
  - `OnboardingScreen`
- `/auth/login`
  - `LoginScreen`

## 4. 현재 구현된 관리자 표면

### 관리자 라우트 (`apps/web/app/admin`)

- `/admin`
  - `/admin/operations`로 리다이렉트
- `/admin/operations`
  - 운영 상태 패널
- `/admin/accounts`
  - 계정 관리
- `/admin/content/weeks`
  - 주차별 간호 정보 편집
- `/admin/content/policies`
  - 응답 워크플로우 관리
- `/admin/monitoring`
  - 사용자 행동/이력 모니터링
- `/admin/login`
  - 관리자 로그인

### 관리자 콘솔 구조

- `AdminConsoleShell`이 좌측 탐색과 상단 바를 제공한다.
- 현재 탐색 기준은 아래 네 묶음이다.
  - 운영 상태
  - 계정
  - 콘텐츠
  - 모니터링
- 콘텐츠 하위 탐색은 아래 두 축을 기준으로 한다.
  - 주차별 간호 정보
  - 응답 워크플로우

## 5. 현재 동작하는 API 표면

### 모바일 API (`apps/web/app/api/mobile`)

- 인증
  - `/api/mobile/auth/login`
  - `/api/mobile/auth/session`
  - `/api/mobile/auth/start-phone-verification`
- 사용자 데이터
  - `/api/mobile/home`
  - `/api/mobile/profile`
  - `/api/mobile/onboarding`
  - `/api/mobile/records`
  - `/api/mobile/weeks`
  - `/api/mobile/content-items`
  - `/api/mobile/link`
- 채팅
  - `/api/mobile/chat`
  - `/api/mobile/sessions`
  - `/api/mobile/sessions/[sessionId]`
- 기타
  - `/api/mobile/branding`

### 푸시/API 보조 경로

- `/api/push/register`
  - Expo 푸시 토큰을 `pregnancy_profiles.push_token`에 저장
- `/api/cron/proactive-chat`
  - 서버 측 proactive 실행 진입점

### 관리자 API (`apps/web/app/api/admin`)

- 인증
  - `/api/admin/auth/login`
  - `/api/admin/auth/logout`
- 운영/계정
  - `/api/admin/analytics`
  - `/api/admin/allowed-phone-numbers`
  - `/api/admin/allowed-phone-numbers/[id]`
  - `/api/admin/users/update-phone`
  - `/api/admin/users/reset-session`
- 콘텐츠
  - `/api/admin/content/weeks`
  - `/api/admin/content/weeks/[weekNumber]`
  - `/api/admin/content/checklists`
  - `/api/admin/content/knowledge-items`
  - `/api/admin/content/knowledge-items/[id]`
  - `/api/admin/content/media/upload`
  - `/api/admin/content/media/preview`
- RAG / 외부 워크플로우
  - `/api/admin/rag/upload`
  - `/api/admin/rag/documents/[documentId]`
  - `/api/admin/rag-provider`
  - `/api/admin/schift`
  - `/api/admin/schift/chat`
  - `/api/admin/schift/workflows/[workflowId]/run`
  - `/api/admin/workflow-rules/bootstrap`
  - `/api/admin/workflow-rules/[ruleId]`
- 알림/운영
  - `/api/admin/push/send`
  - `/api/admin/schedule`
  - `/api/admin/proactive/trigger`

## 6. 현재 데이터 모델 기준

### `public` 스키마

- `users`
- `auth_sessions`
- `phone_verification_requests`
- `allowed_phone_numbers`
- `pregnancy_profiles`
  - `baby_nickname`
  - `baby_sex`
  - `theme_key`
  - `notification_time`
  - `notification_enabled`
  - `push_token`
- `chat_sessions`
- `chat_messages`
- `calendar_logs`
- `message_links`
- `user_action_logs`
- `admin_audit_logs`
- `user_checklist_events`
- `user_question_events`

### `content` 스키마

- `knowledge_items`
- `pregnancy_documents`
- `pregnancy_weeks`
- `pregnancy_week_sections`
- `pregnancy_week_assets`
- `pregnancy_week_data`
- `pregnancy_day_contents`
- `pregnancy_week_media`
- `week_checklists`
- `week_questions`

### 게시/조회용 view

- `published_knowledge_items`
- `v_pregnancy_week_data`
- `v_pregnancy_day_contents`
- `v_week_checklists`
- `v_week_questions`

## 7. 기존 계획서와 달라진 핵심 포인트

### 모바일 앱 방향

- 예전 문서:
  - `apps/mobile`을 Expo 래퍼로 유지하는 가정이 강했다.
- 현재 코드:
  - 네이티브 화면이 이미 존재한다.
  - `PatientHomeScreen`, `PatientTodayScreen`, `PatientRecordsScreen` 등 네이티브 UI가 기준 축으로 올라와 있다.
  - WebView 전용 구조로 되돌리는 문서는 더 이상 맞지 않다.

### 관리자 구조

- 예전 문서:
  - 단일 대시보드 확장 중심 설명이 많았다.
- 현재 코드:
  - `operations`, `accounts`, `content`, `monitoring`으로 분리된 콘솔 구조다.
  - 사이드바 기반 탐색이 이미 고정돼 있다.

### 주차 콘텐츠 모델

- 예전 문서:
  - `pregnancy_weeks` 중심의 단순 모델 설명이 강했다.
- 현재 코드:
  - 실제 운영 모델은 `pregnancy_week_data` + `pregnancy_day_contents` + `pregnancy_week_media` + `week_checklists` + `week_questions` 조합이다.
  - 관리자 주차 상세 API도 이 구조를 전제로 patch payload를 받는다.

### 체크리스트/기록 모델

- 예전 문서:
  - 일자별 완료 로그 테이블을 별도 설계하는 방향이 강했다.
- 현재 코드:
  - 사용자 반응 추적은 `user_checklist_events`, `user_question_events` 중심이다.
  - `records` 화면은 현재 `calendar_logs`와 최근 세션 목록을 기반으로 그려진다.
  - 별도 `diary_entries` 중심 모델은 아직 현재 구현 기준이 아니다.

### 알림과 인증

- 현재 코드에 이미 존재하는 것:
  - 전화번호 OTP 시작/로그인 API
  - Expo 푸시 토큰 등록
  - proactive chat 실행 경로
- 따라서 문서는 "추가 예정"보다 "기구현 + 확장 필요"로 표현해야 한다.

## 8. 현재 코드 기준 우선 작업

### P0. 문서 정합

- `README.md`
- `docs/reference/MONOREPO_HIERARCHY.md`
- `docs/reference/IMPLEMENTATION_PLAN.md`
- 이 세 문서에서 아직 남아 있는 "Expo WebView 래퍼" 표현을 현재 구조 기준으로 정리한다.

### P1. 사용자 경험 정합

- web과 native에서 동일한 사용자 개념을 같은 이름으로 정리한다.
  - 홈
  - 오늘
  - 기록과 회고
  - 지식
  - 프로필
- 현재 web은 `/`, `/today`, `/knowledge`, `/notebook`이고 native는 `/home`, `/today`, `/(tabs)/knowledge`, `/(tabs)/notebook`이다.
- 라우트 명명과 정보 구조를 하나의 기준으로 다시 맞출 필요가 있다.

### P2. 기록/체크리스트 실데이터 연결

- `PatientTodayScreen`과 `PatientRecordsScreen`은 현재 view model 비중이 높다.
- 아래를 실제 API/DB와 더 직접 연결해야 한다.
  - 체크리스트 진행 상태
  - 질문 응답 상태
  - 일자별 기록 요약
  - 최근 세션과 기록의 연결

### P3. 관리자 콘텐츠 완성도 정리

- 현재 강한 축:
  - 주차별 데이터
  - 체크리스트
  - 워크플로우
- 추가 정리 필요:
  - 질문 관리 표면 일관화
  - 문서/RAG 업로드 흐름 정리
  - 미디어 업로드와 preview 흐름 정리
  - 감사 로그 표시 기준 정리

### P4. 데이터 계약 통합

- `packages/db`
- `db/migrations`
- `docs/reference/DATABASE_SCHEMA.md`
- 세 축의 이름과 설명을 동일하게 맞춘다.
- 특히 아래 용어를 혼용하지 않도록 정리한다.
  - `pregnancy_weeks` vs `pregnancy_week_data`
  - `week_checklists` vs 사용자 완료 이벤트
  - `notebook` vs records/회고

## 9. 실행 원칙

- 새 작업은 현재 라우트와 스키마를 기준으로 설명한다.
- 이미 존재하는 네이티브 화면을 무시하고 web-only 계획으로 되돌리지 않는다.
- 관리자 콘솔은 현재 분리된 정보 구조를 유지한 채 확장한다.
- 게시용 조회는 public view를 우선 사용한다.
- 문서가 코드보다 앞서 나가더라도, 코드에 없는 테이블/화면을 현재 상태처럼 쓰지 않는다.

## 10. 바로 적용할 다음 문서 작업

1. `README.md`의 현재 방향 설명을 native 앱 기준으로 수정
2. `docs/reference/IMPLEMENTATION_PLAN.md`를 phone-only 인증 + native 앱 구조에 맞게 재작성
3. `docs/reference/DATABASE_SCHEMA.md`에 `pregnancy_week_data`, `pregnancy_day_contents`, `pregnancy_week_media`, `week_questions`, `user_checklist_events`, `user_question_events`를 명시적으로 반영

## 11. 참고 기준 파일

- 웹 사용자 라우트: `apps/web/app`
- 관리자 라우트: `apps/web/app/admin`
- 모바일 앱 라우트: `apps/mobile/app`
- 모바일 네이티브 화면: `apps/mobile/src/screens`
- 관리자 콘솔 셸: `apps/web/src/components/admin/AdminConsoleShell.tsx`
- 모바일 API 직렬화: `apps/web/src/lib/mobile/serializers.ts`
- 관리자 주차 상세 API: `apps/web/app/api/admin/content/weeks/[weekNumber]/route.ts`
- DB 계약: `packages/db/src/schema.ts`

## 12. 결론

- 현재 저장소는 "웹 관리자 + 모바일 웹 보조 화면 + 네이티브 Expo 앱 + 공용 도메인 + Cloud SQL/Postgres" 구조다.
- 앞으로의 과업 지시서는 이 구조를 기준으로 작성해야 한다.
- 특히 `apps/mobile`을 단순 래퍼로 취급하는 설명은 더 이상 사용하지 않는다.
