# 제출용 근거 패키지 가이드 (EVIDENCE_PACKAGE)

> 작성일: 2026-04-08  
> 적용 범위: 계약 검수(AC), 한도/운영(LIM), 납품 문서 패키지  
> 기준 문서:  
> - `docs/active/CONTRACT.html`  
> - `docs/archive/DEVELOPMENT_SOW.md`  
> - `docs/delivery/ACCEPTANCE_CHECKLIST.md`  
> - `docs/delivery/REPRO_SCRIPT.md`  
> - `docs/delivery/TECHNICAL_SPECIFICATION.md`  
> - `docs/delivery/MOBILE_RELEASE_GUIDE.md`  
> - `docs/active/2026-03-26-sow-prd-coverage.html`

---

## 1) 문서 목적

본 문서는 검수/납품 시 함께 전달할 **근거 자료 묶음(Evidence Package)**의 표준 구성을 정의합니다.

| 항목 | 목적 |
|---|---|
| 검수 정합성 | AC/LIM 항목별로 어떤 증빙을 제출해야 하는지 명확화 |
| 재현성 | 검수자가 동일 절차로 결과를 재현할 수 있도록 로그/캡처/스크립트 연결 |
| 계약 정렬 | 계약서 제7조(검수 기준), 제8조(운영비/유지보수), 변경관리 조항과 증빙 연결 |
| 인수인계 | 운영 문서·배포 문서·릴리스 문서를 한 번에 전달 가능하도록 패키징 |

---

## 2) 패키지 구성 원칙

| 원칙 | 적용 방법 | 제출 형식 예시 |
|---|---|---|
| 항목별 분리 | AC, LIM, 운영증빙을 폴더 단위로 분리 | `ac/`, `lim/`, `ops/` |
| 증빙 유형 혼합 | 계약서 기준(캡처, API 로그, DB 조회, 재현 절차) 중 1개 이상 + 가능하면 2개 이상 | `.png`, `.json`, `.csv`, `.md`, `.txt` |
| 원본 보존 | 요청/응답 원문, 쿼리 결과 원문 보존 | `request-*.json`, `response-*.json` |
| 식별자 일치 | 화면 캡처/로그/DB 결과에 동일한 식별자(sessionId, timestamp 등) 포함 | 파일명에 `YYYYMMDD-HHMM`, `sessionId` 포함 |
| 비밀값 비포함 | 키/토큰/개인정보 마스킹 후 제출 | `***` 마스킹, 샘플 값 사용 |
| 판정 가능성 | 각 AC/LIM 항목별 Pass/보완 필요 여부를 판단할 수 있게 구성 | `summary.csv`, `checklist-marked.md` |

---

## 3) AC 기준 증빙 표

> 기준: `ACCEPTANCE_CHECKLIST.md`의 AC-001 ~ AC-007, `REPRO_SCRIPT.md` 시나리오

| AC ID | 검수 항목 | 권장 증빙(필수 우선순위) | 권장 형식 | 판정 포인트 |
|---|---|---|---|---|
| AC-001 | 인증 동작 | 1) OTP 시작/로그인/세션조회 API 요청·응답 2) 비인가 관리자 접근 차단 화면 캡처 | JSON + PNG | 인증 성공, 세션 유효, 관리자 비인가 차단 |
| AC-002 | 채팅 응답 | 1) 채팅 요청/응답 로그 2) 정상 응답 및 오류 안내 응답 케이스 | JSON | 정상 질의 응답, 오류 시 안내 유지 |
| AC-003 | 가드레일 | 1) 금칙 입력별 요청/응답 로그 2) 안전 고지 메시지 화면 캡처 | JSON + PNG | 차단 또는 안전 고지 동작 |
| AC-004 | 관리자 조회 | 1) 관리자 주요 화면(운영/계정/모니터링) 캡처 2) 이동 경로 캡처 | PNG | 화면 진입 및 조회 동작 |
| AC-005 | 자료 관리 | 1) 콘텐츠 관리 화면(주차/문서/정적/정책) 캡처 2) 항목 조회/수정 로그(가능 시) | PNG + JSON | 자료 조회/관리 UI 및 기능 접근 가능 |
| AC-006 | 대화 저장 | 1) 세션 목록/세션 상세 API 응답 2) 동일 sessionId 연결 근거 | JSON | 저장 후 재조회 가능 |
| AC-007 | 배포 상태 | 1) 운영 URL 접속 캡처 2) 운영 환경 재현 로그 3) 점검 일시/점검자 기록 | PNG + JSON + MD | 운영 URL에서 핵심 플로우 실행 가능 |

