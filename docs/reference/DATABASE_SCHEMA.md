# Current Database Schema

> 기준일: 2026-04-17

현재 운영 기준은 Supabase PostgreSQL + public mirror 테이블 + Schift workflow 연동이다.  
`supabase/migrations/`는 linked Supabase 프로젝트의 migration history와 맞는 active chain만 둔다.

## 1. 설계 원칙

- 사용자 인증은 `전화번호 + OTP + auth_sessions`를 사용한다.
- 전화번호는 평문 저장하지 않고 암호문/블라인드 인덱스/last4로 분리한다.
- 채팅은 `chat_sessions`와 `chat_messages` 중심으로 저장한다.
- 장기 상담 성향은 사용자 컬럼에 고정하지 않는다. `user_persona_signals`에 관찰 신호를 쌓고 `v_user_persona_profiles` view에서 현재 대표 성향을 계산한다.
- 운영 REST API는 public schema의 mirror 테이블을 우선 사용한다.
- 과거 `content.*` 객체는 historical/reference 성격이며, 운영 API의 기준은 `public.content_*` 테이블이다.
- 감정 기록은 별도 `emotion_logs` 테이블로 운영하지 않는다. 필요한 감정/성향은 채팅 memory 또는 persona signal로 저장한다.

## 2. Active Migration Chain

현재 active chain:

```text
20251223_create_calendar_logs.sql
20260331172420_move_content_to_public_and_drop_allowlist.sql
20260417120200_add_user_persona_signals.sql
```

baseline 이전 migration은 아래 archive에 보관한다.

```text
supabase/migrations_legacy/pre-remote-baseline-20260417/
```

새 migration은 `YYYYMMDDHHMMSS_description.sql` 형식으로 작성한다. 적용 전후에는 `supabase db push --dry-run`과 `supabase migration list`로 remote/local 차이를 확인한다.

## 3. Public Tables

### `users`

- 목적: 인증 루트 사용자
- 주요 컬럼:
  - `id`
  - `role`
  - `phone_number_encrypted`
  - `phone_number_blind_index`
  - `phone_number_last4`
  - `account_status`
  - `phone_verified_at`
  - `last_login_at`
  - `created_at`
  - `updated_at`

### `auth_sessions`

- 목적: 장기 로그인 세션
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
  - `phone_number_encrypted`
  - `phone_number_blind_index`
  - `phone_number_last4`
  - `verification_sid`
  - `channel`
  - `status`
  - `attempt_count`
  - `expires_at`
  - `verified_at`
  - `created_at`

### `blocked_phone_numbers`

- 목적: 차단 번호 관리
- 주요 컬럼:
  - `id`
  - `phone_number_encrypted`
  - `phone_number_blind_index`
  - `phone_number_last4`
  - `display_name`
  - `note`

### `pregnancy_profiles`

- 목적: 사용자 앱 프로필과 임신 프로필
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
  - `push_token`
  - `onboarding_payload`

`onboarding_payload.profileMemory`에는 기존 감정 톤처럼 단순 장기 메모리만 저장한다. 상담 성향 persona는 `user_persona_signals`에 별도로 저장한다.

### `chat_sessions`

- 목적: 세션 단위 채팅 메타데이터
- 주요 컬럼:
  - `id`
  - `user_id`
  - `title`
  - `status`
  - `last_message_at`
  - `memory_payload`
  - `created_at`
  - `updated_at`

`memory_payload`에는 다음 턴을 잇기 위한 compact summary, 직전 scenario, character tone, emotion tone을 저장한다.

### `chat_messages`

- 목적: 세션 내부 메시지
- 주요 컬럼:
  - `id`
  - `session_id`
  - `user_id`
  - `role`
  - `parts`
  - `plain_text`
  - `image_attachments`
  - `model_name`
  - `created_at`

### `calendar_logs`

- 목적: 캘린더 표시용 저장/요약 기록
- 주요 컬럼:
  - `user_id`
  - `session_id`
  - `date`
  - `entry_type`
  - `title`
  - `summary`
  - `payload`

### `user_action_logs`

- 목적: 사용자 이벤트 로그
- 주요 이벤트:
  - `login_succeeded`
  - `phone_verification_started`
  - `phone_verified`
  - `onboarding_completed`
  - `profile_updated`
  - `chat_message_sent`

### `user_persona_signals`

- 목적: 대화에서 관찰한 상담 성향 신호 저장
- 사용자에게 직접 노출하지 않는 내부 톤 조절용 데이터다.
- 주요 컬럼:
  - `user_id`
  - `session_id`
  - `source_message_id`
  - `persona_hint`
  - `confidence`
  - `evidence`
  - `weight`
  - `observed_at`
  - `created_at`

허용 값:

```text
persona_hint: anxious | positive | introverted | practical | unknown
confidence: low | medium | high
```

기본 weight:

```text
low = 1
medium = 2
high = 3
```

### `user_checklist_events`

