# PRD 체크리스트

> 기준일: 2026-03-14
> 기준 문서: [PRD.md](/Users/jskang/si/gynecology-chatbot/docs/reference/PRD.md)

이 문서는 현재 저장소 상태를 PRD 기준으로 대조한 체크리스트다.

상태 기준:
- `완료`: 현재 코드/문서/화면에서 실사용 가능한 수준으로 확인됨
- `부분`: 골격, 일부 화면, 일부 스키마, 일부 adapter만 존재
- `미구현`: 현재 저장소 기준으로 기능/문서/화면 부재

## 1. 채널 분리

| 항목 | 상태 | 근거 |
|---|---|---|
| 웹은 관리자 전용 | 부분 | [apps/web/src/app/page.tsx](/Users/jskang/si/gynecology-chatbot/apps/web/src/app/page.tsx), [apps/web/src/components/AdminDashboard.tsx](/Users/jskang/si/gynecology-chatbot/apps/web/src/components/AdminDashboard.tsx) 기준으로 관리자 UI만 있음 |
| 모바일은 사용자 전용 | 부분 | [apps/mobile/app/index.tsx](/Users/jskang/si/gynecology-chatbot/apps/mobile/app/index.tsx), [apps/mobile/app/(tabs)/home.tsx](/Users/jskang/si/gynecology-chatbot/apps/mobile/app/(tabs)/home.tsx), [apps/mobile/app/chat/[sessionId].tsx](/Users/jskang/si/gynecology-chatbot/apps/mobile/app/chat/[sessionId].tsx) 기준으로 사용자 앱 라우트 골격 존재 |
| 웹/앱 관심사 분리 | 부분 | 웹 관리자 UI와 모바일 사용자 라우트가 분리됨. 다만 기능 완성도는 낮음 |

## 2. 사용자 앱

### 2.1 인증

| 항목 | 상태 | 근거 |
|---|---|---|
| 최초 1회 휴대폰 본인인증 | 부분 | [apps/mobile/src/screens/auth/SetPasswordScreen.tsx](/Users/jskang/si/gynecology-chatbot/apps/mobile/src/screens/auth/SetPasswordScreen.tsx), [apps/mobile/src/core/adapters/mockMobileAuthPorts.ts](/Users/jskang/si/gynecology-chatbot/apps/mobile/src/core/adapters/mockMobileAuthPorts.ts), [apps/web/src/app/api/mobile/auth/verify-phone/route.ts](/Users/jskang/si/gynecology-chatbot/apps/web/src/app/api/mobile/auth/verify-phone/route.ts) 기준으로 DI + mock/api 골격 존재. 실제 통신사 인증이나 Supabase Auth 연동은 없음 |
| 비밀번호 설정 | 부분 | [apps/web/src/lib/mobile/auth.ts](/Users/jskang/si/gynecology-chatbot/apps/web/src/lib/mobile/auth.ts), [20260314_add_password_hash_to_users.sql](/Users/jskang/si/gynecology-chatbot/supabase/migrations/20260314_add_password_hash_to_users.sql), [set-password route](/Users/jskang/si/gynecology-chatbot/apps/web/src/app/api/mobile/auth/set-password/route.ts) 기준으로 해시 저장 골격 존재 |
| 전화번호 + 비밀번호 재로그인 | 부분 | [apps/mobile/src/screens/auth/LoginScreen.tsx](/Users/jskang/si/gynecology-chatbot/apps/mobile/src/screens/auth/LoginScreen.tsx), [apps/web/src/lib/mobile/auth.ts](/Users/jskang/si/gynecology-chatbot/apps/web/src/lib/mobile/auth.ts), [login route](/Users/jskang/si/gynecology-chatbot/apps/web/src/app/api/mobile/auth/login/route.ts) 기준으로 해시 검증 경로 존재. Supabase Auth 정식 연동은 없음 |
| 비밀번호 재설정 진입 | 부분 | [apps/mobile/src/screens/auth/ResetPasswordScreen.tsx](/Users/jskang/si/gynecology-chatbot/apps/mobile/src/screens/auth/ResetPasswordScreen.tsx), [apps/web/src/app/api/mobile/auth/request-password-reset/route.ts](/Users/jskang/si/gynecology-chatbot/apps/web/src/app/api/mobile/auth/request-password-reset/route.ts) |

