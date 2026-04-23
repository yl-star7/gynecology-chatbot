# Admin 콘솔 계층 재구성 계획

작성일: 2026-04-23
상태: 제안 (구현 전)
작성자: architect-reviewer
관련 이슈: TaskList #4 — "ADMIN 쪽에서 시각화(hierarchy)가 안맞는 것 재구성"

---

## 0. 요약

현재 Admin 콘솔은 네 개의 최상위 메뉴(`운영 상태`, `계정`, `콘텐츠`, `모니터링`)만 존재합니다. 그러나 실제로 존재하는 기능(참조 파일 업로드, 주차별 콘텐츠, 응답 워크플로우, 홈 카피, Schift 워크플로우 에디터)은 "콘텐츠" 한 섹션 아래에 수평으로 나열되어 있어 책임이 섞여 있습니다. 특히 다음 세 가지가 계층 혼란의 주된 원인입니다.

1. "콘텐츠" 섹션이 **지식 데이터, 주차별 콘텐츠, 홈 카피, 응답 워크플로우**라는 성격이 다른 네 가지를 한 바구니에 담고 있습니다.
2. 응답 워크플로우는 **파일 YAML / Prisma `workflow_definitions` / Schift Workflow 서버** 세 레이어가 공존하며, Admin UI에서 보이는 데이터가 어느 레이어인지 추적이 어렵습니다.
3. 유저가 요청한 신규 기능(기분별 응답 변주, 자유 검색 사전, 스토리지 일원화, 이미지 설정 분리)은 현재 IA에서 자연스럽게 들어갈 자리가 없습니다.

본 문서는 **구현을 수행하지 않고** 현재 상태 진단, 새 IA 제안, 단계별 마이그레이션 절차, 남은 결정 사항, 회귀 위험만 정리합니다. 승인 후 별도 task로 구현합니다.

---

## 1. 현재 상태 진단

### 1.1 네비게이션 계층 (사이드바)

출처: `apps/web/src/components/admin/AdminConsoleShell.tsx:13-27`

```ts
const NAV_ITEMS: NavItem[] = [
  { href: "/admin/operations", label: "운영 상태" },
  { href: "/admin/accounts", label: "계정" },
  {
    href: "/admin/content",
    label: "콘텐츠",
    children: [
      { href: "/admin/content/documents", label: "참조 파일" },
      { href: "/admin/content/static", label: "지식 콘텐츠" },
      { href: "/admin/content/weeks", label: "주차별 아기는요?" },
      { href: "/admin/content/policies", label: "응답 워크플로우" },
    ],
  },
  { href: "/admin/monitoring", label: "모니터링" },
];
```

각 메뉴의 실제 기능을 확인했습니다.

| 사이드바 라벨 | 라우트 | 실제 컴포넌트 | 실제로 편집하는 것 |
|---|---|---|---|
| 운영 상태 | `/admin/operations` (`apps/web/app/admin/operations/page.tsx`) | `AdminOperationsPanel.tsx` | 대시보드 지표, 메트릭 bar |
| 계정 | `/admin/accounts` (`apps/web/app/admin/accounts/page.tsx`) | `AdminAccountSection.tsx` | 사용자 계정 목록/상태 |
| 참조 파일 | `/admin/content/documents` | `content/AdminDocumentsSection.tsx` (415줄) | `content_pregnancy_documents` 테이블 (RAG 문서) |
| 지식 콘텐츠 | `/admin/content/static` | `content/AdminStaticSection.tsx` (386줄) | `content_knowledge_items` + 홈 카피(`AdminHomeCopyPanel`) |
| 주차별 아기는요? | `/admin/content/weeks` | `content/AdminWeeksSection.tsx` (789줄) + `AdminWeekOverlay.tsx` (1102줄) | 주차/Day/섹션/이미지 CRUD |
| 응답 워크플로우 | `/admin/content/policies` | `content/AdminPoliciesSection.tsx` + `AdminWorkflowEditorAdapter.tsx` | Schift Workflow (외부) |
| 모니터링 | `/admin/monitoring` | `AdminMonitoringSection.tsx` | 모니터링 위젯 |

이 표의 "실제로 편집하는 것" 열에서 드러나듯이, **"콘텐츠" 섹션 안에 적어도 네 가지 이질적인 편집 대상**이 섞여 있습니다.

- RAG 문서(벡터화 대상)
- 안내문/홈 카피(정적 문구, 임베딩 없음)
- 주차별 콘텐츠(구조화된 아기 발달 데이터)
- 워크플로우(대화 엔진 로직)

### 1.2 데이터 모델 vs UI 불일치 지점

근거 파일과 함께 불일치를 나열합니다.

#### 1.2.1 "지식 콘텐츠"라는 한 탭 안에 두 데이터 소스

