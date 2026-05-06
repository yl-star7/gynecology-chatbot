# Cloud Run Mobile Cutover Checklist

**Target**: Keep mobile app API base on `https://agaya-api-yvdnhntt7a-du.a.run.app` and hosted web/admin pages on `https://agaya-web-yvdnhntt7a-du.a.run.app` (Cloud Run).
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

Non-API URLs:
- `apps/mobile/src/screens/patient/week-baby-images.ts:12` — static pregnancy content image base URL

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

## 5. Recovery plan

- Cloud Run must connect to Cloud SQL `agaya-2026:asia-northeast3:agaya-db`.
- If Cloud Run breaks: fix or roll back the Cloud Run revision, then rebuild or ship OTA only when public URL values change.
- Monitor Cloud Run 5xx + push registration failures (`/api/mobile/push/register`) for first 48h.

## 6. Submission timeline

- Day 0: cut over `eas.json`, run `./build.sh ios` and `./build.sh aos`, submit to TestFlight + Play internal.
- Day 0-1: TestFlight review (~24h typical), Play internal is near-instant.
- Day 1-3: internal testers verify core flows (login, today, records, chat, push register, survey WebView).
- Day 3-7: promote to production track; users update over ~1-2 weeks.
