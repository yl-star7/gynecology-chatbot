# 부인과 챗봇 구현 계획

> 최종 업데이트: 2026-03-14
> 기준: 신규 브랜치에서 다시 쓴다고 가정한 legacyBackend 기반 모노레포

## 1. 목표 구조

```text
apps/web
  관리자 대시보드
  모바일 앱용 서버 API

apps/mobile
  Expo React Native 사용자 앱

packages/app-core
  도메인 타입
  포트 인터페이스
  DI 조립 계약

legacyBackend
  SQL 마이그레이션
```

## 2. 채널 책임

### 웹

- 관리자 로그인
- 관리자 대시보드
- 사용자 계정 복구
- 상담 세션 조회
- 운영 로그 / 감사 로그
- 모바일 앱이 호출하는 서버 API

### 모바일

- 전화번호 기반 로그인
- 홈 뷰
- 캘린더 뷰
- 임신수첩
- 임신 지식
- 세션 기반 AI 채팅
- 이미지 + 텍스트 첨부
- 앱 내부 deep link

## 3. 사용자 앱 구현 순서

### 3.1 홈

- 인사 헤더
- 임신 일차 요약
- 캘린더 dot 표시
- 감정 색상 표시
- 임신수첩 카드
- 임신 지식 카드
- FAB로 채팅 진입

### 3.2 채팅

- `chat_sessions` 목록
- 최근 세션 시트
- 세션 상세 화면
- JSON message parts 렌더러
- `text`
- `survey`
- `carousel`
- `image`
- `deepLink`
- 이미지 첨부 composer

### 3.3 deep link

- AI 응답이 앱 내부 정보 링크를 반환
- 링크는 라우트 target으로 변환
- 특정 메시지 저장 링크보다 기본 진입점은 세션 단위

## 4. 채팅 데이터 정책

- 채팅은 ChatGPT처럼 세션 단위로 관리한다.
- `chat_messages`는 세션 내부 이벤트다.
- 사용자가 저장한 특정 답변만 `message_id`로 재열기 가능하게 둔다.
- 기본 링크, recent chats, 관리자 조회는 모두 `session_id` 기준으로 본다.

## 5. RAG 정책

- `pregnancy_documents`를 임신 주차별 지식 저장소로 사용한다.
- 검색 우선순위:
  - 사용자 현재 임신 주차
  - 인접 주차 범위
  - 공통 일반 문서
- 검색 결과는 세션 응답 생성 전에 문맥으로 주입한다.
- 문서 chunk에는 최소한 다음 메타데이터가 필요하다.
  - `pregnancy_week`
  - `category`
  - `source_title`
  - `source_section`

## 6. legacyBackend 구현 순서

1. 최소 테이블 SQL 작성
2. RLS 정책 초안 작성
3. `packages/app-core` 포트 확정
4. web/mobile 각각 legacyBackend adapter 연결
5. 모바일 홈 조회 연결
6. 모바일 세션 채팅 연결
7. 관리자 조회 화면 연결

## 7. 최소 포트

- `AuthPort`
- `OnboardingPort`
- `MobileHomePort`
- `CalendarPort`
- `KnowledgePort`
- `MobileChatPort`
- `AdminDashboardPort`
- `AdminUserPort`

## 8. 관리자 기능 우선순위

1. 대시보드 집계
2. 사용자 검색
3. 전화번호 변경
4. 로그인 ID 정정
5. 비밀번호 재설정
6. 세션 및 메시지 조회
7. 감사 로그

## 9. 관리자 role 운영안

- `admin`
  - 사용자 운영
  - 세션/로그 조회
  - RAG 문서 업로드
  - 콘텐츠 반영
- `super_admin`
  - `admin` 권한 전부
  - 관리자 계정 생성/비활성화
  - role 변경
  - 고위험 작업 승인

## 10. 휴대폰 인증 단계 운영안

1. `mock`
- 개발/QA 기본값
- 실제 SMS 없음

2. `sms_otp`
- 운영 배포 최소 요구안
- SMS 벤더 연결
- legacyBackend Auth Hook 또는 커스텀 OTP 검증

3. `identity_verification`
- 고신뢰 본인확인
- 계정 복구, 민감 기능, 악용 방지 목적

## 11. 기술 제약

- 모노레포 유지
- 오프라인 모드 없음
- 모바일 앱은 WebView가 아니라 Expo RN 기준
- AI 모델은 허용된 Gemini 계열만 사용
- API 키는 환경변수로만 관리

## 12. 바로 다음 작업

1. `legacyBackend/migrations`에 최소 스키마 SQL 작성
2. `chat_sessions` / `chat_messages` 기준으로 앱 전역 용어 통일
3. `pregnancy_documents` ingest 및 검색 adapter 초안 작성
4. 관리자 대시보드 정보구조 확정
