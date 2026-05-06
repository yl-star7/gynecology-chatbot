# AGENTS.md

이 프로젝트에서 AI 에이전트가 코드를 작성할 때 반드시 따라야 하는 규칙입니다.

---

## Execution Rules

- Never stop to ask "if you want" or "shall I" — just do it.
- When you identify follow-up work that logically continues from the current task, execute it immediately.
- Only stop for explicit user confirmation when the action is destructive or irreversible.
- Do not summarize what you "could do next" — do it.

---

## AI 테스트 작성 규칙

테스트를 새로 작성하거나 수정할 때는
[Atipico1/ai-testing-rules](https://github.com/Atipico1/ai-testing-rules)의
방향을 이 프로젝트 규칙으로 적용합니다.

### 핵심 원칙

1. 구현이 아니라 **관찰 가능한 동작**을 테스트합니다. 순수 리팩터링만으로 테스트가 깨지면 테스트가 구현을 너무 많이 알고 있는 것입니다.
2. 모킹은 시스템 경계에서만 사용합니다. 같은 코드베이스 안의 값 객체, 엔티티, 순수 함수, 내부 서비스/모듈은 실제 구현을 사용합니다.
3. 기본값은 Classist/Chicago 스타일 TDD입니다. London/Mockist 스타일은 AI 주도 리팩터링에서 쉽게 부서지는 테스트를 만들기 쉽습니다.
4. 의미 있는 적은 수의 테스트가 구현에 묶인 많은 테스트보다 낫습니다.

### 모킹 경계

모킹해도 되는 대상은 아래처럼 프로세스나 외부 시스템 경계를 넘는 것뿐입니다.

- Database / ORM
- 서드파티 HTTP API
- 파일시스템, 시간, 난수, 네트워크
- 프로세스 경계를 넘는 의존성

아래 대상은 모킹하지 않습니다.

- 우리가 소유한 값 객체, DTO, 엔티티
- 순수 함수와 유틸리티
- 같은 코드베이스 안의 내부 collaborator
- 테스트 대상 자체

HTTP 의존성은 가능하면 인터페이스/trait mock보다 `msw`, `nock`, 테스트용 HTTP fake처럼 경계에 가까운 fake를 사용합니다. 파일시스템은 mock보다 실제 임시 디렉터리를 우선합니다.

### Assertion 규칙

- 반환값과 관찰 가능한 상태를 검증합니다.
- `toHaveBeenCalledWith(...)`, `verify(...)`, spy 호출 여부를 주된 검증 수단으로 삼지 않습니다.
- 필드별 나열보다 전체 객체 비교를 우선합니다. 예: `expect(result).toEqual(expected)`
- LLM 응답 텍스트, timestamp, 순서 없는 set처럼 비결정적인 출력은 snapshot으로 고정하지 않습니다.

### 테스트 이름

테스트 이름은 메서드명이나 내부 호출 순서가 아니라 동작을 설명해야 합니다.

```ts
// Bad - implementation-flavored
test_findUnique_called_once()
test_calls_upsert_then_emits_event()
should_work()

// Good - behavior
returns_cached_result_when_fetched_within_ttl()
rejects_login_when_password_is_expired()
charges_full_price_for_non_vip_users()
```

기본 템플릿은 `<subject>_<expected_behavior>_when_<condition>`입니다.

### 테스트 구조

| Layer | Purpose | Budget |
| --- | --- | --- |
| Unit | 순수 로직, 엔티티, 유틸 | 많이 작성해도 됨. in-memory, milliseconds |
| Integration | 모듈 + 실제 DB/queue 등 | 핵심 도메인별로 적당히 |
| E2E | 중요한 사용자 여정 | 여정당 소수 |
| Regression | 과거 버그 재발 방지 | 버그가 생길 때마다 1개 |

- 중요한 사용자 여정마다 E2E는 소수만 둡니다.
- 도메인별 핵심 흐름에는 통합 테스트를 둡니다.
- Unit test는 로직이 있는 곳에만 작성합니다. getter, DI wiring, framework glue, 단순 config/constant에는 억지로 만들지 않습니다.
- Unit spec은 소스 옆에 두고, integration/E2E는 별도 트리에 둡니다.
- 비싸거나 live 의존성이 있는 테스트는 `LIVE_TEST=true`, `RUN_EXPENSIVE=1` 같은 명시적 env flag 뒤에 둡니다.

### 도메인 엔티티 추출 기준

아래 중 하나라도 맞으면 DB row에 흩어진 로직을 도메인 엔티티로 끌어올리는 것을 우선 검토합니다.

- 같은 데이터에 대한 비즈니스 로직이 2개 이상의 서비스에 흩어져 있습니다.
- 서비스가 plain DB row 위에서 산술 계산이나 상태 전이를 직접 수행합니다.
- 사실상 순수 로직인데 테스트하려고 DB를 띄워야 합니다.

이 경우 서비스는 저장/조회 orchestration을 맡고, 상태 변화 규칙은 순수 in-memory 엔티티 메서드로 옮겨 테스트합니다.

### Property-Based Testing

parser, encoder, sorter, validator, state machine처럼 넓은 입력 공간에 명확한 invariant가 있으면 example test에 property-based test를 더합니다. TypeScript에서는 `fast-check`를 우선 고려합니다.

같은 함수에 네 번째 example test를 추가하려는 상황이면 property test로 바꿀 수 있는지 먼저 검토합니다.

### Flaky 테스트

1. flaky test는 커밋하지 않습니다.
2. 이미 들어간 flaky test는 24시간 안에 격리합니다.
3. 격리할 때는 linked issue, owner, deadline을 남깁니다. owner가 없으면 삭제합니다.
4. retry loop, `sleep()`, timeout 증가로 덮지 말고 shared global state, real clock, test ordering, unseeded randomness, network 같은 원인을 고칩니다.

### 기존 Mockist 테스트 마이그레이션

기존 테스트를 재미로 갈아엎지 않습니다. 점진적으로 적용합니다.

1. 새 테스트는 지금부터 이 규칙을 따릅니다.
2. 기존 테스트 파일을 수정할 때는 내부 collaborator mock을 경계 mock 또는 실제 구현으로 바꾸는 방향을 우선합니다.
3. `toHaveBeenCalledWith`가 많은 최악의 파일 3-5개를 먼저 찾아 도메인 단위로 천천히 바꿉니다.
4. 고위험 도메인 하나에 실제 DB 기반 테스트 패턴을 먼저 만들고, 검증된 뒤 확장합니다.
5. 비결정적 출력 snapshot은 구조적 assertion으로 바꾸거나 삭제합니다.

### 작업 흐름

- 스펙에서 실패하는 테스트를 먼저 작성하고, 그 테스트를 통과시키는 구현을 합니다.
- 구현을 먼저 만든 뒤 "이 파일 테스트 써줘" 방식으로 요청하지 않습니다. 그런 테스트는 현재 구현에 붙은 coverage theater가 되기 쉽습니다.
- 한 테스트는 한 행동만 보호합니다. 하나의 행동을 설명하는 데 여러 `expect()`가 필요한 것은 괜찮지만, 서로 다른 행동이면 테스트를 나눕니다.

### PR Red Flags

아래 신호가 보이면 반려하거나 재작업합니다.

- 실제 assertion보다 `mock.*` 호출이 더 많습니다.
- `toHaveBeenCalledWith` / `verify()`가 유일한 assertion입니다.
- `_internal/` 또는 private module path를 import합니다.
- LLM 출력, timestamp, network output을 snapshot으로 고정합니다.
- linked issue와 owner 없는 `it.skip`이 있습니다.
- 함수명 변경 때마다 테스트 이름도 같이 바뀝니다.
- public 함수 하나짜리 파일의 테스트가 원본 파일보다 훨씬 깁니다.
- boundary mock이나 실제 DB 대신 full-prisma-mock 같은 전면 mock dependency를 새로 추가합니다.

### 테스트를 쓰지 않아야 할 때

- 로직 없는 plain CRUD는 핵심 E2E 하나로 충분합니다.
- DI, routing, framework wiring은 프레임워크가 이미 검증합니다.
- config/constant는 타입 시스템이나 schema validator에 맡깁니다.
- 버릴 스크립트는 production data를 만지지 않는 한 테스트하지 않습니다.
- 곧 삭제할 코드는 테스트하지 않습니다.

테스트가 보호하는 행동을 한 문장으로 말할 수 없다면 그 테스트는 쓰지 않습니다.

---

## 모바일 앱 디자인 시스템

모바일 앱(`apps/mobile/`)의 UI를 수정할 때는 반드시 기존 디자인 시스템을 사용하세요.

### 디자인 토큰 (`src/tokens.ts`)

모든 스타일 값은 매직 넘버 대신 토큰을 사용합니다.

| 토큰 | 값 | 용도 |
|------|---|------|
| `space.xs` ~ `space.xxxl` | 4, 8, 12, 16, 20, 24, 32 | margin, padding, gap |
| `radii.sm` ~ `radii.full` | 10, 14, 18, 20, 24, 999 | borderRadius |
| `typo.eyebrow`, `titleLg`, `titleMd`, `titleSm`, `body`, `caption`, `label`, `button` | 타이포그래피 프리셋 | 모든 Text 스타일 |
| `shadows.card`, `shadows.header`, `shadows.fab` | Platform.select 기반 | 카드/헤더/FAB 그림자 |

```ts
// 올바른 사용
import { space, radii, typo, shadows } from "../theme";
styles.card = { padding: space.lg, borderRadius: radii.xl, ...shadows.card };

// 금지 - 매직 넘버 직접 사용
styles.card = { padding: 16, borderRadius: 20 };
```

### 공통 UI 컴포넌트 (`src/components/ui/`)

새 화면을 만들거나 기존 화면을 수정할 때, 아래 컴포넌트를 우선 사용하세요.

| 컴포넌트 | 용도 | 주요 prop |
|----------|------|-----------|
| `Card` | 그림자 카드 래퍼 | `variant`: `primary` / `accent` / `muted` |
| `Button` | 통일된 버튼 | `variant`: `primary` / `secondary` / `text` |
| `LabeledInput` | 라벨 + 인풋 필드 | `label`, `value`, `onChangeText`, `placeholder` |
| `HeroSection` | eyebrow + title + description | `eyebrow`, `title`, `description` |
| `EmptyState` | 빈 상태 (아이콘 + 텍스트) | `icon`, `title`, `description` |
| `KeyboardScreen` | SafeArea + KAV + ScrollView 래퍼 | `centered` |
| `Pressable` | 터치 피드백이 있는 Pressable | RN Pressable과 동일 API |

```tsx
// 올바른 사용 - 공통 컴포넌트 우선
import { Card, Button, LabeledInput } from "../components/ui";

// 금지 - 같은 패턴을 화면마다 새로 정의
const styles = StyleSheet.create({
  card: { borderRadius: 24, backgroundColor: ..., shadowColor: ... },
  // ...중복 스타일
});
```

### 스타일 규칙

1. **카드에 `borderWidth` 사용 금지** - `shadows.card`를 사용
2. **인풋 필드에 border 사용 금지** - 배경색(`fieldSurface`)으로만 구분
3. **RN `Pressable` 직접 사용 지양** - `ui/Pressable`을 import해서 터치 피드백 적용
4. **`CARD_SHADOW` 등 로컬 그림자 정의 금지** - `shadows.card`를 import
5. **ScrollView에 `showsVerticalScrollIndicator={false}` 기본 적용**
6. **리스트/홈 화면에 `RefreshControl` 포함**

### 테마와 색상 (`src/theme.ts`)

- `palette` - 네이티브 테마 프리셋에서 가져온 원시 색상
- `patientSurfacePalette` (alias: `surface`) - UI 용도별 매핑 (pageBackground, surfacePrimary 등)
- 색상은 반드시 palette 또는 surface에서 참조. 하드코딩 금지 (`#ffffff` 버튼 라벨 제외)

### 문구 톤

- 산모(환자) 대상 문구는 **-어요/-해요** 체를 사용
- 어드민 대상 문구는 **-습니다** 체 허용 (운영자용)
- 개발자 용어 금지 (세션, 엔드포인트, 렌더링 등)
- 영문 eyebrow/라벨 금지 - 모두 한국어
- 에러 메시지도 따뜻한 톤 유지 ("~하지 못했어요. 다시 시도해주세요.")

---

## 웹 API 규칙

`apps/web/src/app/api/` 에서 API 라우트를 작성할 때 따르는 규칙입니다.

### 인증 패턴

- **모바일 API** (`/api/mobile/*`): `requireMobileSession(request, hintedUserId)` 사용
- **어드민 API** (`/api/admin/*`): `readAdminSessionUser()` + null 체크 → 401
- 모든 어드민 write 엔드포인트에 반드시 인증 체크 포함

### Rate Limiting

- 채팅 엔드포인트에 `checkRateLimit` 적용 (사용자당 20회/분)
- `@/lib/mobile/rate-limit.ts`의 `checkRateLimit(key, limit, windowMs)` 사용
- 429 응답 시 `Retry-After` 헤더 포함

### 어드민 엔드포인트 목록

| 엔드포인트 | 메서드 | 설명 |
|------------|--------|------|
| `/api/admin/analytics` | GET | 실시간 운영 메트릭 6종 |
| `/api/admin/push/send` | POST | 푸시 알림 수동 발송 |
| `/api/admin/proactive/trigger` | POST | Proactive 메시지 트리거 |
| `/api/admin/schedule` | GET/PUT | 알림 스케줄 설정 |
| `/api/admin/content/weeks` | GET | 주차 목록 |
| `/api/admin/content/weeks/[weekNumber]` | GET/POST | 주차 상세/수정 |
| `/api/admin/content/knowledge-items` | GET/POST | 지식 문서 CRUD |
| `/api/admin/content/checklists` | GET/POST | 체크리스트 관리 |
| `/api/admin/content/questions` | GET/POST | 질문 관리 |
| `/api/admin/rag/upload` | POST | RAG 문서 업로드 |
| `/api/admin/rag-provider` | GET/PUT | RAG 백엔드 설정 (schift/legacyBackend/auto) |
| `/api/admin/schift` | GET/POST | Schift 컬렉션 조회 / 버킷 업로드 |
| `/api/admin/schift/chat` | POST | Schift RAG 채팅 테스트 |
| `/api/admin/workflow-rules/[ruleId]` | GET/PUT/DELETE | 응답 정책 |
| `/api/admin/allowed-phone-numbers` | GET/POST | 허용 번호 관리 |
| `/api/admin/users/persona` | GET/POST | 상담 성향 profile/signals 조회 및 수동 signal 추가 |

### DB 쿼리 패턴

- `legacyBackendSelect`, `legacyBackendInsert`, `legacyBackendUpdate` 사용 (`@/lib/mobile/legacyBackend-rest`)
- content 스키마 테이블은 **직접 쿼리 금지** (legacyBackend REST가 406 반환)
- 운영 API는 public mirror 테이블/view 사용: `content_knowledge_items`, `content_pregnancy_week_data`, `content_pregnancy_day_contents`, `content_week_checklists`, `content_week_questions`, `content_pregnancy_documents`, `v_user_persona_profiles`, `v_user_calendar_activity`
- public 스키마는 prefix 없이 사용 (예: `calendar_logs`)

---

## 모바일 빌드 & 배포

### 로컬 빌드 스크립트 (`apps/mobile/build.sh`)

```bash
./build.sh <aos|ios> [profile]    # profile: preview | production (기본: production)
SKIP_SUBMIT=1 ./build.sh aos     # 빌드만, 업로드 생략
```

- `eas build --local` 사용 — EAS 키스토어/크레덴셜 자동 적용
- 출력: `builds/<platform>/agaya-v{version}-vc{N}-{profile}.{apk|aab|ipa}`
- production 빌드 시 `eas submit`으로 스토어 자동 업로드
- preview 빌드는 스토어 업로드 대상 아님 (내부 배포용)

### 빌드 관련 파일

| 파일 | 용도 |
|------|------|
| `eas.json` | EAS 빌드/서브밋 프로필 설정 |
| `app.json` | Expo 앱 설정 (패키지명, 버전, 플러그인) |
| `plugins/withAdiRegistration.js` | Play Console 패키지 인증 토큰 주입 플러그인 |
| `play-submit-key.json` | Google Play API 서비스 계정 키 (gitignore 대상) |
| `builds/` | 로컬 빌드 산출물 디렉토리 (gitignore 대상) |

### 주의사항

- `android/`, `ios/` 디렉토리는 gitignored — EAS가 prebuild 시 재생성
- 로컬 파일을 APK에 포함하려면 Expo config plugin으로 주입해야 함 (`withAdiRegistration` 참고)
- `play-submit-key.json`은 절대 커밋하지 않음
