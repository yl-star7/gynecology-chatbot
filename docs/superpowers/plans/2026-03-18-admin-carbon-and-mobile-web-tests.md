# Admin Carbon And Mobile Web Tests Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자 화면을 IBM Carbon 라이트 운영 콘솔로 바꾸고, 웹에서 모바일 뷰 구조를 검증하는 테스트를 추가한다.

**Architecture:** 관리자 화면은 상태 훅과 섹션 컴포넌트로 분리해 Carbon 레이아웃 모듈 CSS를 적용한다. 모바일 웹 검증은 route composition 테스트와 `MobileShell` 구조 테스트로 최소 신뢰도를 확보한다.

**Tech Stack:** Next.js App Router, React 19, Jest, Testing Library, CSS Modules

---

## Chunk 1: Admin Carbon Refactor

### Task 1: 관리자 렌더 기대값을 테스트로 고정

**Files:**
- Modify: `apps/web/src/components/AdminDashboard.test.tsx`
- Modify: `apps/web/src/components/AdminLoginView.test.tsx`

- [x] **Step 1: Carbon 구조 기대 테스트 작성**
- [x] **Step 2: 테스트 실행으로 실패 확인**
- [x] **Step 3: 관리자 콘솔/로그인 구조 구현**
- [x] **Step 4: 테스트 재실행으로 통과 확인**

### Task 2: 관리자 화면을 상태 훅과 섹션 컴포넌트로 분리

**Files:**
- Create: `apps/web/src/components/admin/AdminConsoleLayout.module.css`
- Create: `apps/web/src/components/admin/useAdminDashboardState.ts`
- Create: `apps/web/src/components/admin/AdminConsoleShell.tsx`
- Create: `apps/web/src/components/admin/AdminMetricsBar.tsx`
- Create: `apps/web/src/components/admin/AdminAccountSection.tsx`
- Create: `apps/web/src/components/admin/AdminContentSection.tsx`
- Create: `apps/web/src/components/admin/AdminMonitoringSection.tsx`
- Modify: `apps/web/src/components/AdminDashboard.tsx`
- Modify: `apps/web/src/components/AdminLoginView.tsx`

- [x] **Step 1: 상태와 프레젠테이션 분리**
- [x] **Step 2: Carbon 레이아웃 및 토큰 적용**
- [x] **Step 3: 관리자 엔트리 컴포넌트 연결**

### Task 3: 관리자 액션 라벨을 운영자 언어로 교체

**Files:**
- Modify: `apps/web/src/lib/admin/adapters/supabase-admin-dashboard-port.ts`
- Modify: `apps/web/src/lib/admin/adapters/supabase-admin-dashboard-port.test.ts`
- Modify: `apps/web/src/components/admin/admin-dashboard-labels.ts`

- [x] **Step 1: 라벨 매핑 테스트 추가**
- [x] **Step 2: `signup` 의미 제거 구현**
- [x] **Step 3: 테스트 재확인**

## Chunk 2: Mobile Web Structure Tests

### Task 4: 웹 라우트에서 모바일 뷰 구성을 테스트

**Files:**
- Create: `apps/web/src/app/page.test.tsx`
- Create: `apps/web/src/app/onboarding/page.test.tsx`

- [x] **Step 1: route composition 테스트 작성**
- [x] **Step 2: 현재 라우트 구조 검증**

### Task 5: 모바일 웹 쉘 구조를 테스트 가능하게 보강

**Files:**
- Create: `apps/web/src/components/mobile/MobileShell.test.tsx`
- Modify: `apps/web/src/components/mobile/MobileShell.tsx`

- [x] **Step 1: 탐색 구조 테스트 작성**
- [x] **Step 2: 접근성 라벨 추가로 테스트 가능성 확보**
- [x] **Step 3: 테스트 재실행으로 통과 확인**

## Chunk 3: Verification

### Task 6: 변경 범위 검증

**Files:**
- Modify: `apps/web/src/app/globals.css`

- [x] **Step 1: 관리자/모바일 관련 Jest 테스트 실행**
  Run: `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/pnpm --filter @gynecology-chatbot/web exec jest --runInBand src/components/AdminDashboard.test.tsx src/components/AdminLoginView.test.tsx src/components/mobile/MobileShell.test.tsx src/app/page.test.tsx src/app/onboarding/page.test.tsx src/lib/admin/adapters/supabase-admin-dashboard-port.test.ts`
  Expected: PASS

- [x] **Step 2: 타입체크 실행**
  Run: `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/pnpm --filter @gynecology-chatbot/web type-check`
  Expected: PASS