`AdminStaticSection.tsx:7-17` 기준으로 이 섹션은 두 데이터를 동시에 다룹니다.

- `knowledgeItems` — `content_knowledge_items` 테이블 (주차별 안내문)
- `homeCopyItems` — `system_config` 테이블의 단일 row (홈 화면 문구)

데이터 저장 위치와 에디팅 단위가 다릅니다. `AdminStaticSection.tsx:17`에서 `AdminHomeCopyPanel`을 직접 합성해 화면 내부에서 두 리스트를 세로로 붙여 놓은 구조입니다. 사용자 입장에서는 "지식 콘텐츠" 메뉴를 눌렀을 때 홈 문구 편집이 같이 등장하는 이유가 명확하지 않습니다.

출처:
- `apps/web/src/lib/admin/home-copy-config.ts:21-33` — `system_config.findUnique` / `upsert` 사용
- `apps/web/src/components/admin/content/AdminStaticSection.tsx:17` — `AdminHomeCopyPanel` 직접 import

#### 1.2.2 "참조 파일"과 "지식 콘텐츠"의 경계 모호

두 탭 모두 "글"을 다루지만 목적이 다릅니다.

- `AdminDocumentsSection.tsx` — `content_pregnancy_documents` (RAG용, 임베딩 생성, `embedPregnancyDocument` 호출: `cloud-sql-admin-content-port.ts:389`)
- `AdminStaticSection.tsx` — `content_knowledge_items` (안내 문구, 임베딩 없음)

사용자 관점에서 "글을 올리는 곳이 왜 두 개인지" 구분이 라벨만으로는 전달되지 않습니다. 두 테이블 모두 `image_url` 필드를 가지고 있지만 이미지 업로드 경로/버킷 설정은 다릅니다.

근거:
- `supabase/migrations/20260331172420_move_content_to_public_and_drop_allowlist.sql` — `content_pregnancy_documents`, `content_knowledge_items`
- `apps/web/src/lib/admin/adapters/cloud-sql-admin-content-port.ts:309-327` — RAG 문서 매핑
- `apps/web/src/lib/admin/adapters/cloud-sql-admin-content-port.ts:300-302` — knowledge item 매핑

#### 1.2.3 "응답 워크플로우" 한 메뉴 안에 두 UI

`AdminPoliciesSection.tsx`(378줄)는 테이블 + 편집 오버레이 기반 UI입니다. 반면 `AdminWorkflowEditorAdapter.tsx:125-141`는 Schift SDK의 `WorkflowBuilder`(그래프 에디터)를 그대로 임베드합니다. 같은 메뉴 안에 폼 기반 CRUD와 그래프 빌더가 공존합니다. 두 UI가 같은 워크플로우를 다루는지, 서로 다른 데이터 축을 다루는지 UI만 봐서는 판별이 안 됩니다.

근거:
- `apps/web/src/components/admin/content/AdminPoliciesSection.tsx`
- `apps/web/src/components/admin/content/AdminWorkflowEditorAdapter.tsx:5-9,125-141`

#### 1.2.4 주차별 이미지 설정이 주차 CRUD에 매몰

