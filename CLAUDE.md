# 모성간호 챗봇 (gynecology-chatbot)

임산부/가임기 사용자 대상 AI 상담 서비스. 모바일 앱(Expo) + 관리자 웹(Next.js) + Supabase 백엔드.

## Repository Structure

```
apps/
  web/           # Next.js — 관리자 콘솔 + 모바일 웹 화면 + API routes
  mobile/        # Expo Router — 사용자 앱 (네이티브)
packages/
  app-core/      # 공용 도메인 타입, 포트, 테마 프리셋
supabase/
  migrations/    # DB 마이그레이션 (public + content 스키마)
docs/
  active/        # 현재 실행 계획, SOW/PRD 점검표
  reference/     # PRD, DB 스키마, UI 스펙 (기준 문서)
scripts/         # 데이터 시드, Schift 동기화, 이미지 생성
flows/flowise/   # Flowise chatflow 설정
```

## Commands

```bash
pnpm install                  # 의존성 설치
pnpm dev:d                    # Docker 로컬 개발 (Postgres + 시드)
pnpm dev:s                    # Supabase 개발 모드
pnpm build                    # 전체 빌드
pnpm lint                     # 린트
pnpm type-check               # 타입 체크
pnpm test                     # 테스트

# 개별 패키지
pnpm --filter @gynecology-chatbot/web exec next dev -p 3005
pnpm --filter @gynecology-chatbot/mobile start
pnpm --filter @gynecology-chatbot/app-core type-check
```

## 기준 문서 (절대 규칙)

**PRD가 모든 구현의 기준이다.** 기존 코드나 임시 구현보다 PRD를 우선한다.

| 문서 | 위치 | 역할 |
|------|------|------|
| PRD | `docs/reference/PRD.md` | 제품 범위, 역할, 기능 정의 |
| PRD 체크리스트 | `docs/reference/PRD_CHECKLIST.md` | 기능 완료 점검 |
| DB 스키마 | `docs/reference/DATABASE_SCHEMA.md` | 테이블/뷰/RLS 기준 |
| UI 스펙 | `docs/reference/UI_SPECS.md` | 화면별 UX 기준 |
| 화면 기능표 | `docs/SCREEN_CAPABILITY_MATRIX.md` | 화면별 기능/이동 경로 |
| SOW/PRD 점검 | `docs/active/2026-03-26-sow-prd-coverage.html` | 기능 충족 점검 |
| 실행 계획 | `docs/active/2026-03-17-app-level-execution-plan.md` | 코드 기준 아키텍처 |

작업 전 관련 기준 문서를 읽고 시작할 것. 특히 새 화면/API 추가 시 PRD와 화면 기능표를 먼저 확인한다.

---

## 가드레일

### 채널 분리 원칙

- **웹(`apps/web`)** = 관리자 전용 + 서버 API
- **모바일(`apps/mobile`)** = 사용자 전용
- 사용자 기능을 웹에 추가하거나, 관리자 기능을 모바일에 추가하지 않는다
- 웹과 앱은 화면을 공유하지 않는다. 관심사와 배포 단위가 분리된다

### 인증 패턴 (절대 규칙)

```
모바일 API (/api/mobile/*) → requireMobileSession(request, hintedUserId)
어드민 API (/api/admin/*)  → readAdminSessionUser() + null 체크 → 401
```

- 모든 어드민 write 엔드포인트에 인증 체크 필수
- 인증 없는 어드민 엔드포인트 생성 금지

### 데이터 소스 전환

- `SERVER_DATA_PROVIDER=docker|supabase` — 서버 데이터 소스 선택
- `ADMIN_DATA_PROVIDER=backend|mock` — 관리자 데이터 포트 선택
- 환경변수로 명시 전환하며, 코드에서 하드코딩하지 않는다

### DB 쿼리 규칙 (절대 규칙)

