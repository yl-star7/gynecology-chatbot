# Cloud Scheduler 컷오버 메모

## 현재 상태
- legacyBackend cron 설정은 제거됨 (`apps/web/legacyBackend.json`).
- Cloud Run internal endpoint 추가됨: `apps/api/src/routes/internal/daily-summary.ts`
- 기존 proactive 경로는 유지됨:
  - `apps/web/app/api/admin/proactive/trigger/route.ts`
  - `apps/web/app/api/cron/daily-push/route.ts`
  - `apps/web/app/api/cron/proactive-chat/route.ts`

## 권장 컷오버
1. Cloud Run에 `CRON_SECRET` 설정
2. Cloud Scheduler HTTP job 생성
   - 대상 1: `POST /api/internal/daily-summary`
   - 대상 2: 기존 proactive trigger 또는 별도 Cloud Run internal route
3. Cloud Scheduler 인증
   - OIDC 또는 Bearer `CRON_SECRET` 중 하나로 통일
4. daily summary 로직을 Cloud Run route로 이식 완료
5. 옛 legacyBackend Edge Function 제거 완료

## 남은 legacyBackend SDK 실사용
- `packages/mobile-api/src/legacyBackend/admin-client.ts`
- `legacyBackend/functions/daily-summary/index.ts` 제거됨

## 메모
- Storage 쪽 GCS 전환은 1차 완료.
- Scheduler 쪽은 엔드포인트 골격까지 완료, 실제 summary 로직 이식이 마지막 단계.