### AC 공통 첨부 규칙

| 항목 | 규칙 |
|---|---|
| 시간 기록 | 모든 증빙에 실행 시각(로컬 타임존 포함) 기록 |
| 실행 주체 | 실행자(검수자/개발자) 명시 |
| 재현 링크 | `REPRO_SCRIPT.md`의 단계 번호를 파일명 또는 메모에 연결 |
| 결과 요약 | AC별 `pass/fail/보완` 한 줄 요약 포함 |

---

## 4) LIM/운영 기준 증빙 표

### 4-1. LIM별 추가 증빙

> 기준: `ACCEPTANCE_CHECKLIST.md`, `CONTRACT.html`(운영 기간/사용량 초과 관련 조항), `DEVELOPMENT_SOW.md`

| LIM ID | 점검 항목 | 추가 증빙 | 권장 형식 | 판정 포인트 |
|---|---|---|---|---|
| LIM-001 | 이미지 세팅(초기 500개) | 이미지 자산 목록, 저장소/DB 집계 결과, 등록 이력 | CSV + PNG | 계약 기준 수량 및 초기 세팅 근거 |
| LIM-002 | 문자 발송량(10,000건 기준) | 발송 대시보드 집계, 월별 합계, 샘플 발송 로그 | PNG + CSV + JSON | 계약 기준 발송량 범위 증빙 |
| LIM-003 | 서버 운영(6개월) | 인프라 운영 기간 증빙(계약/청구/가동 로그) | PDF/PNG + CSV | 계약 기간 내 운영 제공 |
| LIM-004 | 생성형 AI API 운영(6개월) | 사용량/과금 리포트, 월별 호출 집계 | PNG + CSV | 계약 기간 내 운영 제공 |
| LIM-005 | RAG/검색 API 운영(6개월) | 사용량/과금 리포트, 검색 호출 집계 | PNG + CSV | 계약 기간 내 운영 제공 |
| LIM-006 | 무상 A/S 준수 | 이슈 접수·처리 이력, 처리 SLA/완료 기록 | CSV + MD + PNG | 무상 기간 내 대응 이력 |

### 4-2. 운영 증빙(AC/LIM 공통 보강)

| 구분 | 증빙 대상 | 제출 권장물 | 비고 |
|---|---|---|---|
| 배포 운영 | 운영 URL, SSL, 핵심 플로우 가동 | 점검 캡처, 체크 로그, 장애/복구 기록 | AC-007 직결 |
| 릴리스 운영 | 앱 빌드/스토어 제출 상태 | 빌드 결과 로그, 제출 이력 캡처 | `MOBILE_RELEASE_GUIDE.md` 연계 |
| 기술 인수인계 | API/환경설정/운영 절차 | 기술문서, 운영가이드, 인수인계 메모 | `TECHNICAL_SPECIFICATION.md` 연계 |
| 계약 증빙 | 검수 결과 통지 및 보완 이력 | 체크리스트, 회신 문서, 보완 전후 비교 | AC/LIM 최종 판정 근거 |

---

## 5) 권장 폴더 구조 예시

> 아래 구조를 기준으로 압축(`evidence-package-YYYYMMDD.zip`) 전달을 권장합니다.