주차별 콘텐츠 편집 오버레이(`AdminWeekOverlay.tsx`, 1102줄)는 텍스트, 체크리스트, 이미지를 한 화면에서 동시에 다룹니다. 이미지만 따로 관리하거나, 버킷 단위로 감사하려는 니즈(유저 요구 #7 스토리지 일원화)는 현재 IA에서 진입점이 없습니다.

근거:
- `apps/web/src/components/admin/content/AdminWeekOverlay.tsx:1-50` — `renderWeekImageField` 포함
- `apps/web/src/lib/admin/gcs-storage.ts`, `supabase-storage.ts` — 두 개의 스토리지 어댑터가 공존 (일원화 진입점 없음)

#### 1.2.5 "운영 상태"와 "모니터링"의 책임 중복

`AdminOperationsPanel.tsx`(대시보드 메트릭)와 `AdminMonitoringSection.tsx`(모니터링)는 둘 다 운영 가시성을 제공합니다. 두 섹션이 어떤 축으로 분리되는지(실시간 vs 집계, 건강 vs 사용량) 문서화되어 있지 않습니다. IA 재구성 시 함께 정리할 대상입니다.

### 1.3 워크플로우 3중 레이어 혼란

세 레이어가 동시에 존재합니다. 각 레이어의 역할과 현재 Admin UI와의 연결을 정리합니다.

#### 레이어 A — 파일 YAML

위치: `packages/mobile-api/src/workflows/`

- `maternal-nursing-router.yaml`, `maternal-nursing.yaml`
- `subworkflows/` 하위에 세부 플로우
- 로더: `load-workflow-yaml.ts`

용도: **런타임 source-of-truth**. 모바일 API가 실제로 부트 시 로드하는 실행 플로우입니다. Schift 배포 시에도 이 파일이 업로드 소스가 됩니다.

Admin UI에서의 노출: **없음**. 읽기도 쓰기도 관리 콘솔에서 직접 편집할 수 없습니다.

#### 레이어 B — Prisma `workflow_definitions` / `workflow_versions`

위치: `apps/web/prisma/schema.prisma:317-355`

- `WorkflowDefinition` — `provider`, `externalFlowId`, `status`, `config`, `metadata`
- `WorkflowVersion` — `gitPath`, `gitCommitSha`, `isPublished`
- `@@map("workflow_definitions")` / `@@map("workflow_versions")`

용도: **메타 레지스트리**. 어떤 플로우가 어디에(git/Schift) 있고 활성 상태인지 추적. `cloud-sql-admin-content-port.ts:577-730`에서 `prisma.workflow_definitions.findMany/update`로 사용합니다.

Admin UI에서의 노출: `AdminPoliciesSection.tsx`에 정렬된 목록으로 표시됩니다. `mapWorkflowRule`(`cloud-sql-admin-content-port.ts:329-359`)이 이 테이블을 `AdminWorkflowRule`로 매핑합니다. 즉, **"응답 워크플로우" 목록 UI가 읽는 테이블이 여기**입니다.

#### 레이어 C — Schift Workflow 서버

위치: 외부 Schift 서비스 (`@schift-io/sdk`)

- 내부 어댑터: `apps/web/src/lib/admin/adapters/schift-workflow.ts` — `mapSchiftWorkflowRule`, `applySchiftWorkflowInput`
- API 프록시: `/api/admin/schift/workflows/*` (`AdminWorkflowEditorAdapter.tsx:12`)
- 부트스트랩: `/api/admin/workflow-rules/bootstrap` (`AdminWorkflowEditorAdapter.tsx:70-73`)

용도: **실행 오케스트레이터**. 그래프(block/edge) 기반으로 프롬프트/모델 선택을 편집하고 실행할 수 있습니다. `AdminWorkflowEditorAdapter.tsx`가 이 서버를 타겟으로 `WorkflowBuilder` UI를 띄웁니다.

Admin UI에서의 노출: `AdminWorkflowEditorAdapter.tsx`에서 **별도 편집기 창**으로 진입. `WorkflowEditorProvider`를 통해 Schift SDK가 직접 list/get/create/update/delete를 수행합니다.

#### 레이어 간 실제 경로

`cloud-sql-admin-content-port.ts:577-660`을 읽으면 세 레이어가 엉킨 코드 경로가 보입니다.

1. `prisma.workflow_definitions.findMany` — 현재 DB row 조회 (레이어 B)
2. `schift.workflows.get(id)` — 같은 워크플로우를 Schift에서 get (레이어 C)
3. `patchSchiftWorkflow`로 Schift에 변경 적용 (레이어 C)
4. Schift 응답을 `mapSchiftWorkflowRule`로 매핑해 `workflow_definitions.update` (레이어 B 갱신)

즉, 레이어 B는 레이어 C의 **캐시/메타 인덱스** 역할이고, 실제 변경의 effective source는 레이어 C입니다. 레이어 A(YAML)는 여기에 전혀 참여하지 않습니다.

#### 혼란의 정리

- Admin UI 목록이 읽는 곳: **레이어 B (Prisma `workflow_definitions`)**
- Admin UI 목록이 쓰는 곳: **레이어 C (Schift)** → 쓴 뒤 레이어 B 갱신
- 그래프 편집기가 읽고 쓰는 곳: **레이어 C (Schift)**
- 모바일 런타임이 실행하는 곳: **레이어 A (파일 YAML)** — Schift 배포 전 경로에서만 사용

즉 Admin에서 편집한 변경은 Schift에만 반영되고, **파일 YAML은 수동 동기화**를 해야 합니다. 이 사실이 UI 어디에도 표시되지 않아 "어드민에서 고쳤는데 앱이 그대로"라는 혼란이 생길 수 있습니다.

---

## 2. 새 IA 제안

### 2.1 최상위 구조 (추천)

현재 5개 최상위에서 **6개**로 확장합니다. "콘텐츠"를 분해하여 관심사(편집 대상의 성격)별로 나눕니다.

```
대시보드            /admin/dashboard       (현 "운영 상태"의 대시보드 부분)
사용자 관리         /admin/users           (현 "계정")
콘텐츠              /admin/content         (순수 콘텐츠 CMS만 남김)
  ├─ 주차별         /admin/content/weeks
  ├─ 지식 안내문    /admin/content/notes    (현 static에서 홈카피 분리 후)
  ├─ RAG 참조 문서  /admin/content/rag      (현 documents)
  └─ 자유 검색 사전 /admin/content/lexicon  (신규, 유저 #6)
대화 엔진           /admin/engine           (신규 대분류)
  ├─ 워크플로우     /admin/engine/workflows (현 policies)
  ├─ 기분별 변주    /admin/engine/moods     (신규, 유저 #2)
  └─ 홈/프롬프트 문구 /admin/engine/copy    (현 static의 홈카피)
자산                /admin/assets           (신규 대분류, 유저 #7)
  ├─ 이미지         /admin/assets/images
  ├─ 업로드 원본    /admin/assets/uploads
  └─ 스토리지 설정  /admin/assets/settings
운영                /admin/ops              (대시보드 이외의 운영)
  ├─ 모니터링       /admin/ops/monitoring
  └─ 감사 로그      /admin/ops/audit
```

#### 묶음 근거

- **대시보드 vs 운영 분리**: `AdminOperationsPanel`은 한 페이지에 지표를 보여주는 "홈"에 가깝고, `AdminMonitoringSection`은 세부 관찰 도구입니다. 둘을 "운영 상태" 하나로 묶고 있어 모니터링이 저평가됩니다.
- **콘텐츠 = CMS만**: "글과 데이터를 편집"하는 작업만 남깁니다. 동적 응답 로직(워크플로우, 변주)은 "대화 엔진"으로 이동합니다. 편집 대상의 성질이 다르므로 최상위로 분리합니다.
- **대화 엔진 = 챗봇 행동 규칙**: 워크플로우, 기분별 변주, 홈/프롬프트 문구는 모두 "AI가 어떻게 말하는가"를 결정합니다. 이들을 한 곳에 모으면 튜닝 작업 시 문맥 전환이 줄어듭니다.
- **자산 = 바이너리 저장소**: 이미지/업로드 파일/스토리지 버킷 설정은 현재 `gcs-storage.ts` + `supabase-storage.ts` 두 어댑터가 있음에도 UI 진입점이 없습니다. 별도 섹션으로 분리해 스토리지 일원화 작업(유저 #7)을 위한 landing pad를 마련합니다.

### 2.2 각 섹션 상세

#### 대시보드 (`/admin/dashboard`)

- 현재 `AdminOperationsPanel.tsx`, `AdminMetricsBar.tsx`, `AdminTrendChart.tsx` 유지
- 담당 데이터: 집계 지표 (기존과 동일)
- 변경 없음. 단, 경로만 `operations` → `dashboard`로 재명명하여 "운영"과 책임을 분리

#### 사용자 관리 (`/admin/users`)

- 현재 `AdminAccountSection.tsx` 유지
- 담당 데이터: `users`, `pregnancy_profiles`, `user_action_logs`, `admin_audit_logs` (사용자 관련 subset)
- 라벨만 "계정" → "사용자 관리"로 (관리자 본인 계정과 혼동 제거)

#### 콘텐츠 (`/admin/content`)

순수 콘텐츠 CMS. 편집 대상은 "사람이 읽는 정적 자료".

- **주차별** (`/admin/content/weeks`): 현재 `AdminWeeksSection.tsx` + `AdminWeekOverlay.tsx` 유지. 담당 데이터: `content_pregnancy_week_data`, `content_pregnancy_day_contents`, `content_week_checklists`, `content_week_questions`.
- **지식 안내문** (`/admin/content/notes`): 현재 `AdminStaticSection.tsx`에서 **홈카피 부분을 제거**한 버전. 담당 데이터: `content_knowledge_items`만.
- **RAG 참조 문서** (`/admin/content/rag`): 현재 `AdminDocumentsSection.tsx` 유지. 담당 데이터: `content_pregnancy_documents` (임베딩 포함).
- **자유 검색 사전** (`/admin/content/lexicon`, 신규): 유저 요구 #6. 검색어 동의어/오타 매핑을 편집하는 CRUD. 초기에는 `system_config` JSON blob으로 저장 후 필요 시 별도 테이블 추출.

#### 대화 엔진 (`/admin/engine`, 신규)

- **워크플로우** (`/admin/engine/workflows`): 현재 `AdminPoliciesSection.tsx` + `AdminWorkflowEditorAdapter.tsx` 이동. 담당 데이터: `workflow_definitions` (레이어 B) + Schift (레이어 C).
- **기분별 변주** (`/admin/engine/moods`, 신규): 유저 요구 #2. 사용자 감정(`emotion_logs.label`)별 응답 톤 조정 규칙. 초기에는 `system_config` JSON 또는 `workflow_definitions.metadata.mood_variants` 필드 활용.
- **홈/프롬프트 문구** (`/admin/engine/copy`): 현재 `AdminHomeCopyPanel.tsx` 이동. 담당 데이터: `system_config` 내 `home_copy` 블록.

이동 근거: 홈 카피는 **AI 응답 템플릿과 성격이 같습니다**. 어떤 사용자 상황(신규 진입, 주차 전환)에 어떤 문구를 보여줄지 결정하는 규칙이므로 "대화 엔진" 하위가 자연스럽습니다.

#### 자산 (`/admin/assets`, 신규)

- **이미지** (`/admin/assets/images`): 주차별/안내문/문서 이미지를 버킷 단위로 조회. `content_pregnancy_week_media`, `hero_image_path`, `compare_image_path`, `knowledge_items.image_url`, `pregnancy_documents.image_url`이 가리키는 파일들을 한 화면에서 목록화.
- **업로드 원본** (`/admin/assets/uploads`): 유저 업로드(`chat_messages.image_attachments`) 감사 뷰.
- **스토리지 설정** (`/admin/assets/settings`): `gcs-storage.ts` vs `supabase-storage.ts` 중 어느 백엔드가 활성인지 + 버킷 이름 / 공개 URL prefix 표시. 유저 #7 "스토리지 일원화" 작업의 landing pad.

#### 운영 (`/admin/ops`)

- **모니터링** (`/admin/ops/monitoring`): 현재 `AdminMonitoringSection.tsx` 이동.
- **감사 로그** (`/admin/ops/audit`): 현재 `admin_audit_logs` 테이블은 있으나 UI 없음. 신규 페이지로 노출.

### 2.3 추가 요소 반영 포인트

| 유저 요구 | 번호 | 배치 위치 | 근거 |
|---|---|---|---|
| 기분별 응답 변주 | #2 | `/admin/engine/moods` | 감정 → 응답 조정은 "챗봇 행동" 영역. 워크플로우와 같은 대화 엔진 하위. |
| 자유 검색 사전 | #6 | `/admin/content/lexicon` | 검색은 사전(dictionary) 편집이 본질. "콘텐츠 CMS" 성격에 가깝고, 대화 엔진은 응답 규칙에 집중해야 하므로 콘텐츠 하위가 적합. |
| 스토리지 일원화 | #7 | `/admin/assets/settings` | 스토리지는 바이너리 저장소 관심사. 독립 섹션으로 분리해야 버킷/권한/quota 감사가 가능. |
| 이미지 설정 분리 | #2 (관련) | `/admin/assets/images` (목록) + 주차별 overlay(편집) 유지 | 주차별 컨텍스트에서 이미지를 교체하는 플로우는 유지하되, "어떤 이미지가 어디 버킷에 있는지"는 자산 섹션에서 본다. 이중 진입을 허용해야 자산 감사가 가능. |

---

## 3. 마이그레이션 절차 (단계별)

구현을 네 단계로 쪼갭니다. 각 단계는 독립적으로 배포 가능하며, 앞 단계가 롤백되어도 뒤 단계에 영향을 주지 않도록 설계합니다.

### Step 1. 네비 재배치 (shell 변경 only)

대상 파일: `apps/web/src/components/admin/AdminConsoleShell.tsx` 만 수정.

- `NAV_ITEMS`를 2.1의 6개 최상위 구조로 교체
- 하위 라우트는 신규 경로로 선언하되 실제 page는 아직 만들지 않고, 기존 경로로 redirect
- 기존 `/admin/content/documents` 등은 그대로 살려둠 (북마크 보호)

**완료 판정**: 사이드바에 6개 최상위가 표시되고, 각 하위를 클릭했을 때 현재와 동일한 화면으로 이동(redirect)

**리스크**: 낮음. UI만 변경. 기존 라우트 유효.

### Step 2. 기존 컴포넌트 재분류 (이동만, 기능 변경 없음)

디렉토리 재구성:

```
apps/web/src/components/admin/
├── dashboard/      (AdminOperationsPanel, AdminMetricsBar, AdminTrendChart)
├── users/          (AdminAccountSection)
├── content/        (AdminDocumentsSection, AdminStaticSection, AdminWeeksSection, AdminWeekOverlay, WeekImagePreview)
├── engine/         (AdminPoliciesSection, AdminWorkflowEditorAdapter, AdminHomeCopyPanel)
├── assets/         (신규, 아직 비어있음)
└── ops/            (AdminMonitoringSection)
```

라우트 재구성: `apps/web/app/admin/` 하위 폴더 신설 + 기존 파일 이동. 이동 시 구 라우트는 **영구 redirect 유지**:

| 구 경로 | 신 경로 | redirect 파일 |
|---|---|---|
| `/admin/operations` | `/admin/dashboard` | `app/admin/operations/page.tsx` |
| `/admin/accounts` | `/admin/users` | `app/admin/accounts/page.tsx` |
| `/admin/content/documents` | `/admin/content/rag` | `app/admin/content/documents/page.tsx` |
| `/admin/content/static` | `/admin/content/notes` | `app/admin/content/static/page.tsx` |
| `/admin/content/policies` | `/admin/engine/workflows` | `app/admin/content/policies/page.tsx` |
| `/admin/monitoring` | `/admin/ops/monitoring` | `app/admin/monitoring/page.tsx` |

홈 카피 분리:
- `AdminStaticSection.tsx:17`의 `AdminHomeCopyPanel` import 제거
- 신규 `/admin/engine/copy/page.tsx`에서 `AdminHomeCopyPanel`만 렌더
- `AdminStaticSection.tsx`는 `knowledgeItems` 관련 상태/props만 남김

**완료 판정**: 모든 구 URL 접근 시 신 URL로 redirect되고, 각 섹션의 기능이 기존과 동일하게 동작.

**리스크**: 중간. props drilling 경로가 바뀌므로 `useAdminContentState.ts`, `useAdminDashboardState.ts`의 상태 분배도 부분 재조정 필요.

### Step 3. 3중 워크플로우 정리 (어느 레이어를 버릴지 결정)

**결정 필요 (4장 참조)**: 파일 YAML과 Schift 중 어느 쪽을 영구 source-of-truth로 둘 것인가.

시나리오 A — **Schift가 source-of-truth**:
- 파일 YAML은 초기 부트스트랩/DR(재해 복구) 스냅샷 용도로 축소
- `workflow_definitions` 테이블은 캐시 역할 유지 (현재와 동일)
- Admin UI에서 "현재 활성 = Schift 최신" 표시 추가
- 배포 파이프라인에서 Schift → YAML export 단계 추가 (감사/백업용)

시나리오 B — **파일 YAML이 source-of-truth**:
- Admin Workflow 편집기(`AdminWorkflowEditorAdapter.tsx`) 기능 축소 또는 제거
- 편집은 PR 기반으로 YAML 파일 수정 → CI가 Schift 배포
- Admin UI는 read-only 목록 뷰로 전환
- 기분별 변주 등 신규 기능도 YAML 스키마 확장으로 구현

**권장**: **시나리오 A**. 이유:
1. `WorkflowBuilder` 그래프 편집 UI가 이미 통합되어 있어 운영자 경험이 GUI 편집에 최적화됨
2. 유저 요구 #2 "기분별 변주"는 런타임 metadata로 붙여야 하며, Schift의 `metadata` 필드에 즉시 확장 가능
3. YAML PR 워크플로우는 비기술 운영자에게 장벽이 높음

결정 후:
- `workflow_definitions`에 `source_of_truth = "schift"` flag 추가 (`apps/web/prisma/schema.prisma:317-336`)
- `packages/mobile-api/src/workflows/*.yaml` 상단에 주석으로 "read-only snapshot" 명시
- Admin UI(`AdminPoliciesSection`)에 "Schift가 source-of-truth" 안내 배너 추가

**리스크**: 높음. 결정이 늦어지면 세 레이어 어긋남이 계속 누적. 결정 후 구현은 비교적 단순.

### Step 4. 신규 섹션 추가 (변주 / 사전 / 자산)

각 기능은 서로 독립이므로 병렬로 진행 가능합니다.

**4.1 기분별 응답 변주 (`/admin/engine/moods`)**
- 데이터: `workflow_definitions.metadata.mood_variants: { [mood: string]: { prompt_suffix: string; tone: string } }`
- UI: 감정 목록(한글 라벨 "평온", "불안", "지침" 등) + 각 감정별 프롬프트 suffix 편집
- 저장은 Step 3에서 결정된 source-of-truth에 따름

**4.2 자유 검색 사전 (`/admin/content/lexicon`)**
- 데이터: `system_config.key = "search_lexicon"` JSON blob (초기). 규모 커지면 별도 테이블 마이그레이션.
- 스키마: `{ synonyms: [{ term, aliases: [] }], misspellings: [{ wrong, right }] }`
- UI: CRUD 테이블 + CSV export/import

**4.3 자산 섹션 (`/admin/assets/*`)**
- 이미지 목록: `content_pregnancy_week_media` + `knowledge_items.image_url` + `pregnancy_documents.image_url`을 UNION 조회해 버킷별로 집계
- 스토리지 설정: `gcs-storage.ts`, `supabase-storage.ts` 중 `process.env.STORAGE_PROVIDER` 값을 표시 (read-only 우선)
- 업로드 원본: `chat_messages.image_attachments` JSONB를 flatten하여 최근 N건 표시

**리스크**: 중간. 신규 API 엔드포인트 필요(`/api/admin/engine/moods`, `/api/admin/content/lexicon`, `/api/admin/assets/*`). 인증 패턴은 `readAdminSessionUser() + null 체크 → 401` 기존 규칙을 그대로 따른다 (CLAUDE.md 인증 패턴 규칙).

---

## 4. 열린 질문 (결정 필요)

구현 착수 전 유저 확인 필요 항목입니다.

### 4.1 `workflow_definitions` 테이블은 유지되는가

현재 이 테이블은 Schift의 캐시/인덱스로만 기능합니다. 유지해야 할 이유는 "admin audit log의 `entityType = "workflow_rule"` 참조 유지" 정도입니다. 완전 제거 시 `cloud-sql-admin-content-port.ts:577-730`의 쿼리 로직 전면 재작성이 필요합니다. **유지 권장**하지만 유저 판단 필요.

### 4.2 파일 YAML vs Schift, 영구 source-of-truth

3장 Step 3에서 상세. **시나리오 A (Schift)** 권장.

### 4.3 자유 검색 사전의 소속 (콘텐츠 vs 대화 엔진)

본 문서는 **콘텐츠 하위**를 권장합니다. 이유는 사전 편집은 "사람이 관리하는 데이터 CRUD"에 가깝고, 대화 엔진은 "응답 규칙"에 집중해야 하기 때문입니다. 다만 검색 결과가 AI 응답 품질에 직접 영향을 주므로 **대화 엔진 하위**로 두자는 반론도 성립합니다. 유저 선호 확인 필요.

### 4.4 홈 카피를 "대화 엔진" 하위로 옮기는 것의 합의

현재 `AdminStaticSection.tsx` 안에 섞여 있는 홈 카피 패널을 분리하는 안입니다. 분리 시 운영자가 "문구 수정"을 위해 방문하는 화면이 하나 더 늘어나는 단점이 있습니다. 대안으로 **콘텐츠 하위에 "문구/카피" 탭을 신설**하는 안도 있습니다. 유저 판단 필요.

### 4.5 스토리지 설정 UI의 권한 범위

read-only로 시작할지, 버킷 변경까지 허용할지 결정 필요. 버킷 변경은 배포 환경 변수(`STORAGE_PROVIDER`, `SUPABASE_STORAGE_BUCKET` 등)와 연결되므로 **read-only 권장**.

### 4.6 `/admin/operations` → `/admin/dashboard` 리네이밍 필요성

"운영 상태"라는 기존 라벨을 유지하며 경로만 `/admin/dashboard`로 바꿀지, 라벨도 "대시보드"로 바꿀지 확인 필요. UX 일관성 관점에서 라벨도 "대시보드"로 통일 권장.

---

## 5. 리스크 / 회귀 방지

### 5.1 북마크/외부 링크 깨짐 방지

기존 URL은 **Step 2에서 정의한 redirect 목록대로 영구 보존**합니다. Next.js App Router의 `redirect()` (현재 `apps/web/app/admin/content/page.tsx:4`에서 이미 사용 중인 패턴)를 각 구 경로 page.tsx에서 사용합니다.

감시: 최소 한 release cycle 동안은 redirect 유지. 이후 제거 시 공지.

### 5.2 권한/인증 흐름 유지

CLAUDE.md 인증 패턴 규칙:
- 모든 admin write 엔드포인트에 인증 체크 필수
- 인증 없는 admin 엔드포인트 생성 금지

신규 엔드포인트(`/api/admin/engine/moods`, `/api/admin/content/lexicon`, `/api/admin/assets/*`)는 반드시 `readAdminSessionUser() + null 체크 → 401` 패턴을 적용합니다. 기존 어댑터 경로(`apps/web/src/lib/admin/adapters/`, `apps/web/src/lib/admin/auth.ts`)를 그대로 재사용해 신규 우회 경로가 생기지 않도록 합니다.

### 5.3 `useAdminContentState` 훅의 상태 분할 회귀

`apps/web/src/components/admin/useAdminContentState.ts`는 현재 네 섹션(`documents/static/weeks/policies`)의 상태를 한 훅에서 관리합니다. Step 2에서 컴포넌트를 재분류하면 이 훅도 **섹션별로 쪼개거나, 경로별 Provider로 분할**해야 합니다. 단순 이동만 하고 훅을 방치하면 unused dispatch warning이 남거나 `AdminContentPage.tsx`에서 props drilling이 복잡해집니다.

대응: Step 2 완료 후 별도 PR로 훅 분할. 기능 변경 없이 ref-only refactor.

### 5.4 `AdminContentSection.tsx`(431줄) 썬 래퍼의 운명

`admin-content-section-split-plan.md`가 2026-03-26에 이 파일을 100줄 thin wrapper로 축소하는 계획을 세웠고, 현재 431줄로 부분 진행된 상태입니다. Step 2에서 경로가 쪼개지면 이 wrapper의 `view` 분기 자체가 불필요해집니다. **Step 2에서 병합 제거 권장**.

### 5.5 신규 메뉴의 빈 섹션 문제

"자산", "대화 엔진 / 기분별 변주" 등은 Step 4가 완료되기 전까지 빈 페이지입니다. 빈 페이지에 placeholder(`"준비 중입니다"`)를 놓으면 운영자 혼란이 발생할 수 있습니다.

대응 옵션:
- A안: 신규 메뉴는 Step 4에서 실제 기능과 함께 동시 추가 (Step 1/2 때 사이드바에 표시하지 않음)
- B안: Step 1에서 사이드바에 회색 처리 + "준비 중" 배지로 표기

**A안 권장**. IA 재구성의 visible scope가 Step 4까지 끝난 뒤에야 완성되지만, 그 전까지는 기존 UX에서 체감되는 변화를 최소화.

### 5.6 Schift 장애 시 Admin UI 비활성화 문제

현재 Schift가 다운되면 `/admin/content/policies`의 list/get이 실패합니다 (`AdminWorkflowEditorAdapter.tsx:50-80`의 404 폴백은 있지만 Schift 자체 장애는 미대응). 신규 IA에서도 "대화 엔진" 섹션 전체가 마비됩니다.

대응: `workflow_definitions` 테이블의 캐시 row를 fallback으로 표시하고 "Schift 연결 실패 - 읽기 전용 모드" 배너 노출. Step 3 결정 후 구현.

### 5.7 테스트 커버리지

이미 존재하는 테스트:
- `apps/web/src/components/admin/content/AdminPoliciesSection.test.tsx`
- `apps/web/src/components/admin/AdminOperationsPanel.test.tsx`
- `apps/web/src/lib/admin/adapters/cloud-sql-admin-content-port.test.ts`
- `apps/web/src/lib/admin/adapters/supabase-admin-dashboard-port.test.ts`
- `apps/web/app/api/admin/content/home-copy/route.test.ts`

Step 2 이동 시 import 경로만 변경되므로 기존 테스트가 **같은 수준의 커버리지를 유지**해야 합니다. 테스트 파일 누락 없이 이동하는지 체크리스트로 검증.

### 5.8 i18n / 라벨 톤

CLAUDE.md 문구 톤 규칙: 어드민 대상은 "-습니다" 체 허용. 개발자 용어 금지. 영문 eyebrow 금지.

신규 라벨 후보:
- "대시보드" (O) / "Dashboard" (X)
- "대화 엔진" (O) / "Engine" (X)
- "기분별 변주" (O, "mood" 금지)
- "자유 검색 사전" (O, "lexicon" 금지)
- "자산" (O) / "Assets" (X)

---

## 6. 다음 액션

1. 본 문서 유저 승인 (특히 4장 열린 질문 6개)
2. 승인 후 Step 1 PR 생성 (네비 재배치만, 라우트 유지)
3. Step 2 PR (컴포넌트 이동 + redirect)
4. Step 3 결정 및 반영 (source-of-truth 합의)
5. Step 4 신규 섹션 3종 병렬 구현

구현은 본 문서 승인 전까지 착수하지 않습니다.

---

## 부록 A — 근거 파일 인덱스

| 주제 | 경로 | 라인 |
|---|---|---|
| 사이드바 | `apps/web/src/components/admin/AdminConsoleShell.tsx` | 13-27 |
| 콘텐츠 재분류 완료분 | `docs/active/admin-content-section-split-plan.md` | 전체 |
| 홈 카피 합성 지점 | `apps/web/src/components/admin/content/AdminStaticSection.tsx` | 7-17 |
| 홈 카피 저장소 | `apps/web/src/lib/admin/home-copy-config.ts` | 21-33 |
| 워크플로우 DB 모델 | `apps/web/prisma/schema.prisma` | 317-355 |
| 워크플로우 Schift 어댑터 | `apps/web/src/lib/admin/adapters/schift-workflow.ts` | 1-101 |
| 워크플로우 3중 경로 | `apps/web/src/lib/admin/adapters/cloud-sql-admin-content-port.ts` | 577-730 |
| 워크플로우 편집기 | `apps/web/src/components/admin/content/AdminWorkflowEditorAdapter.tsx` | 125-141 |
| 파일 YAML | `packages/mobile-api/src/workflows/` | 전체 |
| 주차 overlay | `apps/web/src/components/admin/content/AdminWeekOverlay.tsx` | 1-50 |
| RAG 매핑 | `apps/web/src/lib/admin/adapters/cloud-sql-admin-content-port.ts` | 309-327 |
| 콘텐츠 마이그레이션 | `supabase/migrations/20260331172420_move_content_to_public_and_drop_allowlist.sql` | 전체 |
| 스토리지 어댑터 | `apps/web/src/lib/admin/gcs-storage.ts`, `supabase-storage.ts` | 전체 |
| 라우트 리다이렉트 선례 | `apps/web/app/admin/content/page.tsx` | 1-5 |

## 부록 B — Task 상태

TaskList #4 "ADMIN 쪽에서 시각화(hierarchy)가 안맞는 것 재구성 계획 수립" — **완료** (본 문서로 산출).
