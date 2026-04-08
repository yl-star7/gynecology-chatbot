# DEPLOYMENT_HANDOFF

## 1) 문서 목적

이 문서는 운영 이관 시 필요한 배포 구조, 환경변수, 계정/외부 서비스 의존성을 한 번에 전달하기 위한 인계 문서입니다.

- 비밀값(토큰/키/비밀번호) 자체는 포함하지 않습니다.
- 어떤 값을 어디에 설정해야 하는지(변수명/용도/적용 위치)만 명시합니다.
- 웹(web) / 모바일(mobile) / DB / 외부 서비스 기준으로 운영 관점을 정리합니다.

---

## 2) 배포 구성 개요

### 2-1. 배포 대상별 구성

| 구분 | 배포 위치 | 역할 | 핵심 설정 포인트 |
|---|---|---|---|
| web | Vercel (Next.js) | 관리자 콘솔 + 모바일 API + Cron API | 프로젝트 환경변수, Cron 인증(`CRON_SECRET`), 관리자 인증(`ADMIN_SESSION_SECRET`, `ADMIN_LOGIN_PASSWORD`) |
| mobile | Expo EAS Build → App Store / Google Play | iOS/Android 앱 빌드 및 배포 | `app.json` 앱 식별자/버전, `eas.json` 빌드 프로필, Firebase 설정 파일 |
| db | Supabase (PostgreSQL + Storage) | 사용자/세션/콘텐츠 데이터 저장 | Supabase URL/키, 서비스 롤 키, 스키마/마이그레이션 반영 |
| 외부 서비스 | Twilio / Gemini / Schift / Firebase / 스토어 콘솔 | 인증, AI 응답, 워크플로우, 푸시, 스토어 배포 | 각 서비스 API 키/권한/프로젝트 연동 상태 |

### 2-2. 인증/세션 구조(운영 관점)

- 모바일 API 인증: `Authorization: Bearer <token>` 기반 세션 검증 (`requireMobileSession`)
- 관리자 API 인증: 서버 쿠키 세션 기반 (`readAdminSessionUser`)
- 관리자 세션 쿠키명: `gc_admin_session`
- Cron API 인증: `CRON_SECRET` 기반 Bearer 토큰 검증

---

## 3) 환경변수 표 (.env.example 기준)

> 원칙: 아래 변수명은 운영 환경에 모두 정의합니다. 값은 인계 시 별도 보안 채널(비밀관리도구/암호화 문서)로 전달합니다.

### 3-1. App/런타임 공통

| 변수명 | 용도 | 적용 위치 |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | 웹 앱 기본 URL | web (Next.js 런타임/클라이언트) |
| `EXPO_PUBLIC_API_BASE_URL` | 모바일 앱이 호출할 API 기준 URL | mobile 앱 런타임 |
| `EXPO_PUBLIC_WEB_URL` | 모바일 내 웹뷰/웹 연동 기준 URL | mobile 앱 런타임 |
| `NEXT_PUBLIC_DEV_USER_ID` | 개발/로컬 사용자 식별 (개발용) | web 개발 환경 |
| `EXPO_PUBLIC_DEV_USER_ID` | 개발/로컬 사용자 식별 (개발용) | mobile 개발 환경 |
| `EXPO_PUBLIC_MOBILE_DATA_PROVIDER` | 모바일 데이터 공급 방식 선택값 | mobile 런타임 |
| `SERVER_DATA_PROVIDER` | 서버 데이터 공급자(`docker`/`supabase`) | web 서버 런타임 |
| `ADMIN_DATA_PROVIDER` | 관리자 데이터 공급자(`backend`/`mock`) | web 서버 런타임 |

### 3-2. Database/로컬 개발 보조

