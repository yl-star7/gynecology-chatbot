# 납품 완료 보고서

기준일: 2026-05-06

## 1. 납품 범위

이번 납품은 앱 채팅 파이프라인, 관리자 운영 화면, 활동 캘린더 요약, Cloud SQL 기반 운영 데이터 경로, YAML 기반 워크플로우 운영 체계를 기준으로 정리했다.

### 앱

- 채팅 화면은 서버 응답을 표시하고 사용자 입력을 전달하는 역할로 축소했다.
- 앱 내부에서 임의 AI 처리나 숨은 fallback 응답을 만들지 않도록 정리했다.
- 활동 캘린더는 그날 전체 요약과 채팅창 단위 요약을 분리해서 표시하는 방향으로 정렬했다.
- 종료된 채팅은 읽기 전용으로 진입할 수 있고, 추가 입력은 막는 흐름을 기준으로 정리했다.

### 서버/API

- 채팅 단계 제어는 서버 orchestrator와 YAML 선언을 중심으로 동작한다.
- 기분 확인, 주차 정보 opt-in, 오늘의 질문, 질문 답변, 자유 대화를 단일 stage 흐름으로 정리했다.
- 질문별 요약과 채팅창 단위 요약, 그날 전체 요약을 분리하는 API/저장 경로를 정리했다.
- 로컬/운영 데이터 기준은 Cloud SQL/Postgres와 `DATABASE_URL` 경로로 정렬했다.

### 관리자

- 워크플로우 YAML을 운영자가 확인/수정할 수 있는 관리 경로를 정리했다.
- router와 subworkflow 단위의 YAML 저장 경로, 동기화 경로, workflow id mapping을 분리했다.
- 관리자 화면은 콘텐츠/운영/모니터링/워크플로우 관리 중심으로 재정렬했다.

## 2. YAML 워크플로우 정렬 상태

YAML은 다음 책임 분리로 정렬되어 있다.

| 파일 | 역할 | 상태 |
| --- | --- | --- |
| `packages/mobile-api/src/workflows/maternal-nursing.yaml` | 기본 채팅 단계 선언, `chat_flow`, 데이터 소스, monolith fallback | 검증 통과 |
| `packages/mobile-api/src/workflows/maternal-nursing-router.yaml` | stage 기반 subworkflow routing | 검증 통과 |
| `packages/mobile-api/src/workflows/subworkflows/baby-info.yaml` | 주차 정보 요약 및 knowledge deep link | 검증 통과 |
| `packages/mobile-api/src/workflows/subworkflows/letter-reflection.yaml` | 오늘의 질문 답변, 편지/공감 대화 | 검증 통과 |
| `packages/mobile-api/src/workflows/subworkflows/free-chat.yaml` | 질문 완료 후 자유 대화 | 검증 통과 |
| `packages/mobile-api/src/workflows/subworkflows/general.yaml` | 일반 fallback 및 가드레일 | 검증 통과 |

### 검증 기준

- 모든 YAML 파일 parse 성공
- `name`, `description`, `blocks`, `edges` 필수 구조 확인
- block id 중복 없음
- edge source/target이 실제 block id를 참조
- `$prompts.*`, `$static_responses.*`, `$config.*` 참조가 선언부와 일치
- env 참조 목록 확인
- `maternal-nursing.yaml`만 `chat_flow`를 소유하고, router/subworkflow는 실행 책임만 소유

검증 명령:

```bash
pnpm workflow:verify-yaml
```

결과:

```text
ok: true
checked files: 6
errors: 0
```

## 3. 최근 커밋 정리

최근 납품 관련 커밋은 아래 흐름으로 정리되어 있다.

| 커밋 | 목적 |
| --- | --- |
| `a94c1771` | 그날 전체 요약과 채팅창 단위 요약 분리 |
| `0d0083dd` | 채팅 stage 제어를 YAML 중심으로 이동 |
| `09dd6565` | 숨은 로컬 fallback 응답 제거 |
| `db3196aa` | 차단된 기존 플랫폼 흔적 제거 및 Cloud SQL 기준 정렬 |

히스토리 재작성은 하지 않았다. 납품 전 상태를 보존하면서 검증 가능한 단위의 커밋으로만 정리했다.

## 4. 검증 결과

아래 검증을 완료했다.

```bash
pnpm workflow:verify-yaml
pnpm --filter @gynecology-chatbot/mobile-api type-check
pnpm --filter @gynecology-chatbot/api type-check
pnpm --filter @gynecology-chatbot/web type-check
pnpm --filter @gynecology-chatbot/mobile-api test -- workflows/load-workflow-yaml.test.ts chat/chat-flow-config.test.ts chat/stage-workflow-selector.test.ts chat/stage-shortcut.test.ts --runInBand
pnpm --filter @gynecology-chatbot/mobile-api test -- chat/session-summary.test.ts proactive-chat.test.ts mood-variants.test.ts --runInBand
pnpm --filter @gynecology-chatbot/web test -- app/api/admin/schift/workflows/route.test.ts app/api/mobile/ask/route.test.ts --runInBand
pnpm exec tsc --noEmit --skipLibCheck --module NodeNext --moduleResolution NodeNext --target ES2022 --esModuleInterop --types node scripts/fill-pregnancy-rag.ts scripts/backfill-textbook-admin.ts scripts/sync-textbook-v3-to-schift.ts
```

결과 요약:

- YAML alignment: 통과
- mobile-api type-check: 통과
- api type-check: 통과
- web type-check: 통과
- YAML/stage 관련 Jest: 통과
- 요약/생성 관련 Jest: 통과
- 웹 모바일 ask/admin workflow route Jest: 통과
- ingestion script TypeScript compile check: 통과

## 5. 운영 전 체크리스트

- `DATABASE_URL`은 Cloud SQL/Postgres 기준으로 설정한다.
- `GCS_WORKFLOW_BUCKET`은 운영 YAML 저장 bucket과 일치해야 한다.
- router/subworkflow id mapping은 `workflow_stage_mapping` 또는 아래 env로 확인한다.
  - `SCHIFT_WF_ROUTER`
  - `SCHIFT_WF_BABY_INFO`
  - `SCHIFT_WF_LETTER_REFLECTION`
  - `SCHIFT_WF_FREE_CHAT`
  - `SCHIFT_WF_GENERAL`
- 캘린더 질문 요약 webhook을 운영 환경에 연결한다.
  - `CALENDAR_SUMMARY_WEBHOOK_URL`
  - `CALENDAR_SUMMARY_WEBHOOK_SECRET`
- YAML 변경 후에는 `pnpm workflow:verify-yaml`을 먼저 실행하고, 그 다음 업로드/동기화를 진행한다.

## 6. 잔여 리스크

- 현재 작업트리에는 납품 범위 밖의 기존 미커밋 변경과 임시 스크린샷/테스트 산출물이 남아 있다. 이번 납품 커밋에는 검증 가능한 runtime/YAML 정리만 포함했다.
- 실 운영 bucket에 YAML을 업로드하거나 remote workflow를 provision하는 작업은 별도 운영 행위로 분리해야 한다.
- 앱 스토어 제출 빌드는 이번 문서 작성 시점에 새로 실행하지 않았다.

## 7. 납품 판단

코드 기준, YAML 구조, 서버/앱 역할 분리, 요약 API 방향, Cloud SQL 운영 기준은 납품 가능한 상태로 정리되었다.

최종 납품 전에는 운영 환경 env와 workflow id mapping을 확인한 뒤, YAML 업로드 및 smoke test를 실행하면 된다.
