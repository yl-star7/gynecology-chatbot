# AGENTS.md

이 프로젝트에서 AI 에이전트가 코드를 작성할 때 반드시 따라야 하는 규칙입니다.

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
| `/api/admin/workflow-rules/[ruleId]` | GET/PUT/DELETE | 응답 정책 |
| `/api/admin/allowed-phone-numbers` | GET/POST | 허용 번호 관리 |

### DB 쿼리 패턴

- `supabaseSelect`, `supabaseInsert`, `supabaseUpdate` 사용 (`@/lib/mobile/supabase-rest`)
- content 스키마 테이블은 `content.` prefix 사용 (예: `content.week_checklists`)
- public 스키마는 prefix 없이 사용 (예: `calendar_logs`)
