# 기술 문서 (시스템 구성도 및 API 명세)

**프로젝트**: 모성간호 AI 상담 챗봇
**버전**: 1.0
**작성일**: 2026-03-30
**납품 기준**: SOW v1.1 제14조

---

## 1. 시스템 구성도

```
                        +-----------------+
                        |   사용자 (산모)   |
                        +--------+--------+
                                 |
                    +------------+------------+
                    |                         |
            +-------v-------+       +--------v--------+
            |  모바일 앱     |       |   모바일 웹뷰    |
            |  (Expo/RN)    |       |   (Next.js)     |
            +-------+-------+       +--------+--------+
                    |                         |
                    +------------+------------+
                                 |
                         +-------v-------+
                         |   API 서버     |
                         |  (Next.js)    |
                         |  legacyBackend 배포   |
                         +---+---+---+---+
                             |   |   |
              +--------------+   |   +--------------+
              |                  |                   |
      +-------v------+  +-------v-------+   +-------v-------+
      |   legacyBackend   |  |  AI 워크플로우  |   |    Twilio     |
      |  PostgreSQL  |  |  (Schift SDK) |   |   SMS/OTP     |
      |  + Storage   |  +-------+-------+   +---------------+
      +--------------+          |
                         +------v-------+
                         | Google Gemini |
                         |   LLM API    |
                         +--------------+

            +------------------+
            |   관리자 콘솔     |
            |  (Next.js Web)   |
            +--------+---------+
                     |
              Admin API (/api/admin/*)
```

### 구성 요소

| 구성 요소 | 기술 | 역할 |
|-----------|------|------|
| 모바일 앱 | Expo 52 + React Native 0.76 | 사용자 앱 (iOS/Android) |
| 웹 서버/API | Next.js 15 (App Router) | API 서버 + 관리자 콘솔 + 모바일 웹뷰 |
| 데이터베이스 | PostgreSQL 15 (legacyBackend) | 사용자, 세션, 채팅, 콘텐츠 저장 |
| AI 엔진 | Google Gemini + Schift SDK | 상담 응답 생성, 워크플로우 제어 |
| 인증/SMS | Twilio Verify + Messages | 전화번호 OTP 인증, SMS 알림 |
| 푸시 알림 | Expo Server SDK | 모바일 푸시 알림 발송 |
| 파일 저장소 | legacyBackend Storage | 이미지, 문서 파일 저장 |
| 배포 (웹) | legacyBackend | 서버리스 배포 + Cron 스케줄링 |
| 배포 (앱) | EAS Build | iOS/Android 앱 빌드 및 배포 |

---

## 2. API 명세

### 2.1 인증 패턴

| 영역 | 인증 방식 | 구현 |
|------|-----------|------|
| 모바일 API | Bearer 토큰 (세션 기반, 1년 유효) | `requireMobileSession(request)` |
| 관리자 API | HTTP 쿠키 세션 | `readAdminSessionUser()` + 401 |
| Cron API | Bearer 토큰 (`CRON_SECRET`) | Authorization 헤더 검증 |

### 2.2 모바일 API (`/api/mobile/*`)

#### 인증

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/api/mobile/auth/start-phone-verification` | 불필요 | 전화번호 OTP 발송 요청 (5회/분 제한) |
| POST | `/api/mobile/auth/login` | 불필요 | OTP 검증 후 세션 발급 (10회/분 제한) |
| GET | `/api/mobile/auth/session` | 불필요 | 현재 세션 유효성 확인 |

#### 홈/오늘/기록

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/mobile/home` | 필요 | 홈 화면 데이터 (프로필, 캘린더 기록) |
| GET | `/api/mobile/today` | 필요 | 오늘의 콘텐츠 (아기/산모 정보, 체크리스트) |
| PATCH | `/api/mobile/today` | 필요 | 체크리스트 완료 처리, 정보 조회 기록 |
| GET | `/api/mobile/records` | 필요 | 일별 캘린더 기록, 감정 체크인, 대화 요약 |
| POST | `/api/mobile/records` | 필요 | 감정 체크인 기록 |