```text
evidence-package-YYYYMMDD/
  00_index/
    README.md
    manifest.csv
    acceptance-summary.csv
  01_ac/
    AC-001-auth/
      request-start-verification.json
      response-start-verification.json
      request-login.json
      response-login.json
      response-session.json
      screen-admin-unauthorized.png
      memo.md
    AC-002-chat/
      request-chat-normal.json
      response-chat-normal.json
      response-chat-error-sample.json
      memo.md
    AC-003-guardrail/
      request-guardrail-case-01.json
      response-guardrail-case-01.json
      screen-guardrail-message.png
      memo.md
    AC-004-admin-view/
      screen-admin-operations.png
      screen-admin-accounts.png
      screen-admin-monitoring.png
      memo.md
    AC-005-content-management/
      screen-content-weeks.png
      screen-content-documents.png
      screen-content-static.png
      screen-content-policies.png
      memo.md
    AC-006-conversation-storage/
      response-sessions-list.json
      response-session-detail.json
      id-matching-note.md
    AC-007-deployment/
      screen-production-entry.png
      run-log-production-check.txt
      check-report.md
  02_lim/
    LIM-001-image-setup/
      image-inventory.csv
      count-proof.png
    LIM-002-sms/
      sms-usage-monthly.csv
      sms-dashboard-capture.png
    LIM-003-server-period/
      infra-operation-period.pdf
      uptime-summary.csv
    LIM-004-ai-api-period/
      ai-usage-monthly.csv
      ai-billing-capture.png
    LIM-005-rag-api-period/
      rag-usage-monthly.csv
      rag-billing-capture.png
    LIM-006-warranty-as/
      issue-log.csv
      as-handling-summary.md
  03_operations/
    technical-specification.pdf
    mobile-release-guide.pdf
    repro-script.pdf
    acceptance-checklist-marked.pdf
  99_signoff/
    submission-note.md
    reviewer-feedback-template.md
```

### 파일명 규칙(권장)

| 항목 | 규칙 예시 |
|---|---|
| 날짜/시간 | `20260408-1530` |
| AC/LIM 접두사 | `AC-003_*`, `LIM-002_*` |
| 형식 접미사 | `*_request.json`, `*_response.json`, `*_screen.png` |
| 민감정보 처리 | `*-redacted.json` (마스킹본) |

---

## 6) 제출 전 최종 점검표

| 점검 항목 | 확인 |
|---|---|
| AC-001~AC-007 폴더가 모두 존재하고, 각 항목별 최소 1개 이상 실증빙이 포함되었는가 | [ ] |
| AC-007은 운영 환경 증빙(운영 URL/점검 시각/실행 로그)이 포함되었는가 | [ ] |
| LIM-001~LIM-006의 운영 증빙이 누락 없이 포함되었는가 | [ ] |
| 모든 캡처/로그/DB 결과에 실행 시각, 실행자, 항목 ID가 연결되어 있는가 | [ ] |
| 비밀값/개인정보(키, 토큰, 전화번호 등)가 마스킹되었는가 | [ ] |
| `ACCEPTANCE_CHECKLIST.md` 판정 표와 패키지 내 증빙 파일명이 매칭되는가 | [ ] |
| `REPRO_SCRIPT.md` 단계와 증빙 파일이 연결되어 재현 가능한가 | [ ] |
| `TECHNICAL_SPECIFICATION.md`, `MOBILE_RELEASE_GUIDE.md` 최신본이 동봉되었는가 | [ ] |
| 최종 압축 파일명과 버전/날짜가 명확한가 | [ ] |
| 제출 메모(제출일, 제출자, 검수 요청 범위)가 포함되었는가 | [ ] |

---

## 부록) AC/LIM-증빙 매핑 요약표

| 분류 | 상태 기준 | 주 제출물 |
|---|---|---|
| AC | 기능 동작 검증 | 캡처 + API 로그 + 재현 메모 |
| LIM | 계약 한도/기간 검증 | 집계표 + 과금/운영 리포트 + 기간 증빙 |
| 운영 증빙 | 실환경 가동/릴리스 검증 | 배포 점검 로그 + 빌드/배포 결과 + 운영 문서 |
