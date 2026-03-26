# AdminContentSection.tsx 분리 계획

작성일: 2026-03-26
대상 파일: `apps/web/src/components/admin/AdminContentSection.tsx` (2110줄)

---

## 현재 구조 분석

### 파일 개요

`AdminContentSection.tsx`는 `view` prop(`"all" | "documents" | "static" | "weeks" | "policies"`)에 따라 4개의 완전히 다른 UI 섹션을 하나의 컴포넌트 안에서 분기 렌더링하는 GOD FILE이다.

### 내부 구성요소

| 위치 (줄 번호) | 구성요소 | 역할 |
|---|---|---|
| 26–44 | `WeekImagePreview` | 이미지 미리보기 (에러 처리 포함) |
| 46–159 | `AdminContentSectionProps` interface | 전체 props 타입 (46개 props) |
| 161–243 | `AdminContentSection` 함수 시작 | props destructuring |
| 244–406 | 파생 상태 계산 | filter, 가공 로직 |
| 407–603 | `view === "documents"` 분기 | 지식 문서 뷰 + overlay |
| 606–824 | `view === "static"` 분기 | 간호 안내문 뷰 + overlay |
| 826–1027 | `view === "policies"` 분기 | 응답 워크플로우 뷰 + overlay |
| 1029–1241 | `view === "weeks"` 분기 | 주차별 뷰 (좌측 rail + 우측 메인) |
| 1243–2059 | `renderWeekOverlay()` 내부 함수 | 주차 편집 wide overlay (Day/섹션/질문/이미지 CRUD) |
| 2061–2108 | `renderWeekImageField()` 내부 함수 | 이미지 업로드 필드 컴포넌트 |

---

## 분리 계획

### 디렉토리 구조

```
apps/web/src/components/admin/
├── AdminContentSection.tsx          (기존, 교통정리 역할로 축소)
├── content/
│   ├── AdminDocumentsSection.tsx    (지식 문서 뷰)
│   ├── AdminStaticSection.tsx       (간호 안내문 뷰)
│   ├── AdminPoliciesSection.tsx     (응답 워크플로우 뷰)
│   ├── AdminWeeksSection.tsx        (주차별 뷰 - 목록 + 개요)
│   ├── AdminWeekOverlay.tsx         (주차 편집 wide overlay)
│   ├── WeekImagePreview.tsx         (이미지 미리보기 공유 컴포넌트)
│   └── types.ts                     (공유 타입 정의)
```

---

## 파일별 상세 계획

### 1. `content/types.ts`

**역할**: 분리된 섹션 컴포넌트들이 공유하는 타입을 한 곳에 모음

**포함 내용**:
- `AdminContentSectionProps` interface 전체 (현재 46–159줄)
- 각 섹션 컴포넌트용 세부 Props 타입 정의:
  - `AdminDocumentsSectionProps` (ragDocuments 관련 props만)
  - `AdminStaticSectionProps` (knowledgeItems 관련 props만)
  - `AdminPoliciesSectionProps` (workflowRules 관련 props만)
  - `AdminWeeksSectionProps` (weekSummaries, weekDetail 관련 props만)

**의존성**: `@gynecology-chatbot/app-core` 타입들

---

### 2. `content/WeekImagePreview.tsx`

**역할**: 이미지 src를 받아 렌더링, 에러 시 플레이스홀더 표시

**포함 내용**: 현재 26–44줄 `WeekImagePreview` 컴포넌트 그대로

**Props**:
```typescript
{ src: string | null; alt: string }
```

**의존성**: `AdminConsoleLayout.module.css` (styles.imagePlaceholder, styles.imagePreview)

---

### 3. `content/AdminDocumentsSection.tsx`

**역할**: 지식 문서(RAG) 목록 테이블 + 문서 편집 오버레이 패널

**포함 내용**: 현재 407–603줄 (`view === "documents"` 분기 전체)

**내부 상태**:
- `activeOverlay: boolean` (문서 편집 패널 열림 여부, `activeContentOverlay === "document"` 대체)
- `documentQuery: string`
- `documentStatusFilter: string`

**Props** (`AdminDocumentsSectionProps`):
- `ragDocuments`, `selectedRagDocumentId`, `contentMessage`
- `ragTitle`, `ragCategory`, `ragWeek`, `ragContent`
- `isRagSubmitting`
- `onSelectRagDocument`, `onResetRagDocument`, `onRagTitleChange`, `onRagCategoryChange`, `onRagWeekChange`, `onRagContentChange`, `onUploadRagDocument`, `onDeleteRagDocument`

**의존성**:
- `admin-dashboard-labels` (getDocumentStatusBadge, getDocumentStatusLabel)
- `AdminConsoleLayout.module.css`
- `content/types.ts`

---

### 4. `content/AdminStaticSection.tsx`

**역할**: 주차별 간호 안내문(KnowledgeItem) 목록 테이블 + 안내문 편집 오버레이 패널