#### 프로필/설문

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/mobile/profile` | 필요 | 사용자 프로필 조회 |
| PATCH | `/api/mobile/profile` | 필요 | 프로필 수정 (이름, 예정일, 톤, 태명, 테마) |
| POST | `/api/mobile/profile/surveys` | 필요 | 주차별 설문 응답 제출 |

#### 온보딩/콘텐츠

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/api/mobile/onboarding` | 필요 | 온보딩 완료 (예정일, 톤, 테마 설정) |
| GET | `/api/mobile/weeks` | 필요 | 발행된 임신 주차 목록 |
| GET | `/api/mobile/content-items` | 필요 | 지식 콘텐츠 목록 (페이지네이션) |
| GET | `/api/mobile/link` | 필요 | 딥링크 대상 콘텐츠 조회 |

#### 채팅

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/api/mobile/chat` | 필요 | AI 상담 메시지 전송 (20회/분 제한) |
| GET | `/api/mobile/sessions` | 필요 | 채팅 세션 목록 |
| GET | `/api/mobile/sessions/[sessionId]` | 필요 | 세션 상세 + 메시지 이력 |

#### 기타

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/mobile/branding` | 불필요 | 마스코트 이미지 URL, 설문 폼 URL |
| POST | `/api/push/register` | 필요 | 디바이스 푸시 토큰 등록 |

### 2.3 관리자 API (`/api/admin/*`)

#### 인증

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/api/admin/auth/login` | 불필요 | 관리자 로그인 (전화번호 + 비밀번호, 5회/분 제한) |
| POST | `/api/admin/auth/logout` | 불필요 | 관리자 세션 종료 |

#### 사용자 관리

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/admin/users/status` | 필요 | 사용자 상태 조회 |
| POST | `/api/admin/users/status` | 필요 | 사용자 계정 상태 변경 (중단/활성화) |
| POST | `/api/admin/users/update-phone` | 필요 | 사용자 전화번호 변경 |
| POST | `/api/admin/users/reset-session` | 필요 | 사용자 세션 강제 초기화 |
| GET | `/api/admin/users/persona?userId={id}` | 필요 | 사용자 상담 성향 profile/signals 조회 |
| POST | `/api/admin/users/persona` | 필요 | 상담 성향 signal 수동 추가 |

#### 허용 전화번호

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/admin/allowed-phone-numbers` | 필요 | 허용 전화번호 목록 |
| POST | `/api/admin/allowed-phone-numbers` | 필요 | 허용 전화번호 추가 |
| GET | `/api/admin/allowed-phone-numbers/[id]` | 필요 | 개별 항목 조회 |
| PATCH | `/api/admin/allowed-phone-numbers/[id]` | 필요 | 항목 수정 |
| DELETE | `/api/admin/allowed-phone-numbers/[id]` | 필요 | 항목 삭제 |

#### 콘텐츠: 지식 항목

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/admin/content/knowledge-items` | 필요 | 지식 항목 목록 |
| POST | `/api/admin/content/knowledge-items` | 필요 | 지식 항목 생성 |
| PATCH | `/api/admin/content/knowledge-items/[id]` | 필요 | 지식 항목 수정 |

#### 콘텐츠: 임신 주차

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/admin/content/weeks` | 필요 | 임신 주차 목록 |
| GET | `/api/admin/content/weeks/[weekNumber]` | 필요 | 주차 상세 조회 |
| PATCH | `/api/admin/content/weeks/[weekNumber]` | 필요 | 주차 콘텐츠 수정 (섹션, 체크리스트, 질문) |

#### 콘텐츠: 미디어

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/api/admin/content/media/upload` | 필요 | 미디어 업로드 (서명된 URL 생성) |
| GET | `/api/admin/content/media/preview` | 필요 | 업로드된 미디어 미리보기 |

#### RAG 문서

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/api/admin/rag/upload` | 필요 | RAG 문서 생성 |
| GET | `/api/admin/rag/documents/[documentId]` | 필요 | 문서 상세 조회 |
| PATCH | `/api/admin/rag/documents/[documentId]` | 필요 | 문서 수정 |
| DELETE | `/api/admin/rag/documents/[documentId]` | 필요 | 문서 삭제 |

#### 워크플로우 규칙

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/admin/workflow-rules` | 필요 | 워크플로우 규칙 목록 |
| POST | `/api/admin/workflow-rules` | 필요 | 규칙 생성 |
| PATCH | `/api/admin/workflow-rules/[ruleId]` | 필요 | 규칙 수정 |
| DELETE | `/api/admin/workflow-rules/[ruleId]` | 필요 | 규칙 삭제 |
| POST | `/api/admin/workflow-rules/bootstrap` | 필요 | 기본 규칙 초기화 |