### 2.2 온보딩

| 항목 | 상태 | 근거 |
|---|---|---|
| 임신 여부/주차/예정일 수집 | 부분 | [apps/mobile/src/screens/onboarding/OnboardingScreen.tsx](/Users/jskang/si/gynecology-chatbot/apps/mobile/src/screens/onboarding/OnboardingScreen.tsx), [apps/web/src/app/api/mobile/onboarding/route.ts](/Users/jskang/si/gynecology-chatbot/apps/web/src/app/api/mobile/onboarding/route.ts) 기준으로 UI와 저장 route 존재 |
| 톤 선호 수집 | 부분 | [apps/mobile/src/screens/onboarding/OnboardingScreen.tsx](/Users/jskang/si/gynecology-chatbot/apps/mobile/src/screens/onboarding/OnboardingScreen.tsx), [apps/web/src/app/api/mobile/onboarding/route.ts](/Users/jskang/si/gynecology-chatbot/apps/web/src/app/api/mobile/onboarding/route.ts) |

### 2.3 AI 상담

| 항목 | 상태 | 근거 |
|---|---|---|
| 세션 단위 채팅 | 부분 | [supabase migration](/Users/jskang/si/gynecology-chatbot/supabase/migrations/20260314_create_session_based_core_schema.sql), [apps/web/src/app/api/mobile/chat/route.ts](/Users/jskang/si/gynecology-chatbot/apps/web/src/app/api/mobile/chat/route.ts) 에 세션 기반 저장 구조 존재 |
| 사용자 채팅 화면 | 부분 | [apps/mobile/src/screens/ChatScreen.tsx](/Users/jskang/si/gynecology-chatbot/apps/mobile/src/screens/ChatScreen.tsx) 기준으로 세션 화면, recent chat modal, 이미지 첨부 골격 존재 |
| 임신 주차 문맥 반영 | 부분 | [chat route](/Users/jskang/si/gynecology-chatbot/apps/web/src/app/api/mobile/chat/route.ts), [rag.ts](/Users/jskang/si/gynecology-chatbot/apps/web/src/lib/mobile/rag.ts) 기준으로 주차 기반 RAG 조회를 prompt에 연결 |
| 위험 신호 내원 권고 | 부분 | chat route system prompt 수준으로만 존재 |
| 의료 참고 근거/출처 보기 | 미구현 | 사용자 UI 없음 |
| 임신 주차별 RAG 문서 참조 | 부분 | [rag.ts](/Users/jskang/si/gynecology-chatbot/apps/web/src/lib/mobile/rag.ts), [chat route](/Users/jskang/si/gynecology-chatbot/apps/web/src/app/api/mobile/chat/route.ts) 기준으로 실제 retrieval 호출 존재 |

### 2.4 상담 저장과 캘린더

| 항목 | 상태 | 근거 |
|---|---|---|
| 답변 저장 | 미구현 | 사용자 저장 UI 없음 |
| `session_id` 중심 기록 | 부분 | 스키마와 문서에 반영됨 |
| `message_id` 보조 참조 | 부분 | 스키마에 nullable로 존재 |
| 월간 캘린더 뷰 | 부분 | [apps/mobile/src/screens/HomeScreen.tsx](/Users/jskang/si/gynecology-chatbot/apps/mobile/src/screens/HomeScreen.tsx) 에 월간 grid 골격 존재 |
| 날짜별 기록 상세 | 미구현 | 실제 UI 없음 |
| 원문 채팅 이동 | 미구현 | 사용자 앱 화면 없음 |