- 목적: 체크리스트 제안/완료 이력
- 주요 컬럼:
  - `user_id`
  - `checklist_id`
  - `session_id`
  - `prompt_message_id`
  - `completion_message_id`
  - `status`
  - `sent_at`
  - `completed_at`

### `user_question_events`

- 목적: 모아애착 질문 제안/응답 이력
- 주요 컬럼:
  - `user_id`
  - `question_id`
  - `session_id`
  - `prompt_message_id`
  - `answer_message_id`
  - `status`
  - `sent_at`
  - `answered_at`

### `admin_audit_logs`

- 목적: 관리자 변경 감사 로그
- 주요 컬럼:
  - `admin_user_id`
  - `target_user_id`
  - `action_type`
  - `entity_type`
  - `entity_id`
  - `reason`
  - `before_payload`
  - `after_payload`

### `workflow_definitions`

- 목적: Schift workflow metadata와 관리자 정책 목록
- 주요 컬럼:
  - `id`
  - `name`
  - `slug`
  - `provider`
  - `status`
  - `is_active`
  - `config`
  - `metadata`

## 4. Public Content Tables

운영 API는 아래 public mirror 테이블을 기준으로 조회한다.

### `content_pregnancy_week_data`

- 목적: 주차별 루트 콘텐츠
- 주요 컬럼:
  - `week_number`
  - `title`
  - `baby_size_label`
  - `baby_size_compare_object`
  - `baby_summary`
  - `mother_summary`
  - `warning_signs`
  - `recommended_actions`
  - `checklist_intro`
  - `question_intro`
  - `status`

### `content_pregnancy_day_contents`

- 목적: 주차 내 일차별 콘텐츠
- 주요 컬럼:
  - `week_data_id`
  - `day_number`
  - `title`
  - `baby_development_payload`
  - `baby_message`
  - `mother_changes_payload`
  - `display_order`

### `content_week_checklists`

- 목적: 일차/주차별 체크리스트
- 주요 컬럼:
  - `week_data_id`
  - `day_content_id`
  - `day_number`
  - `code`
  - `title`
  - `description`
  - `checklist_payload`
  - `display_order`
  - `is_required`
  - `is_active`

### `content_week_questions`

- 목적: 모아애착 질문
- 주요 컬럼:
  - `week_data_id`
  - `day_content_id`
  - `day_number`
  - `code`
  - `question_text`
  - `question_type`
  - `help_text`
  - `question_payload`
  - `display_order`
  - `is_required`
  - `is_active`

### `content_pregnancy_week_media`

- 목적: 주차/일차별 미디어
- 주요 컬럼:
  - `week_data_id`
  - `day_content_id`
  - `day_number`
  - `media_scope`
  - `bucket_id`
  - `object_path`
  - `media_role`
  - `alt_text`
  - `source_file_name`
  - `display_order`

### `content_pregnancy_documents`

- 목적: RAG 문헌
- 주요 컬럼:
  - `title`
  - `content`
  - `pregnancy_week`
  - `category`
  - `image_url`
  - `embedding`
  - `metadata`

### `content_knowledge_items`

- 목적: 지식/안내 콘텐츠
- 주요 컬럼:
  - `slug`
  - `section`
  - `title`
  - `body`
  - `image_url`
  - `status`
  - `published_at`

## 5. Views

### `v_user_persona_profiles`

- 목적: `user_persona_signals`를 합산해 현재 대표 상담 성향을 제공
- 주요 컬럼:
  - `user_id`
  - `persona_hint`
  - `confidence`
  - `evidence_summary`
  - `weighted_score`
  - `last_observed_at`

점수 계산:

```text
weighted_score = sum(weight * recency_multiplier)
```

recency multiplier:

```text
최근 7일: 1.0
최근 30일: 0.7
최근 90일: 0.4
그 이전: 0.2
```

confidence 변환:

```text
weighted_score >= 6: high
weighted_score >= 2: medium
그 외: low
```

### `v_user_calendar_activity`

- 목적: 캘린더 활동 날짜 집계
- source:
  - 사용자 채팅 메시지
  - 완료된 체크리스트
  - 응답된 질문
  - 기존 `calendar_logs`

## 6. Schift Workflow Data Flow

채팅 API는 Schift workflow에 아래 장기/단기 메모리를 전달한다.

- `compactSummary`
- `lastScenario`
- `lastCharacterTone`
- `lastEmotionTone`
- `personaHint`
- `personaConfidence`
- `tonePreference`

workflow가 `nextProfileMemory.personaHint`, `personaConfidence`, `personaEvidence`를 반환하면 API는 이를 `user_persona_signals`에 저장한다. `personaHint`는 내부 톤 조절용이며 사용자에게 라벨로 표시하지 않는다.

## 7. Excluded / Legacy

### `emotion_logs`

- 현재 운영하지 않는다.
- 감정 톤은 session/profile memory에 저장하고, 상담 성향은 `user_persona_signals`로 저장한다.

### Legacy migrations

- `supabase/migrations_legacy/pre-remote-baseline-20260417/`는 historical reference다.
- 운영 DB에 다시 적용하지 않는다.
