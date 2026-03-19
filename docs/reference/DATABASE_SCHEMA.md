# Current Database Schema

> 기준일: 2026-03-19

현재 기준 스키마는 `전화번호-only 인증`, `서버 세션`, `content` 스키마 분리를 따른다.

## 1. 설계 원칙

- 사용자 인증은 `전화번호 + OTP`만 사용한다.
- 사용자 비밀번호는 운영하지 않는다.
- 인증 테이블과 앱 프로필 테이블은 분리한다.
- 정적 문헌은 `public`이 아니라 `content` 스키마에 둔다.
- 감정 기록은 현재 독립 테이블로 운영하지 않는다.

## 2. `public` 스키마

### `users`

- 목적: 인증 루트
- 주요 컬럼:
  - `id`
  - `phone_number`
  - `role`
  - `account_status`
  - `phone_verified_at`
  - `last_login_at`
  - `created_at`
  - `updated_at`

### `auth_sessions`

- 목적: 1년 로그인 유지용 서버 세션
- 주요 컬럼:
  - `id`
  - `user_id`
  - `refresh_token_hash`
  - `device_label`
  - `last_used_at`
  - `expires_at`
  - `revoked_at`
  - `created_at`

### `phone_verification_requests`

- 목적: OTP 발송/검증 이력
- 주요 컬럼:
  - `id`
  - `phone_number`
  - `verification_sid`
  - `channel`
  - `status`
  - `attempt_count`
  - `expires_at`
  - `verified_at`
  - `created_at`

### `allowed_phone_numbers`

- 목적: 연구 참여 허용 번호 화이트리스트
- 주요 컬럼:
  - `id`
  - `phone_number`
  - `display_name`
  - `note`
  - `created_at`
  - `updated_at`

### `pregnancy_profiles`

- 목적: 사용자 프로필 + 임신 프로필 통합
- 주요 컬럼:
  - `user_id`
  - `display_name`
  - `pregnancy_status`
  - `pregnancy_day_count`
  - `pregnancy_week`
  - `pregnancy_day_in_week`
  - `due_date`
  - `baby_nickname`
  - `baby_sex`
  - `theme_key`
  - `notification_time`
  - `notification_enabled`
  - `onboarding_payload`

### `chat_sessions`

- 목적: 세션 단위 채팅 메타데이터

### `chat_messages`

- 목적: 세션 내부 메시지 저장

### `calendar_logs`

- 목적: 후처리 저장 기록
- 메모:
  - 직접 원천 입력보다 저장/요약 결과물 성격

### `message_links`

- 목적: assistant 메시지와 내부 문헌 딥링크 연결
- 현재 구조:
  - `message_id`
  - `target_type`
  - `target_id`
  - `target_path`
  - `target_section`
  - `created_at`

### `user_action_logs`

- 목적: 사용자 이벤트 로그

### `admin_audit_logs`

- 목적: 관리자 감사 로그

## 3. `content` 스키마

### `content.knowledge_items`

- 목적: 사용자 앱의 `knowledge` / `notebook` 정적 문헌

### `content.pregnancy_documents`

- 목적: RAG 문헌

### `content.pregnancy_weeks`

- 목적: 주차별 요약 메타데이터

### `content.pregnancy_week_sections`

- 목적: 주차별 본문 섹션

### `content.pregnancy_week_assets`

- 목적: 주차별 에셋 메타데이터

## 4. 제외된 테이블

### `emotion_logs`

- 현재 운영하지 않는다.
- 필요하면 채팅/이미지 후처리 기반 파생 테이블로 다시 설계한다.

## 5. 런타임 기준

- 로그인: `allowed_phone_numbers` 확인 -> OTP 검증 -> `users` upsert -> `auth_sessions` 발급
- 사용자 이름 표시: `pregnancy_profiles.display_name`
- 사용자 문헌 탐색: `content.knowledge_items`
- 관리자 CRUD: `allowed_phone_numbers`, `content.knowledge_items`, `content.pregnancy_documents`, `content.pregnancy_weeks*`