| 변수명 | 용도 | 적용 위치 |
|---|---|---|
| `DATABASE_URL` | DB 연결 문자열 | web 서버/개발 스크립트 |
| `LOCAL_DB_SCHEMA` | 로컬 DB 스키마 이름 | 로컬 개발 |
| `LOCAL_DEV_USER_PHONE_NUMBER` | 로컬 테스트 사용자 전화번호 | 로컬 개발 |
| `LOCAL_DEV_USER_PASSWORD` | 로컬 테스트 사용자 비밀번호 | 로컬 개발 |
| `LOCAL_DEV_USER_NAME` | 로컬 테스트 사용자 이름 | 로컬 개발 |
| `LOCAL_DEV_DUE_DATE` | 로컬 테스트 사용자 예정일 | 로컬 개발 |
| `LOCAL_ADMIN_USER_ID` | 로컬 관리자 ID | 로컬 개발 |
| `LOCAL_ADMIN_PHONE_NUMBER` | 로컬 관리자 전화번호 | 로컬 개발 |
| `LOCAL_ADMIN_PASSWORD` | 로컬 관리자 비밀번호 | 로컬 개발 |
| `ADMIN_LOGIN_PASSWORD` | 운영/개발 관리자 로그인 비밀번호 | web 서버 인증(`apps/web/src/lib/admin/auth.ts`) |
| `LOCAL_ADMIN_NAME` | 로컬 관리자 표시 이름 | 로컬 개발 |
| `ADMIN_ACTOR_USER_ID` | 관리자 작업 행위자 식별자 | 로컬 개발/관리자 로깅 |
| `PHONE_DATA_SECRET` | 전화번호 암복호화 키 | web 서버 개인정보 처리 |

### 3-3. Supabase

| 변수명 | 용도 | 적용 위치 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | web/mobile 클라이언트 초기화 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase 퍼블리셔블 키 | web/mobile 클라이언트 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key(호환 변수) | web/mobile 클라이언트 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 롤 키(서버 전용) | web 서버 API |
| `SUPABASE_SERVICE_ROLE` | 서비스 롤 키 별칭 | web 서버 API |
| `SERVICEROLE` | 서비스 롤 키 별칭 | web 서버 API |

### 3-4. AI/워크플로우

| 변수명 | 용도 | 적용 위치 |
|---|---|---|
| `GEMINI_API_KEY` | Gemini API 인증 키 | web 서버 AI 호출 |
| `SCHIFT_API_KEY` | Schift 워크플로우 API 키 | web 서버 워크플로우 호출 |

### 3-5. 인증/SMS

| 변수명 | 용도 | 적용 위치 |
|---|---|---|
| `TWILIO_ACCOUNT_SID` | Twilio 계정 식별자 | web 서버 OTP/SMS |
| `TWILIO_AUTH_TOKEN` | Twilio 인증 토큰 | web 서버 OTP/SMS |
| `TWILIO_VERIFY_SERVICE_SID` | Twilio Verify 서비스 식별자 | web 서버 OTP 검증 |
| `MOBILE_AUTH_TEST_MODE` | 모바일 인증 테스트 모드 | 개발/스테이징 환경 |

### 3-6. 보안/세션/Cron

| 변수명 | 용도 | 적용 위치 |
|---|---|---|
| `ADMIN_SESSION_SECRET` | 관리자 세션 서명 비밀값 | `apps/web/src/lib/admin/auth.ts` |
| `CRON_SECRET` | Cron API 인증 비밀값 | web Cron endpoint |

### 3-7. 설정 시 주의사항

