# 데이터 입력 준비 체크리스트

> 최종 업데이트: 2026-04-17
> 기준: `전화번호-only 인증`, public mirror 콘텐츠 테이블, 관리자 콘솔 기준

## 1. 바로 운영자가 입력 가능한 테이블

### `public.allowed_phone_numbers`

- 상태: 준비 완료
- 입력 방법: 관리자 콘솔
- 용도: 연구 참여 허용 번호 화이트리스트
- 비고: 로그인/OTP 시작 전 이 테이블로 선검사

### `public.content_pregnancy_documents`

- 상태: 준비 완료
- 입력 방법: 관리자 콘솔
- 용도: RAG 문헌 업로드
- 비고: 임베딩 생성 포함

### `public.content_pregnancy_week_data`

- 상태: 준비 완료
- 입력 방법: 관리자 콘솔
- 용도: 주차별 요약 메타데이터

### `public.content_pregnancy_day_contents`

- 상태: 준비 완료
- 입력 방법: 관리자 콘솔
- 용도: 일차별 태아/산모 콘텐츠 본문

### `public.content_pregnancy_week_media`

- 상태: 준비 완료
- 입력 방법: 관리자 콘솔
- 용도: 주차별 에셋 메타데이터

### `public.content_knowledge_items`

- 상태: 준비 완료
- 입력 방법: 관리자 콘솔
- 용도: 정적 문헌 / 노트북 콘텐츠

## 2. 앱 사용 중 자동 적재되는 테이블

### `public.users`

- 상태: 준비 완료
- 적재 방식: OTP 로그인 성공 시 자동 생성 또는 갱신
- 비고: 수동 시드보다 로그인 흐름 기준이 맞음

### `public.auth_sessions`

- 상태: 준비 완료
- 적재 방식: 로그인 성공 시 자동 생성
- 비고: 1년 세션 토큰 해시 저장

### `public.phone_verification_requests`

- 상태: 준비 완료
- 적재 방식: OTP 발송/확인 시 자동 생성
- 비고: 만료는 10분 기준

### `public.pregnancy_profiles`

- 상태: 준비 완료
- 적재 방식: 온보딩 / 프로필 저장
- 비고: 사용자 이름, 태명, 테마, 알림, 임신 정보 통합

### `public.chat_sessions`

- 상태: 준비 완료
- 적재 방식: 채팅 시작 시 자동 생성

### `public.chat_messages`

- 상태: 준비 완료
- 적재 방식: 채팅 송수신 시 자동 생성

### `public.calendar_logs`

- 상태: 준비 완료
- 적재 방식: 후처리 저장 흐름
- 비고: 메인 원천 데이터가 아니라 저장 결과물

### `public.user_action_logs`

- 상태: 준비 완료
- 적재 방식: 로그인, 인증, 온보딩, 프로필 수정, 채팅 전송 시 자동 생성

### `public.user_persona_signals`

- 상태: 준비 완료
- 적재 방식: Schift workflow가 `nextProfileMemory.personaHint`를 반환하면 자동 생성
- 비고: 사용자에게 노출하지 않는 내부 상담 톤 조절용 신호

### `public.admin_audit_logs`

- 상태: 준비 완료
- 적재 방식: 관리자 계정 조치, 허용 번호 CRUD, 콘텐츠 조작 시 자동 생성

## 3. 현재 제외된 테이블

- `emotion_logs`
  - 상태: 제외
  - 이유: 현재 독립 테이블로 운영하지 않음
  - 메모: 감정/성향 신호는 `chat_sessions.memory_payload`, `pregnancy_profiles.onboarding_payload.profileMemory`, `user_persona_signals`로 관리

## 4. 운영 투입 전 최종 확인 항목

### 허용 번호

- 관리자 콘솔에서 연구 참여자 번호가 모두 등록되었는지
- 번호 포맷이 `E.164` 또는 일관된 국내 포맷으로 정규화되는지

### 콘텐츠

- `public.content_knowledge_items`에 첫 문서가 최소 1개 이상 있는지
- `public.content_pregnancy_week_data` 1~40주차 기본 데이터가 들어있는지
- `public.content_pregnancy_documents`에 최소한 공통 응급 문서와 핵심 주차 문서가 있는지
- `public.v_user_persona_profiles`가 조회 가능한지

### 인증

- `Twilio Verify` 환경변수가 실제 값으로 세팅되어 있는지
- 허용 번호가 아닌 번호는 OTP 시작부터 차단되는지

### 세션

- 로그인 후 `auth_sessions`가 생성되는지
- 세션 초기화 시 기존 세션이 더 이상 유효하지 않은지

## 5. 아직 남은 운영 리스크

- 네이티브 앱의 세션 토큰 영속 저장은 아직 임시 수준이다.
