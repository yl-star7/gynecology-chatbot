# Cloud Run Mobile Cutover Checklist

**Target**: Migrate mobile app API base from `https://gynecology-chatbot.legacyBackend.app` to `https://agaya-api-yvdnhntt7a-du.a.run.app` and hosted web/admin pages to `https://agaya-web-yvdnhntt7a-du.a.run.app` (Cloud Run).
**Scope**: `apps/mobile` uses Cloud Run API/web services backed by Cloud SQL.

## 1. Files holding API/web base URLs

Update both `EXPO_PUBLIC_API_BASE_URL` and `EXPO_PUBLIC_WEB_URL` to Cloud Run. Keep them split by responsibility: API requests go to `agaya-api`, WebView/admin pages go to `agaya-web`.

- [x] `apps/mobile/eas.json:20` — preview `EXPO_PUBLIC_API_BASE_URL`
- [x] `apps/mobile/eas.json:21` — preview `EXPO_PUBLIC_WEB_URL`
- [x] `apps/mobile/eas.json:31` — production `EXPO_PUBLIC_API_BASE_URL`
- [x] `apps/mobile/eas.json:32` — production `EXPO_PUBLIC_WEB_URL`

Consumers (no code change needed, env-driven):
- `apps/mobile/src/api/mobileApi.ts:104` (`getEnvApiBaseUrl`)
- `apps/mobile/src/components/PushTokenRegistrar.tsx:18` (`/api/mobile/push/register`)
- `apps/mobile/src/screens/auth/LoginScreen.tsx:26`
- `apps/mobile/package.json:6-7` — local dev defaults (`localhost:3005`, `10.0.2.2:3005`) stay as-is

Test fixture (optional cosmetic update):
- `apps/mobile/src/screens/auth/LoginScreen.model.test.ts:42` — string literal `gynecology-chatbot.legacyBackend.app`

Non-API URLs (do NOT touch):
- `apps/mobile/src/screens/patient/week-baby-images.ts:12` — legacyBackend storage, unrelated

## 2. Preview vs Production envs

Both `preview` and `production` profiles in `eas.json` point to Cloud Run and must stay aligned.

- `EXPO_PUBLIC_API_BASE_URL`: `https://agaya-api-yvdnhntt7a-du.a.run.app`
- `EXPO_PUBLIC_WEB_URL`: `https://agaya-web-yvdnhntt7a-du.a.run.app`

## 3. WebViews and hosted pages

- `apps/mobile/src/screens/patient/PatientSurveyFormScreen.tsx` uses `EmbeddedWebContent` with a URL from admin branding (`profilePort.getBranding().surveyFormUrl`).
- `apps/mobile/src/web/EmbeddedWebContent.native.tsx` renders whatever URL is passed; no hardcoded host.
- Hosted pages and supporting routes should now be served from Cloud Run / Cloud SQL backed stack.

## 4. Native rebuild required

- `EXPO_PUBLIC_*` vars are inlined into the JS bundle at build time. Changing `eas.json` requires a new EAS build (iOS + Android).
- OTA (Expo Updates) could ship a new bundle with the new URL baked in, but still requires rebuilding the JS bundle; this repo's flow is `./build.sh ios|aos` per `CLAUDE.md`.
- Bump `versionCode`/`buildNumber` via `autoIncrement` (already on for production).

## 5. Rollback plan

- Keep fallback path available only if explicitly needed during rollout.
- Cloud Run must connect to Cloud SQL `agaya-2026:asia-northeast3:agaya-db`.
- If Cloud Run breaks: flip both public URLs back to the previous stable host, rebuild, submit, or ship OTA with old URL.
- Monitor Cloud Run 5xx + push registration failures (`/api/mobile/push/register`) for first 48h.

## 6. Submission timeline

- Day 0: cut over `eas.json`, run `./build.sh ios` and `./build.sh aos`, submit to TestFlight + Play internal.
- Day 0-1: TestFlight review (~24h typical), Play internal is near-instant.
- Day 1-3: internal testers verify core flows (login, today, records, chat, push register, survey WebView).
- Day 3-7: promote to production track; users update over ~1-2 weeks.
- legacyBackend is no longer the target runtime. Keep any legacy endpoint only as an explicit rollback fallback, not as a documented primary path.