**포함 내용**: 현재 606–824줄 (`view === "static"` 분기 전체)

**내부 상태**:
- `activeOverlay: boolean`
- `knowledgeQuery: string`
- `knowledgeStatusFilter: string`

**Props** (`AdminStaticSectionProps`):
- `knowledgeItems`, `selectedKnowledgeItemId`, `contentMessage`
- `knowledgeSlug`, `knowledgeSection`, `knowledgeTitle`, `knowledgeBody`, `knowledgeStatus`
- `isKnowledgeSaving`
- `onSelectKnowledgeItem`, `onKnowledgeSlugChange`, `onKnowledgeSectionChange`, `onKnowledgeTitleChange`, `onKnowledgeBodyChange`, `onKnowledgeStatusChange`
- `onCreateKnowledgeItem`, `onUpdateKnowledgeItem`, `onDeleteKnowledgeItem`, `onResetKnowledgeItem`

**의존성**:
- `admin-dashboard-labels` (getWeekStatusBadge, getWeekStatusLabel)
- `AdminConsoleLayout.module.css`
- `content/types.ts`

---

### 5. `content/AdminPoliciesSection.tsx`

**역할**: 응답 워크플로우 목록 테이블 + 워크플로우 편집 오버레이 패널

**포함 내용**: 현재 826–1027줄 (`view === "policies"` 분기 전체)

**내부 상태**:
- `activeOverlay: boolean`
- `workflowQuery: string`
- `workflowStatusFilter: string`

**Props** (`AdminPoliciesSectionProps`):
- `workflowRules`, `selectedWorkflowRuleId`, `contentMessage`
- `workflowName`, `workflowTrigger`, `workflowRetrievalScope`, `workflowModelName`, `workflowStatus`
- `isWorkflowSaving`, `isWorkflowBootstrapping`
- `onSelectWorkflowRule`, `onWorkflowNameChange`, `onWorkflowTriggerChange`, `onWorkflowRetrievalScopeChange`, `onWorkflowModelNameChange`, `onWorkflowStatusChange`
- `onSaveWorkflowRule`, `onBootstrapWorkflowRule`

**의존성**:
- `admin-dashboard-labels` (getWorkflowStatusBadge, getWorkflowStatusLabel)
- `AdminConsoleLayout.module.css`
- `content/types.ts`

---

### 6. `content/AdminWeekOverlay.tsx`

**역할**: 주차 편집 wide overlay (Day별 본문, 체크리스트, 질문, 이미지 매핑 CRUD 전체)

**포함 내용**: 현재 1243–2059줄 `renderWeekOverlay()` 함수 + 2061–2108줄 `renderWeekImageField()` 함수

**내부 상태**: 없음 (완전히 controlled 컴포넌트)

**Props** (`AdminWeekOverlaySectionProps`):
- `isOpen: boolean`
- `onClose: () => void`
- `selectedWeekDetail`, `contentMessage`
- `isWeekSaving`, `isLoadingWeeks`
- `uploadingCoverField`, `uploadingMediaIndex`
- `selectedWeekReferenceMedia` (현재 399–405줄에서 파생되는 값, 외부에서 계산해서 전달)
- `publicStorageBaseUrl: string | null` (또는 resolveImagePreviewSrc 함수를 외부에서 전달)
- `onWeekFieldChange`, `onWeekStatusChange`, `onUploadWeekCoverImage`
- `onWeekDayChange`, `onWeekSectionChange`, `onWeekAssetChange`, `onWeekMediaChange`
- `onUploadWeekMedia`
- `onAddWeekDay`, `onAddWeekSection`, `onAddWeekAsset`, `onAddWeekMedia`
- `onMoveWeekDay`, `onMoveWeekSection`, `onMoveWeekAsset`, `onMoveWeekMedia`
- `onRemoveWeekDay`, `onRemoveWeekSection`, `onRemoveWeekAsset`, `onRemoveWeekMedia`
- `onSaveWeek`

**의존성**:
- `content/WeekImagePreview.tsx`
- `AdminConsoleLayout.module.css`

---

### 7. `content/AdminWeeksSection.tsx`

**역할**: 주차별 콘텐츠 뷰 (좌측 rail: 주차 목록 + 우측: 주차 개요 + Day 검수 보드 + 편집 overlay 포함)

**포함 내용**: 현재 1029–1241줄 (`view === "weeks"` 분기 전체) + overlay 제어 상태

**내부 상태**:
- `isOverlayOpen: boolean`
- `weekQuery: string`
- `weekStatusFilter: string`

**파생 계산** (현재 AdminContentSection 내부에서 계산, 이 컴포넌트로 이동):
- `filteredWeekSummaries` (342–352줄)
- `selectedWeekOverview` (354–361줄)
- `selectedWeekDayRows` (363–397줄)
- `selectedWeekReferenceMedia` (399–405줄)

