# 검수 재현 스크립트 (제출용)

## 1) 문서 목적

본 문서는 발주자/검수자가 계약 검수 항목 **AC-001 ~ AC-007**을 순서대로 재현할 수 있도록 정리한 실행 가이드입니다.  
재현 기준은 실제 코드 경로의 화면 제목/API 엔드포인트를 우선하며, 저장소만으로 확정할 수 없는 항목은 별도로 **운영 환경에서 확인**으로 분리합니다.

---

## 2) 사전 준비

### 2.1 공통 준비

- 대상 저장소: `/Users/jskang/Projects/si`
- 검수 기준 문서
  - `docs/active/CONTRACT.html` (제7조 검수 기준)
  - `docs/delivery/TECHNICAL_SPECIFICATION.md` (API/인증/배포 명세)
  - `docs/delivery/ADMIN_OPERATIONS_MANUAL.md` (관리자 화면 운영 절차)
  - `docs/delivery/MOBILE_RELEASE_GUIDE.md` (빌드/스토어/푸시 운영 절차)
  - `docs/delivery/ACCEPTANCE_CHECKLIST.md` (AC-001~AC-007 판정 기준)

### 2.2 화면/라우트 기준 (코드 근거)

- 관리자 화면
  - `/admin/login` (`apps/web/app/admin/login/page.tsx`)
  - `/admin/operations` (`apps/web/app/admin/operations/page.tsx`)
  - `/admin/accounts` (`apps/web/app/admin/accounts/page.tsx`)
  - `/admin/content/weeks` (`apps/web/app/admin/content/weeks/page.tsx`)
  - `/admin/content/documents` (`apps/web/app/admin/content/documents/page.tsx`)
  - `/admin/content/static` (`apps/web/app/admin/content/static/page.tsx`)
  - `/admin/content/policies` (`apps/web/app/admin/content/policies/page.tsx`)
  - `/admin/monitoring` (`apps/web/app/admin/monitoring/page.tsx`)
- 모바일 API
  - `POST /api/mobile/auth/start-phone-verification`
  - `POST /api/mobile/auth/login`
  - `GET /api/mobile/auth/session`
  - `POST /api/mobile/chat`
  - `GET/PATCH /api/mobile/today`
  - `GET /api/mobile/sessions`
  - `GET /api/mobile/sessions/[sessionId]`
- 관리자 API
  - `POST /api/admin/push/send`

### 2.3 검수용 준비물

- 검수용 사용자 1개 이상(전화번호 인증 가능 계정)
- 검수용 관리자 계정 1개
- API 호출 도구(curl/Postman 등)
- 증빙 저장 폴더(스크린샷, 요청/응답 로그, 실행 시각 기록)

---

## 3) 시나리오 표 (AC별)

## AC-001 인증 동작

| 구분 | 내용 |
|---|---|
| 사전 준비 | 검수 사용자 전화번호, OTP 수신 가능 상태 |
| 시나리오 | 1) `POST /api/mobile/auth/start-phone-verification` 호출 → 2) OTP 수신 후 `POST /api/mobile/auth/login` 호출 → 3) 발급 토큰으로 `GET /api/mobile/auth/session` 호출 → 4) 비인증 상태로 `/admin/operations` 접근 시 로그인 페이지 리다이렉트 확인 (`apps/web/e2e/admin.spec.ts`) |
| 기대 결과 | 인증 요청/로그인 성공, 세션 조회 성공(200), 관리자 보호 라우트 비인가 접근 차단 |
| 증빙 | API 요청/응답 본문 캡처, `Authorization` 포함 세션 확인 결과, 비인증 접근 시 `/admin/login` 이동 화면 캡처 |

## AC-002 채팅 응답

| 구분 | 내용 |
|---|---|
| 사전 준비 | AC-001에서 획득한 유효 모바일 세션 |
| 시나리오 | `POST /api/mobile/chat`에 `sessionId`와 `text`를 포함해 일반 질문 전송 |
| 기대 결과 | 200 응답, `assistantMessage` 또는 `assistantMessages` 반환, 실패 시 에러 응답 구조 유지 |
| 증빙 | 요청/응답 JSON 저장, 응답 생성 시각 및 sessionId 기록 |

## AC-003 가드레일

| 구분 | 내용 |
|---|---|
| 사전 준비 | AC-001 인증 완료 세션 |
| 시나리오 | `POST /api/mobile/chat`에 금칙/위험 입력을 전송해 안전 분기 동작 확인 (`detectHardGuardrailReason` 경로) |
| 기대 결과 | 계약 기준에 따라 차단 또는 안전 고지 응답 반환 (비정상 종료 없이 응답 처리) |
| 증빙 | 금칙 입력 샘플별 요청/응답 로그, 안전 고지 메시지 캡처 |