### 2.5 감정 기록

| 항목 | 상태 | 근거 |
|---|---|---|
| 하루 단위 감정 기록 | 부분 | `emotion_logs` 스키마 존재 |
| 감정 선택/메모 UI | 미구현 | 화면 없음 |
| 캘린더 연동 | 부분 | 홈 캘린더 골격은 있으나 실제 감정 입력/상세는 없음 |

### 2.6 내 기록 내보내기

| 항목 | 상태 | 근거 |
|---|---|---|
| 다운로드/공유 가능한 백업 | 미구현 | 구현 없음 |

## 3. 관리자 웹

### 3.1 관리자 인증

| 항목 | 상태 | 근거 |
|---|---|---|
| 관리자 전용 로그인 | 부분 | [admin login page](/Users/jskang/si/gynecology-chatbot/apps/web/src/app/admin/login/page.tsx), [AdminLoginView.tsx](/Users/jskang/si/gynecology-chatbot/apps/web/src/components/AdminLoginView.tsx), [admin auth route](/Users/jskang/si/gynecology-chatbot/apps/web/src/app/api/admin/auth/login/route.ts) 기준으로 로그인 화면과 쿠키 세션 존재 |
| 사용자 인증과 분리 | 부분 | [auth.ts](/Users/jskang/si/gynecology-chatbot/apps/web/src/lib/admin/auth.ts) 기준으로 관리자 세션 쿠키를 모바일 사용자 흐름과 분리 |
| 권한 수준별 메뉴 제어 | 부분 | [auth.ts](/Users/jskang/si/gynecology-chatbot/apps/web/src/lib/admin/auth.ts) 에서 `admin`, `super_admin` role gate 존재. 세부 메뉴별 분기는 아직 없음 |

### 3.2 대시보드

| 항목 | 상태 | 근거 |
|---|---|---|
| 활성 사용자 수 | 부분 | [AdminDashboard.tsx](/Users/jskang/si/gynecology-chatbot/apps/web/src/components/AdminDashboard.tsx), [supabase-admin-dashboard-port.ts](/Users/jskang/si/gynecology-chatbot/apps/web/src/lib/admin/adapters/supabase-admin-dashboard-port.ts) |
| 일간/주간 로그인 수 | 미구현 | 현재 메트릭 없음 |
| 일간 채팅량 | 부분 | mock 및 session count 기반 지표 존재 |
| 감정 기록 추이 | 미구현 | 차트/지표 없음 |
| 주요 운영 알림 | 부분 | 복구 요청 카드 정도만 존재 |

### 3.3 사용자 운영

| 항목 | 상태 | 근거 |
|---|---|---|
| 사용자 검색 | 미구현 | 목록만 있고 검색 없음 |
| 사용자 프로필 조회 | 부분 | 히스토리 요약 카드만 존재 |
| 전화번호 변경 | 부분 | [AdminDashboard.tsx](/Users/jskang/si/gynecology-chatbot/apps/web/src/components/AdminDashboard.tsx), [update-phone route](/Users/jskang/si/gynecology-chatbot/apps/web/src/app/api/admin/users/update-phone/route.ts), [supabase-admin-dashboard-port.ts](/Users/jskang/si/gynecology-chatbot/apps/web/src/lib/admin/adapters/supabase-admin-dashboard-port.ts) 기준으로 UI + route + adapter 존재 |
| 로그인 ID 정정 | 미구현 | 포트/구현/UI 없음 |
| 비밀번호 재설정 또는 초기화 | 부분 | [AdminDashboard.tsx](/Users/jskang/si/gynecology-chatbot/apps/web/src/components/AdminDashboard.tsx), [reset-password route](/Users/jskang/si/gynecology-chatbot/apps/web/src/app/api/admin/users/reset-password/route.ts) 기준으로 UI + route 존재 |
| 계정 상태 변경 | 미구현 | UI 없음 |
| 최근 로그인/활동 확인 | 부분 | 최근 세션 시각 일부 표시 |