#### Schift 워크플로우 (AI 응답 엔진)

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/admin/schift/workflows` | 필요 | 워크플로우 목록 |
| POST | `/api/admin/schift/workflows` | 필요 | 워크플로우 생성 |
| GET | `/api/admin/schift/workflows/[workflowId]` | 필요 | 워크플로우 상세 |
| PATCH | `/api/admin/schift/workflows/[workflowId]` | 필요 | 워크플로우 수정 |
| POST | `/api/admin/schift/workflows/[workflowId]/run` | 필요 | 워크플로우 테스트 실행 |

#### 브랜딩/설정

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/admin/branding` | 필요 | 브랜딩 설정 조회 |
| PUT | `/api/admin/branding` | 필요 | 브랜딩 설정 수정 |
| GET | `/api/admin/branding/character-images` | 필요 | 캐릭터 이미지 갤러리 |

#### 알림/스케줄

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/admin/schedule` | 필요 | 알림 스케줄 조회 |
| PUT | `/api/admin/schedule` | 필요 | 알림 스케줄 수정 |
| POST | `/api/admin/push/send` | 필요 | 수동 푸시 알림 발송 |
| POST | `/api/admin/proactive/trigger` | 필요 | 선제적 상담 발송 |

#### 분석/모니터링

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/admin/analytics` | 필요 | 대시보드 통계 (사용자, 세션, 메시지 추이) |

