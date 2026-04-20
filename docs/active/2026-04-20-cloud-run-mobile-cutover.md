# Cloud Run Mobile Cutover Checklist

**Target**: Migrate mobile app API base from `https://gynecology-chatbot.vercel.app` to `https://agaya-api-xxxxxxxxxx-as.a.run.app` (Cloud Run).
**Scope**: `apps/mobile` only. Admin/web stays on Vercel.

## 1. Files holding API/web base URLs

Update `EXPO_PUBLIC_API_BASE_URL` only. Leave `EXPO_PUBLIC_WEB_URL` on Vercel (admin-hosted web pages).

- [ ] `apps/mobile/eas.json:20` — preview `EXPO_PUBLIC_API_BASE_URL`
- [ ] `apps/mobile/eas.json:21` — preview `EXPO_PUBLIC_WEB_URL` (KEEP Vercel)
- [ ] `apps/mobile/eas.json:31` — production `EXPO_PUBLIC_API_BASE_URL`
- [ ] `apps/mobile/eas.json:32` — production `EXPO_PUBLIC_WEB_URL` (KEEP Vercel)

Consumers (no code change needed, env-driven):
- `apps/mobile/src/api/mobileApi.ts:104` (`getEnvApiBaseUrl`)
- `apps/mobile/src/components/PushTokenRegistrar.tsx:18` (`/api/mobile/push/register`)
- `apps/mobile/src/screens/auth/LoginScreen.tsx:26`
- `apps/mobile/package.json:6-7` — local dev defaults (`localhost:3005`, `10.0.2.2:3005`) stay as-is

Test fixture (optional cosmetic update):
- `apps/mobile/src/screens/auth/LoginScreen.model.test.ts:42` — string literal `gynecology-chatbot.vercel.app`

Non-API URLs (do NOT touch):
- `apps/mobile/src/screens/patient/week-baby-images.ts:12` — Supabase storage, unrelated

## 2. Preview vs Production envs

Both `preview` and `production` profiles in `eas.json` point to Vercel and must be updated independently. Update both in the same PR.

## 3. WebViews (must remain on Vercel)

- `apps/mobile/src/screens/patient/PatientSurveyFormScreen.tsx` uses `EmbeddedWebContent` with a URL from admin branding (`profilePort.getBranding().surveyFormUrl`) — not hardcoded, served by admin/web on Vercel.
- `apps/mobile/src/web/EmbeddedWebContent.native.tsx` renders whatever URL is passed; no hardcoded host.
- Policy/survey pages are admin-hosted. Keeping `EXPO_PUBLIC_WEB_URL` on Vercel preserves this.

## 4. Native rebuild required

- `EXPO_PUBLIC_*` vars are inlined into the JS bundle at build time. Changing `eas.json` requires a new EAS build (iOS + Android).
- OTA (Expo Updates) could ship a new bundle with the new URL baked in, but still requires rebuilding the JS bundle; this repo's flow is `./build.sh ios|aos` per `CLAUDE.md`.
- Bump `versionCode`/`buildNumber` via `autoIncrement` (already on for production).

## 5. Rollback plan

- Keep `/api/mobile/*` endpoints alive on Vercel for at least 2 full release cycles after cutover. Older TestFlight/Play builds with the Vercel URL baked in must keep working.
- Cloud Run and Vercel must share the same Supabase backend so both read/write consistent data.
- If Cloud Run breaks: flip `EXPO_PUBLIC_API_BASE_URL` back to Vercel, rebuild, submit, or ship OTA with old URL.
- Monitor Cloud Run 5xx + push registration failures (`/api/mobile/push/register`) for first 48h.

## 6. Submission timeline

- Day 0: cut over `eas.json`, run `./build.sh ios` and `./build.sh aos`, submit to TestFlight + Play internal.
- Day 0-1: TestFlight review (~24h typical), Play internal is near-instant.
- Day 1-3: internal testers verify core flows (login, today, records, chat, push register, survey WebView).
- Day 3-7: promote to production track; users update over ~1-2 weeks.
- Keep Vercel mobile endpoints live for 4+ weeks after production rollout to cover slow updaters.