## AC-004 관리자 조회

| 구분 | 내용 |
|---|---|
| 사전 준비 | 관리자 로그인 가능 상태 |
| 시나리오 | 1) `/admin` 또는 `/admin/operations` 접속 후 **운영 상태** 제목 확인 → 2) `/admin/accounts` 접속 후 **사용자 설정** 확인 → 3) `/admin/monitoring` 접속 후 **모니터링** 확인 → 4) 사이드바 항목(운영 상태/계정/콘텐츠/모니터링) 노출 확인 (`apps/web/e2e/admin.spec.ts`) |
| 기대 결과 | 각 화면 진입 가능, 제목/섹션 렌더링 정상, 네비게이션 전환 정상 |
| 증빙 | 각 페이지 URL+화면 제목 캡처, 네비게이션 이동 전/후 캡처 |

## AC-005 자료 관리

| 구분 | 내용 |
|---|---|
| 사전 준비 | 관리자 로그인 상태 |
| 시나리오 | 1) `/admin/content/weeks`에서 **주차별 간호 정보** 확인 → 2) `/admin/content/documents`에서 **문서** 확인 → 3) `/admin/content/static`에서 **정적 문헌** 확인 → 4) `/admin/content/policies`에서 **응답 워크플로우** 확인 |
| 기대 결과 | 각 콘텐츠 관리 화면 접근/조회 가능, 탭별 관리 UI 정상 렌더링 |
| 증빙 | 4개 콘텐츠 화면 제목 캡처, 필요 시 항목 목록 조회 화면 추가 캡처 |

## AC-006 대화 저장

| 구분 | 내용 |
|---|---|
| 사전 준비 | AC-002에서 채팅 전송 완료 (유효 `sessionId`) |
| 시나리오 | 1) `GET /api/mobile/sessions` 호출로 세션 목록 조회 → 2) `GET /api/mobile/sessions/[sessionId]` 호출로 메시지 이력 재조회 |
| 기대 결과 | 세션 목록에 대상 세션 존재, 세션 상세에서 사용자/어시스턴트 메시지 재조회 가능 |
| 증빙 | 세션 목록 응답(JSON), 세션 상세 응답(JSON), 조회한 sessionId 일치 로그 |

## AC-007 배포 상태

| 구분 | 내용 |
|---|---|
| 사전 준비 | 운영 배포 접근 권한, 운영 점검 시간 확정 |
| 시나리오 | 운영 URL에서 핵심 플로우(인증→채팅→세션 재조회, 관리자 주요 화면 접근) 순차 실행 |
| 기대 결과 | 운영 URL에서 핵심 기능이 실제 실행 가능 |
| 증빙 | 운영 URL 접속 캡처, 실환경 요청/응답 로그, 점검 일시/점검자 기록 |

---

## 4) 운영 환경 전용 확인 항목

아래 항목은 저장소 코드만으로 확정할 수 없어 운영 환경에서 별도 확인합니다.

1. **운영 URL 실가동/SSL 상태** (AC-007)
2. **스토어 제출/배포 결과** (TestFlight, Play Console)  
   - 기준 문서: `docs/delivery/MOBILE_RELEASE_GUIDE.md`
3. **외부 계정 연동 항목** (실서비스 계정 필요)
   - OTP/SMS 발송(Twilio)
   - 푸시 발송 인프라(Expo/FCM/APNs)
4. **관리자 수동 푸시 발송 API** `POST /api/admin/push/send`
   - 관리자 세션 인증 필요 (`apps/web/app/api/admin/push/send/route.ts`)

---

## 5) 증빙 수집 방법

### 5.1 파일 구조(권장)

- `evidence/AC-001/` ~ `evidence/AC-007/`
  - `request-*.json` (요청 바디/헤더)
  - `response-*.json` (응답 바디/상태코드)
  - `screen-*.png` (화면 캡처)
  - `memo.md` (실행 시각, 실행자, 특이사항)

### 5.2 필수 기록 항목

- 실행 일시(로컬 시간대 포함)
- 실행자
- 대상 AC 번호
- 사용한 엔드포인트/화면 경로
- 결과(Pass/Fail) 및 실패 시 재현 조건

### 5.3 판정 정리

- 최종 판정은 `docs/delivery/ACCEPTANCE_CHECKLIST.md`의 AC-001~AC-007 표에 맞춰 기록합니다.
- 운영 증빙이 필요한 항목은 “확인 불가(저장소 기준)”와 “운영 검증 완료”를 분리하여 표기합니다.