### 2.4 시스템 API

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/cron/proactive-chat` | CRON_SECRET | 매일 0시 UTC (한국 9시) 선제적 상담 + 푸시 발송 |

---

## 3. 데이터베이스 스키마

### 3.1 `public` 스키마 (사용자/인증/채팅)

| 테이블 | 설명 | 주요 컬럼 |
|--------|------|-----------|
| `users` | 사용자 계정 | id, phone_number, role, account_status, phone_verified_at |
| `auth_sessions` | 인증 세션 (1년 유효) | user_id, refresh_token_hash, expires_at, revoked_at |
| `phone_verification_requests` | OTP 이력 | phone_number, verification_sid, status, attempt_count |
| `allowed_phone_numbers` | 허용 전화번호 (연구 참여자) | phone_number, display_name, note |
| `pregnancy_profiles` | 사용자 프로필/임신 정보 | user_id, display_name, due_date, pregnancy_week, baby_nickname, theme_key, push_token, notification_enabled |
| `chat_sessions` | 채팅 세션 | session_id, user_id, topic, started_at |
| `chat_messages` | 채팅 메시지 | session_id, role (user/assistant), content |
| `calendar_logs` | 캘린더 기록 | user_id, log_date, summary_data |
| `message_links` | 메시지 딥링크 | message_id, target_type, target_id |
| `user_action_logs` | 사용자 이벤트 추적 | user_id, event_type, metadata |
| `admin_audit_logs` | 관리자 감사 로그 | admin_id, action, target_table, changes |
| `system_config` | 시스템 설정 | config_key, config_value |

### 3.2 `content` 스키마 (콘텐츠)

| 테이블 | 설명 | 주요 컬럼 |
|--------|------|-----------|
| `content_knowledge_items` | 지식/안내 콘텐츠 | slug, section, title, body, image_url, status |
| `content_pregnancy_documents` | RAG 문서 | title, content, pregnancy_week, category, embedding |
| `content_pregnancy_week_data` | 주차별 간호 정보 | week_number, title, baby_summary, mother_summary |
| `content_pregnancy_day_contents` | 일차별 콘텐츠 | week_data_id, day_number, baby_message |
| `content_week_checklists` | 주차/일차 체크리스트 | week_data_id, day_number, title, checklist_payload |
| `content_week_questions` | 모아애착 질문 | week_data_id, day_number, question_text |
| `content_pregnancy_week_media` | 주차 미디어 | week_data_id, object_path, media_role |
| `user_persona_signals` | 상담 성향 신호 | user_id, persona_hint, confidence, evidence, weight |

### 3.3 발행 뷰 (모바일 읽기 전용)

- `published_knowledge_items` - 발행된 지식 항목
- `v_pregnancy_week_data` - 발행된 주차 목록 및 주차 통합 데이터
- `v_pregnancy_day_contents` - 일별 콘텐츠
- `v_week_checklists` - 주차 체크리스트
- `v_week_questions` - 주차 질문
- `v_user_persona_profiles` - 상담 성향 신호 가중 합산 결과
- `v_user_calendar_activity` - 캘린더 활동 집계

---

## 4. 배포 환경

### 4.1 배포 대상

| 대상 | 플랫폼 | 도구 |
|------|--------|------|
| 웹 (관리자 + API) | legacyBackend | Next.js 서버리스 |
| 모바일 앱 | App Store / Google Play | EAS Build |
| 데이터베이스 | legacyBackend Cloud | PostgreSQL 15 |

### 4.2 legacyBackend 배포 설정

- **리전**: `hnd1` (도쿄)
- **Cron**: `0 0 * * *` (매일 UTC 0시 = KST 9시, `/api/cron/proactive-chat`)
- **CORS**: 모든 `/api/*` 경로에 GET/POST/PUT/DELETE/OPTIONS 허용

### 4.3 환경변수

#### 앱 설정
| 변수 | 설명 | 예시 |
|------|------|------|
| `NEXT_PUBLIC_APP_URL` | 웹 프론트엔드 URL | `https://your-domain.legacyBackend.app` |
| `EXPO_PUBLIC_API_BASE_URL` | 모바일 API 엔드포인트 | `https://your-domain.legacyBackend.app` |
| `SERVER_DATA_PROVIDER` | 데이터 소스 (`docker` 또는 `legacyBackend`) | `legacyBackend` |
| `ADMIN_DATA_PROVIDER` | 관리자 데이터 포트 (`backend` 또는 `mock`) | `backend` |

#### legacyBackend
| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_legacyBackend_URL` | legacyBackend 프로젝트 URL |
| `NEXT_PUBLIC_legacyBackend_ANON_KEY` | legacyBackend 공개 키 |
| `legacyBackend_SERVICE_ROLE_KEY` | legacyBackend 서비스 역할 키 (서버 전용) |

#### AI/LLM
| 변수 | 설명 |
|------|------|
| `GEMINI_API_KEY` | Google Gemini API 키 |
| `SCHIFT_API_KEY` | Schift 워크플로우 엔진 API 키 |

#### Twilio (SMS/OTP)
| 변수 | 설명 |
|------|------|
| `TWILIO_ACCOUNT_SID` | Twilio 계정 SID |
| `TWILIO_AUTH_TOKEN` | Twilio 인증 토큰 |
| `TWILIO_VERIFY_SERVICE_SID` | Twilio Verify 서비스 SID |
| `TWILIO_SMS_FROM` | SMS 발신 전화번호 (선택) |
| `TWILIO_MESSAGING_SERVICE_SID` | Twilio Messaging Service SID (선택) |

#### 보안
| 변수 | 설명 |
|------|------|
| `ADMIN_SESSION_SECRET` | 관리자 세션 서명 키 |
| `ADMIN_LOGIN_PASSWORD` | 관리자 콘솔 로그인 비밀번호 |
| `CRON_SECRET` | legacyBackend Cron 인증 토큰 |
| `PHONE_DATA_SECRET` | 전화번호 AES 암호화 키 |

---

## 5. 보안 정책

| 항목 | 구현 |
|------|------|
| 전화번호 저장 | AES 암호화 (`PHONE_DATA_SECRET`) |
| 세션 관리 | 서버 사이드 세션, 1년 유효, 해지 가능 |
| API 인증 | 모바일: Bearer 토큰, 관리자: HTTP 쿠키 |
| Rate Limiting | 채팅 20회/분, 인증 5~10회/분, 429 + Retry-After |
| 감사 로그 | `admin_audit_logs` 테이블에 관리자 작업 기록 |
| 입력 검증 | URL: https 스킴 + 도메인 허용 목록 |

---

## 6. 빌드 및 실행

```bash
# 의존성 설치
pnpm install

# 로컬 개발 (Docker DB)
pnpm dev:d

# 로컬 개발 (legacyBackend DB)
pnpm dev:s

# 전체 빌드
pnpm build

# 타입 체크
pnpm type-check

# 테스트
pnpm test

# 모바일 앱 실행
pnpm --filter @gynecology-chatbot/mobile start
```