- `ADMIN_SESSION_SECRET`, `ADMIN_LOGIN_PASSWORD`, `PHONE_DATA_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `TWILIO_AUTH_TOKEN`, `GEMINI_API_KEY`, `SCHIFT_API_KEY`, `CRON_SECRET`는 **서버 전용 비밀값**으로 관리합니다.
- `EXPO_PUBLIC_*`, `NEXT_PUBLIC_*` 접두 변수는 클라이언트 노출 범위를 고려해 값 설계가 필요합니다.
- 운영/스테이징/개발 환경을 분리해 같은 변수명에 환경별 값을 각각 관리합니다.

---

## 4) 외부 서비스/계정 의존성

### 4-1. 필수 서비스

| 서비스 | 사용 목적 | 운영자가 확인할 항목 |
|---|---|---|
| Vercel | web 배포/운영, Cron 실행 | 프로젝트 권한, 환경변수, Cron 라우트 동작 |
| Supabase | DB/Storage | 프로젝트 접근 권한, 키 발급 상태, 마이그레이션 반영 |
| Expo(EAS) | 모바일 빌드/배포 | EAS 프로젝트 연결, 빌드 권한, 배포 이력 |
| Apple Developer / App Store Connect | iOS 배포 | 인증서/프로비저닝 상태, TestFlight 권한 |
| Google Play Console | Android 배포 | 앱 권한, 트랙(내부/프로덕션) 접근 권한 |
| Firebase | 모바일 푸시(FCM/APNs 연동) | 프로젝트 연결, 서비스 계정/키 등록 |
| Twilio | OTP/SMS 인증 | Verify 서비스 활성화, 발신 정책/요금제 |
| Google Gemini | AI 응답 생성 | API 키 유효성, 사용량 한도 |
| Schift | 워크플로우 AI 엔진 | API 키 권한, 워크플로우 접근 권한 |

### 4-2. 모바일 앱 식별자/빌드 설정 기준

- iOS Bundle Identifier: `com.gynecology.chatbot`
- Android Package: `com.gynecology.chatbot`
- Expo slug: `gynecology-chatbot`
- EAS build profile: `development` / `preview` / `production`
- `production`은 `autoIncrement: true`로 빌드 번호 자동 증가

---

## 5) 배포 순서 개요

1. **DB 준비 (Supabase)**
   - 운영 Supabase 프로젝트 접근 권한 확인
   - 마이그레이션/스키마 최신 상태 반영
   - 서비스 롤 키/퍼블리셔블 키 발급 상태 확인

2. **web 배포 준비 (Vercel)**
   - `.env.example` 기준으로 운영 환경변수 등록
   - 관리자 인증/모바일 세션/Cron 관련 변수 우선 검증
   - 배포 후 관리자 로그인, 모바일 API 인증 동작 점검

3. **mobile 배포 준비 (EAS)**
   - `app.json` 버전/식별자 확인
   - `eas.json`의 production 프로필 기준 빌드
   - Firebase 설정 파일 연결 상태 확인(iOS/Android)

4. **스토어 제출**
   - iOS: TestFlight 또는 App Store 제출
   - Android: 내부 테스트 또는 프로덕션 트랙 제출

5. **운영 전환 검증**
   - 모바일 로그인/세션 유지
   - 관리자 로그인/주요 관리 기능
   - 채팅 응답, OTP, 푸시, Cron 동작

---

## 6) 운영 이관 체크리스트

### 6-1. 환경변수/비밀값

- [ ] `.env.example`의 변수명이 운영 환경에 모두 반영되어 있다.
- [ ] 서버 전용 비밀값이 클라이언트 공개 변수에 섞이지 않았다.
- [ ] `ADMIN_SESSION_SECRET`, `ADMIN_LOGIN_PASSWORD`, `CRON_SECRET` 설정이 완료되었다.
- [ ] Supabase/Twilio/Gemini/Schift 키가 운영 계정 기준으로 등록되었다.

### 6-2. web

- [ ] Vercel 프로젝트에 web 배포가 정상 완료되었다.
- [ ] 관리자 로그인/세션 유지/로그아웃이 정상 동작한다.
- [ ] 모바일 API에서 Bearer 세션 인증이 정상 동작한다.
- [ ] Cron 인증 호출이 정상 동작한다.

### 6-3. mobile

- [ ] iOS/Android production 빌드가 성공했다.
- [ ] 앱 식별자(Bundle ID/Package)가 운영 계정과 일치한다.
- [ ] 스토어 제출 트랙(TestFlight/Internal Testing 포함) 등록이 완료되었다.
- [ ] 앱에서 API 연결/로그인/채팅/푸시 수신이 정상이다.

### 6-4. DB/외부 서비스

- [ ] Supabase 스키마 및 운영 데이터 접근 권한이 확인되었다.
- [ ] Twilio Verify OTP 발송/검증이 정상이다.
- [ ] Gemini/Schift 호출이 정상이며 에러 로깅 경로가 확인되었다.
- [ ] Firebase 푸시(FCM/APNs) 연동 상태가 확인되었다.

### 6-5. 인수인계 완료 조건

- [ ] 운영 담당자에게 비밀값 전달 채널(보안 저장소)이 명시되었다.
- [ ] 계정 소유권/권한(소유자, 관리자, 백업 담당)이 확정되었다.
- [ ] 장애 대응 연락 체계(담당자/우선순위)가 공유되었다.
- [ ] 최종 점검 결과(성공/이슈/조치 계획)가 기록되었다.