### 3.4 상담 및 기록 조회

| 항목 | 상태 | 근거 |
|---|---|---|
| 사용자별 상담 이력 조회 | 부분 | [AdminDashboard.tsx](/Users/jskang/si/gynecology-chatbot/apps/web/src/components/AdminDashboard.tsx) 의 `User History` 섹션 |
| 날짜별 저장 기록 조회 | 미구현 | 날짜 필터/저장 기록 뷰 없음 |
| 캘린더 저장 로그 확인 | 미구현 | 전용 패널 없음 |
| 상담 샘플 검토 | 부분 | 메시지 요약 타임라인 정도만 존재 |

### 3.5 콘텐츠 운영

| 항목 | 상태 | 근거 |
|---|---|---|
| 카드뉴스/설문/안내 콘텐츠 등록 | 미구현 | CRUD UI 없음 |
| AI 참고 문서 업로드 | 부분 | [AdminDashboard.tsx](/Users/jskang/si/gynecology-chatbot/apps/web/src/components/AdminDashboard.tsx), [rag upload route](/Users/jskang/si/gynecology-chatbot/apps/web/src/app/api/admin/rag/upload/route.ts) 기준으로 업로드 UI와 실제 임베딩 생성/저장 경로 존재 |
| 반영 상태 확인 | 부분 | RAG 문서 상태 목록과 업로드 직후 로컬 반영 UI 있음 |
| 캐릭터/톤 리소스 관리 | 미구현 | 구현 없음 |

### 3.6 감사와 운영 로그

| 항목 | 상태 | 근거 |
|---|---|---|
| 계정 복구 작업 로그 | 부분 | audit log 스키마와 목록 UI 일부 존재 |
| 관리자 액션 로그 | 부분 | `admin_audit_logs` 존재 |
| 실패한 운영 작업 로그 | 미구현 | UI 없음 |

## 4. 운영 문서

| 항목 | 상태 | 근거 |
|---|---|---|
| Apple App Store 가입 안내 | 미구현 | 별도 문서 없음 |
| Google Play Console 가입 안내 | 미구현 | 별도 문서 없음 |
| TestFlight 등록 절차 | 미구현 | 별도 문서 없음 |
| Google Play 테스트 등록 절차 | 미구현 | 별도 문서 없음 |
| 운영 체크리스트 | 미구현 | 별도 문서 없음 |
| 운영 이슈 대응 가이드 | 미구현 | 별도 문서 없음 |

## 5. 데이터와 백엔드

| 항목 | 상태 | 근거 |
|---|---|---|
| Supabase 중심 설계 | 부분 | [DATABASE_SCHEMA.md](/Users/jskang/si/gynecology-chatbot/docs/reference/DATABASE_SCHEMA.md), [migration](/Users/jskang/si/gynecology-chatbot/supabase/migrations/20260314_create_session_based_core_schema.sql) |
| 사용자/관리자 권한 분리 | 부분 | RLS 초안 있음 |
| 계정 복구 감사 가능 | 부분 | audit log 스키마/adapter 존재 |
| 세션 기반 채팅 모델 | 부분 | `chat_sessions`, `chat_messages` 존재 |
| 임신 주차별 RAG 문서 모델 | 부분 | `pregnancy_documents` 존재 |

## 6. 현재 요약

| 범주 | 진척도 |
|---|---|
| 관리자 웹 IA/목업 | 60% |
| 관리자 DI/adapter 골격 | 60% |
| Supabase 최소 스키마 | 60% |
| 사용자 앱 | 48% |
| 운영 문서 | 5% |

## 7. 다음 우선순위

1. 운영 문서 작성
2. 관리자 메뉴별 권한 제어 세분화
3. 날짜별 기록 상세 / 캘린더 저장 로그 UI 추가
4. 의료 참고 근거/출처 사용자 UI 추가
5. PRD 기준 acceptance checklist를 CI나 release checklist로 연결