- `supabaseSelect`, `supabaseInsert`, `supabaseUpdate` 사용 (`@/lib/mobile/supabase-rest`)
- **`content` 스키마 테이블은 직접 쿼리 금지** (Supabase REST가 406 반환)
- content 데이터는 public view를 통해 읽는다:
  - `published_pregnancy_weeks`
  - `published_knowledge_items`
  - `v_pregnancy_week_data`
  - `v_pregnancy_day_contents`
  - `v_week_checklists`
  - `v_week_questions`

### 보안 규칙

- AI 키, DB 비밀번호 등 시크릿은 코드에 하드코딩하지 않고 환경변수로만 주입
- 관리자 입력 URL(설문 등)은 `https:` 스킴 + 허용 도메인 목록으로 검증
- WebView에서 임의 URL을 열지 않는다
- Rate limiting: 채팅 엔드포인트에 `checkRateLimit` 적용 (20회/분)
- 429 응답 시 `Retry-After` 헤더 포함

### 디자인 시스템 (AGENTS.md 참조)

- 모바일 앱 UI 수정 시 `AGENTS.md`의 디자인 토큰/컴포넌트 규칙을 따른다
- 매직 넘버 금지 — `space`, `radii`, `typo`, `shadows` 토큰 사용
- 공통 UI 컴포넌트(`Card`, `Button`, `LabeledInput` 등) 우선 사용
- 색상은 `palette` 또는 `surface`에서 참조. 하드코딩 금지

### 문구 톤

- 산모(환자) 대상: **-어요/-해요** 체
- 어드민 대상: **-습니다** 체 허용
- 개발자 용어 금지 (세션, 엔드포인트, 렌더링 등)
- 영문 eyebrow/라벨 금지 — 모두 한국어
- 에러 메시지도 따뜻한 톤 유지

### 마이그레이션 규칙

- 마이그레이션 파일명: `YYYYMMDD_description.sql`
- `supabase/migrations/`에 추가
- 기존 데이터 호환성 유지 — destructive 변경 시 사용자 확인 필수
- RLS 정책이 필요한 테이블은 마이그레이션에 RLS 포함

### 환경변수

- `.env.example`이 진실의 원천. 새 환경변수 추가 시 `.env.example`도 갱신
- `.env`, `.env.local`, `.env.private`는 gitignore 대상

---

## 작업 워크플로우

1. **기준 문서 확인** — 관련 PRD/화면기능표/DB스키마 읽기
2. **AGENTS.md 확인** — 디자인 시스템/API 규칙 준수 여부
3. **구현** — 채널 분리 + 인증 패턴 + DB 쿼리 규칙 준수
4. **타입 체크** — `pnpm type-check`
5. **테스트** — `pnpm test`

### CI 파이프라인

`.github/workflows/ci.yml` — push(main, develop) / PR(main) 시 자동 실행:
- lint + type-check → test → build (순차)

### 배포

- Vercel 배포 (웹)
- EAS Build (모바일)
- 배포 전 `TODO.md`의 체크리스트 확인

### 모바일 로컬 빌드 (`apps/mobile/build.sh`)

로컬 머신에서 빌드 + 스토어 업로드를 한 번에 수행하는 스크립트.

```bash
cd apps/mobile

./build.sh aos              # Android production 빌드 + Play Console 업로드
./build.sh ios              # iOS production 빌드 + App Store 업로드
./build.sh aos preview      # Android preview APK만 빌드 (업로드 안함)
SKIP_SUBMIT=1 ./build.sh ios # iOS 빌드만, 업로드 생략
```

- `eas build --local`로 로컬 빌드 (EAS 크레덴셜/키스토어 자동 사용)
- 버전코드는 EAS remote에서 조회 → 자동 증가
- 출력 파일: `builds/<platform>/agaya-v{version}-vc{N}-{profile}.{apk|aab|ipa}`
- production → `eas submit`으로 스토어 자동 업로드
- preview → 빌드만 (내부 배포용)
- Android 스토어 업로드에 `play-submit-key.json` (Service Account Key) 필요