**Props** (`AdminWeeksSectionProps`):
- `weekSummaries`, `selectedWeekNumber`, `selectedWeekDetail`
- `isLoadingWeeks`, `isWeekSaving`
- `contentMessage`
- `uploadingCoverField`, `uploadingMediaIndex`
- `onSelectWeek`
- `onWeekFieldChange`, `onWeekStatusChange`, `onUploadWeekCoverImage`
- `onWeekDayChange`, `onWeekSectionChange`, `onWeekAssetChange`, `onWeekMediaChange`
- `onUploadWeekMedia`
- `onAddWeekDay`, `onAddWeekSection`, `onAddWeekAsset`, `onAddWeekMedia`
- `onMoveWeekDay`, `onMoveWeekSection`, `onMoveWeekAsset`, `onMoveWeekMedia`
- `onRemoveWeekDay`, `onRemoveWeekSection`, `onRemoveWeekAsset`, `onRemoveWeekMedia`
- `onSaveWeek`

**의존성**:
- `admin-dashboard-labels` (getWeekStatusBadge, getWeekStatusLabel)
- `AdminConsoleLayout.module.css`
- `content/AdminWeekOverlay.tsx`

---

### 8. `AdminContentSection.tsx` (축소된 버전)

**역할**: `view` prop에 따라 올바른 섹션 컴포넌트로 라우팅하는 thin wrapper

**예상 줄 수**: ~100줄 (현재 2110줄에서 95% 감소)

**포함 내용**:
- `AdminContentSectionProps` 재export (또는 `content/types.ts`에서 import)
- `view` 분기 로직만 남김
- 각 섹션 컴포넌트로 props forwarding

**핵심 변경**:
- 내부 상태 (`activeContentOverlay`, filter 상태들) 각 섹션 컴포넌트로 이동
- 파생 계산 로직 각 섹션 컴포넌트로 이동
- `resolveImagePreviewSrc`, `renderWeekOverlay`, `renderWeekImageField` 제거

---

## 의존성 다이어그램

```
AdminContentSection.tsx
  ├── AdminDocumentsSection.tsx
  │     └── admin-dashboard-labels
  ├── AdminStaticSection.tsx
  │     └── admin-dashboard-labels
  ├── AdminPoliciesSection.tsx
  │     └── admin-dashboard-labels
  └── AdminWeeksSection.tsx
        ├── AdminWeekOverlay.tsx
        │     └── WeekImagePreview.tsx
        └── admin-dashboard-labels

공통 의존:
  - AdminConsoleLayout.module.css (모든 파일)
  - @gynecology-chatbot/app-core 타입 (types.ts 통해)
```

---

## 상위 사용처 영향

`AdminContentSection`을 사용하는 파일:
- `apps/web/src/components/AdminContentPage.tsx` - props 인터페이스가 유지되므로 **수정 불필요**
- `apps/web/src/components/AdminDashboard.tsx` - 동일

분리 후 `AdminContentSection`의 props 인터페이스(`AdminContentSectionProps`)는 유지되기 때문에 상위 컴포넌트 수정은 불필요하다.

---

## 작업 순서 (권장)

1. `content/` 디렉토리 생성
2. `content/WeekImagePreview.tsx` 추출 (가장 단순, 의존성 없음)
3. `content/AdminDocumentsSection.tsx` 추출
4. `content/AdminStaticSection.tsx` 추출
5. `content/AdminPoliciesSection.tsx` 추출
6. `content/AdminWeekOverlay.tsx` 추출 (renderWeekOverlay + renderWeekImageField)
7. `content/AdminWeeksSection.tsx` 추출 (AdminWeekOverlay 의존)
8. `AdminContentSection.tsx` thin wrapper로 교체
9. 타입 체크 + 테스트 실행

---

## 주의사항

### `resolveImagePreviewSrc` 함수 처리
현재 `AdminContentSection` 함수 내부에 정의되어 있고 `publicStorageBaseUrl`에 의존한다. 분리 시 두 가지 선택지:
- **옵션 A**: `content/AdminWeekOverlay.tsx` 내부로 이동 (해당 컴포넌트에서만 사용)
- **옵션 B**: `content/WeekImagePreview.tsx`에 static 함수로 추출

현재 `renderWeekImageField` 안에서만 사용되므로 **옵션 A 권장**.

### 이미지 카운트 계산
`readyDocuments`, `draftDocuments` (244–249줄)는 현재 `view === "all"` 분기(존재하지 않음)를 위한 계산으로 보이며, 실제로 렌더링에서 사용되지 않는다. 분리 시 제거 또는 `AdminDocumentsSection` 내부로 이동.

### 오버레이 상태 분산
현재 `activeContentOverlay` 하나의 상태로 모든 섹션의 overlay를 관리하지만, 각 섹션을 분리하면 각 섹션에서 독립적인 boolean 상태로 관리하게 된다. 이는 더 단순하고 명확한 구조다.
