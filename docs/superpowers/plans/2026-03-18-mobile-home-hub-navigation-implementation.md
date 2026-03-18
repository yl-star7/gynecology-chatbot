# Mobile Home Hub Navigation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved `home hub + chat FAB + avatar profile` navigation model across the mobile web shell and the Expo mobile app without reintroducing visible tab bars.

**Architecture:** Implement the web shell first because `apps/web` already has focused Jest coverage around `MobileShell`, `MobileHomeView`, and related surfaces. Once the web contract is stable, realign Expo Router to remove the visible tab bar, add a dedicated profile route, and introduce a minimal profile port so native can render account/settings data instead of a placeholder.

**Tech Stack:** Next.js 15, React 19, Jest + Testing Library, Expo Router 4, React Native 0.76, TypeScript, shared `packages/app-core` ports, existing mobile profile API routes in `apps/web`

---

## File Structure

### Web shell and screen chrome

- Modify: `apps/web/src/components/mobile/MobileShell.tsx`
  Responsibility: strip the shell down to header chrome plus optional avatar and optional chat FAB; remove shell-owned logout/theme/nav chips.
- Modify: `apps/web/src/components/mobile/MobileShell.test.tsx`
  Responsibility: lock the new shell contract before editing implementation.

### Web screens adopting the new contract

- Modify: `apps/web/src/components/mobile/MobileHomeView.tsx`
  Responsibility: make home the sole hub, remove duplicate chat CTA, and rely on shell-provided avatar/FAB.
- Modify: `apps/web/src/components/mobile/MobileHomeView.test.tsx`
  Responsibility: verify home stays compact, avatar remains the only profile entry, and chat is no longer duplicated inline.
- Modify: `apps/web/src/components/mobile/MobileProfileView.tsx`
  Responsibility: own logout/settings inside the profile body instead of the shell.
- Modify: `apps/web/src/components/mobile/MobileProfileView.test.tsx`
  Responsibility: verify logout/settings live in profile and shell no longer repeats profile navigation.
- Modify: `apps/web/src/components/mobile/MobileContentView.tsx`
- Modify: `apps/web/src/components/mobile/MobileLinkView.tsx`
- Modify: `apps/web/src/components/mobile/MobileRecordDayView.tsx`
  Responsibility: remove duplicate “go to chat” inline buttons where the shell FAB becomes the primary new-chat affordance.
- Modify: `apps/web/src/components/mobile/MobileContentView.test.tsx`
- Modify: `apps/web/src/components/mobile/MobileLinkView.test.tsx`
- Modify: `apps/web/src/components/mobile/MobileRecordDayView.test.tsx`
  Responsibility: keep supporting screens aligned with the shell changes.

### Native profile/data/navigation foundation

- Modify: `packages/app-core/src/ports.ts`
  Responsibility: add a mobile profile port contract shared by web and native.
- Modify: `apps/mobile/src/api/mobileApi.ts`
  Responsibility: add native client methods for mobile profile fetch/update using the existing web API routes.
- Modify: `apps/mobile/src/core/adapters/apiMobilePorts.ts`
  Responsibility: implement the new profile port for API-backed native sessions.
- Modify: `apps/mobile/src/core/adapters/mockMobileAuthPorts.ts`
- Modify: `apps/mobile/src/core/mockMobileRuntime.ts`
- Modify: `apps/mobile/src/core/createMobileServices.ts`
  Responsibility: provide a mock profile implementation and wire profile services into the mobile dependency graph.
- Modify: `apps/mobile/src/core/MobileAppSessionProvider.tsx`
  Responsibility: expose a native sign-out action the new profile screen can call.

### Native screens and routes

- Create: `apps/mobile/app/profile.tsx`
  Responsibility: add a top-level profile route.
- Create: `apps/mobile/src/screens/ProfileScreen.tsx`
  Responsibility: render account/settings/logout UI for the native app.
- Create: `apps/mobile/src/components/MobileScreenFrame.tsx`
  Responsibility: share a minimal top bar with optional avatar and optional chat FAB across multiple native screens.
- Modify: `apps/mobile/app/index.tsx`
  Responsibility: redirect app entry to the actual home route instead of the current probe screen.
- Modify: `apps/mobile/app/(tabs)/_layout.tsx`
  Responsibility: remove the visible tab bar while preserving route grouping.
- Modify: `apps/mobile/src/screens/HomeScreen.tsx`
- Modify: `apps/mobile/src/screens/PlaceholderScreen.tsx`
- Modify: `apps/mobile/src/screens/LinkTargetScreen.tsx`
- Modify: `apps/mobile/src/screens/ChatScreen.tsx`
  Responsibility: adopt the new native frame and update route pushes/back navigation to the tab-less model.

### Verification and docs

- Modify: `docs/superpowers/plans/2026-03-18-mobile-home-hub-navigation-implementation.md`
  Responsibility: check off completed steps as execution proceeds.

## Chunk 1: Web Shell Contract

### Task 1: Lock the mobile web shell behavior before editing it

**Files:**
- Modify: `apps/web/src/components/mobile/MobileShell.test.tsx`
- Reference: `docs/superpowers/specs/2026-03-18-mobile-home-hub-navigation-design.md`

- [ ] **Step 1: Rewrite the shell tests around the approved chrome contract**

Add assertions that:
- the shell renders an avatar entry point when `userId` is present
- the shell does **not** render `모바일 기본 탐색`
- the shell does **not** render the shell-owned `로그아웃` button
- the shell can render a floating `채팅` action only when explicitly enabled

- [ ] **Step 2: Run the targeted web shell test and verify RED**

Run:
```bash
pnpm --filter @gynecology-chatbot/web exec jest --runInBand src/components/mobile/MobileShell.test.tsx
```

Expected: FAIL because the current shell still renders navigation chips, quick theme controls, and shell-level logout.

- [ ] **Step 3: Implement the minimal shell API**

Edit `apps/web/src/components/mobile/MobileShell.tsx` to:
- remove `clearMobileSession`, `storeMobileThemeKey`, quick theme UI, and nav chip rendering
- always use the compact avatar pattern instead of the large profile header
- accept an explicit `showChatFab` flag and build the FAB href from `userId`
- keep `showTitleBlock` for screens that still want a title section inside the shell

- [ ] **Step 4: Re-run the shell test and verify GREEN**

Run:
```bash
pnpm --filter @gynecology-chatbot/web exec jest --runInBand src/components/mobile/MobileShell.test.tsx
```

Expected: PASS with no remaining references to the removed shell navigation.

- [ ] **Step 5: Commit the shell contract**

```bash
git add apps/web/src/components/mobile/MobileShell.tsx apps/web/src/components/mobile/MobileShell.test.tsx
git commit -m "Stabilize the mobile shell around avatar and chat FAB"
```

## Chunk 2: Web Screens Adopt The Hub Model

### Task 2: Make the home screen rely on the shell instead of duplicate chat/profile actions

**Files:**
- Modify: `apps/web/src/components/mobile/MobileHomeView.test.tsx`
- Modify: `apps/web/src/components/mobile/MobileHomeView.tsx`

- [ ] **Step 1: Tighten the home view test around the approved IA**

Add assertions that:
- the shell avatar remains the only profile entry
- the hero keeps pregnancy summary copy
- the inline primary CTA for new chat is gone because chat now lives in the FAB
- the destination cards remain for `지식` and `수첩`

- [ ] **Step 2: Run the home test and verify RED**

Run:
```bash
pnpm --filter @gynecology-chatbot/web exec jest --runInBand src/components/mobile/MobileHomeView.test.tsx
```

Expected: FAIL because the current hero still includes inline new-chat CTA text.

- [ ] **Step 3: Update the home implementation minimally**

Edit `apps/web/src/components/mobile/MobileHomeView.tsx` to:
- pass `showChatFab`
- keep the top summary hero, recent chat section, destination cards, and calendar summary
- remove the inline “증상 상담 시작” button
- leave `지식`/`수첩` as the only main destination cards

- [ ] **Step 4: Re-run the home test and verify GREEN**

Run:
```bash
pnpm --filter @gynecology-chatbot/web exec jest --runInBand src/components/mobile/MobileHomeView.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit the home-hub screen update**

```bash
git add apps/web/src/components/mobile/MobileHomeView.tsx apps/web/src/components/mobile/MobileHomeView.test.tsx
git commit -m "Turn the mobile home view into a true hub"
```

### Task 3: Move logout and session-management ownership into the profile screen

**Files:**
- Modify: `apps/web/src/components/mobile/MobileProfileView.test.tsx`
- Modify: `apps/web/src/components/mobile/MobileProfileView.tsx`

- [ ] **Step 1: Write a failing profile test for in-screen logout ownership**

Add assertions that:
- the profile heading and settings form still render
- the shell does not own logout anymore
- a logout button appears inside the profile body
- profile no longer depends on shell-level quick theme/navigation controls

- [ ] **Step 2: Run the profile test and verify RED**

Run:
```bash
pnpm --filter @gynecology-chatbot/web exec jest --runInBand src/components/mobile/MobileProfileView.test.tsx
```

Expected: FAIL because logout is still supplied by the shell and the screen does not own that action yet.

- [ ] **Step 3: Implement profile-owned logout**

Edit `apps/web/src/components/mobile/MobileProfileView.tsx` to:
- import `clearMobileSession` and `useRouter`
- add a bottom `세션 관리` or `로그아웃` section that clears storage and redirects to `/auth/login`
- remove any now-redundant “홈으로 / 새 상담 시작” shortcut row if it fights the profile-as-settings role
- keep the settings form, pregnancy information, and theme selection inside the profile screen

- [ ] **Step 4: Re-run the profile test and verify GREEN**

Run:
```bash
pnpm --filter @gynecology-chatbot/web exec jest --runInBand src/components/mobile/MobileProfileView.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit the profile ownership move**

```bash
git add apps/web/src/components/mobile/MobileProfileView.tsx apps/web/src/components/mobile/MobileProfileView.test.tsx
git commit -m "Move mobile logout into the profile screen"
```

### Task 4: Bring supporting web screens in line with the shell FAB model

**Files:**
- Modify: `apps/web/src/components/mobile/MobileContentView.tsx`
- Modify: `apps/web/src/components/mobile/MobileLinkView.tsx`
- Modify: `apps/web/src/components/mobile/MobileRecordDayView.tsx`
- Modify: `apps/web/src/components/mobile/MobileContentView.test.tsx`
- Modify: `apps/web/src/components/mobile/MobileLinkView.test.tsx`
- Modify: `apps/web/src/components/mobile/MobileRecordDayView.test.tsx`

- [ ] **Step 1: Add failing assertions for the supporting-screen affordances**

Update the tests to assert:
- compact shell avatar remains the only profile entry
- supporting screens can enable the shell FAB instead of inline “상담으로 이동” duplication
- record-day keeps session-specific links while still inheriting the simplified shell

- [ ] **Step 2: Run the supporting-screen tests and verify RED**

Run:
```bash
pnpm --filter @gynecology-chatbot/web exec jest --runInBand \
  src/components/mobile/MobileContentView.test.tsx \
  src/components/mobile/MobileLinkView.test.tsx \
  src/components/mobile/MobileRecordDayView.test.tsx
```

Expected: At least `MobileContentView` and `MobileLinkView` fail because they still render their own new-chat CTA rows.

- [ ] **Step 3: Implement the supporting-screen cleanup**

Edit the three screens to:
- pass `showChatFab` where a global new-chat affordance should exist
- remove duplicate inline “상담으로 이동/돌아가기” buttons that conflict with the shell FAB
- keep contextual links that open existing related sessions

- [ ] **Step 4: Re-run the supporting-screen tests and verify GREEN**

Run:
```bash
pnpm --filter @gynecology-chatbot/web exec jest --runInBand \
  src/components/mobile/MobileContentView.test.tsx \
  src/components/mobile/MobileLinkView.test.tsx \
  src/components/mobile/MobileRecordDayView.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Run the focused web regression suite**

Run:
```bash
pnpm --filter @gynecology-chatbot/web exec jest --runInBand \
  src/app/page.test.tsx \
  src/components/mobile/MobileShell.test.tsx \
  src/components/mobile/MobileHomeView.test.tsx \
  src/components/mobile/MobileProfileView.test.tsx \
  src/components/mobile/MobileContentView.test.tsx \
  src/components/mobile/MobileLinkView.test.tsx \
  src/components/mobile/MobileRecordDayView.test.tsx
pnpm --filter @gynecology-chatbot/web lint
pnpm --filter @gynecology-chatbot/web type-check
```

Expected: All commands PASS.

- [ ] **Step 6: Commit the web screen alignment**

```bash
git add \
  apps/web/src/components/mobile/MobileContentView.tsx \
  apps/web/src/components/mobile/MobileLinkView.tsx \
  apps/web/src/components/mobile/MobileRecordDayView.tsx \
  apps/web/src/components/mobile/MobileContentView.test.tsx \
  apps/web/src/components/mobile/MobileLinkView.test.tsx \
  apps/web/src/components/mobile/MobileRecordDayView.test.tsx
git commit -m "Align supporting mobile web screens with the hub shell"
```

## Chunk 3: Native App Follows The Same Information Architecture

### Task 5: Add a native profile port instead of hard-coding profile state into screens

**Files:**
- Modify: `packages/app-core/src/ports.ts`
- Modify: `apps/mobile/src/api/mobileApi.ts`
- Modify: `apps/mobile/src/core/adapters/apiMobilePorts.ts`
- Modify: `apps/mobile/src/core/createMobileServices.ts`
- Modify: `apps/mobile/src/core/mockMobileRuntime.ts`
- Modify: `apps/mobile/src/core/adapters/mockMobileAuthPorts.ts`
- Modify: `apps/mobile/src/core/MobileAppSessionProvider.tsx`

- [ ] **Step 1: Add contract coverage by writing the profile API client tests you can support without new dependencies**

Create a lightweight Node-based test file if practical, or extend an existing small test target around `apps/mobile/src/api/mobileApi.ts` request construction. If the package cannot test TypeScript modules without new tooling, document that constraint in the task notes and keep the rest of the chunk verification at lint/manual-smoke level.

- [ ] **Step 2: Run the native package checks and verify the baseline**

Run:
```bash
pnpm --filter @gynecology-chatbot/mobile lint
```

Expected: PASS before the new port work begins.

- [ ] **Step 3: Add the shared port and client methods**

Implement:
- `MobileProfilePort` in `packages/app-core/src/ports.ts`
- `fetchMobileProfile()` and `updateMobileProfile()` in `apps/mobile/src/api/mobileApi.ts`
- API and mock adapters in `apps/mobile/src/core/adapters/apiMobilePorts.ts` and the mock runtime/adapters
- `signOut()` in `MobileAppSessionProvider` so native profile can clear the current user cleanly

- [ ] **Step 4: Re-run native lint and any lightweight client tests**

Run:
```bash
pnpm --filter @gynecology-chatbot/mobile lint
```

Expected: PASS.

- [ ] **Step 5: Commit the native data foundation**

```bash
git add \
  packages/app-core/src/ports.ts \
  apps/mobile/src/api/mobileApi.ts \
  apps/mobile/src/core/adapters/apiMobilePorts.ts \
  apps/mobile/src/core/createMobileServices.ts \
  apps/mobile/src/core/mockMobileRuntime.ts \
  apps/mobile/src/core/adapters/mockMobileAuthPorts.ts \
  apps/mobile/src/core/MobileAppSessionProvider.tsx
git commit -m "Add native profile services for the hub navigation flow"
```

### Task 6: Remove the visible native tab bar and add the missing profile route

**Files:**
- Create: `apps/mobile/app/profile.tsx`
- Create: `apps/mobile/src/screens/ProfileScreen.tsx`
- Create: `apps/mobile/src/components/MobileScreenFrame.tsx`
- Modify: `apps/mobile/app/index.tsx`
- Modify: `apps/mobile/app/(tabs)/_layout.tsx`
- Modify: `apps/mobile/src/screens/HomeScreen.tsx`
- Modify: `apps/mobile/src/screens/PlaceholderScreen.tsx`
- Modify: `apps/mobile/src/screens/LinkTargetScreen.tsx`
- Modify: `apps/mobile/src/screens/ChatScreen.tsx`

- [ ] **Step 1: Define a failing smoke target for the route structure**

Document the expected route behavior before editing:
- app entry redirects to the home screen
- there is no visible bottom tab bar
- home shows avatar + FAB
- avatar opens profile
- profile contains logout
- chat back buttons return to home, not a removed tab route

- [ ] **Step 2: Implement the smallest reusable native frame**

Create `apps/mobile/src/components/MobileScreenFrame.tsx` with:
- safe-area wrapper
- top row with optional back affordance or title on the left
- optional avatar button on the right
- optional floating chat FAB

Avoid introducing a new design system; only centralize repeated frame behavior.

- [ ] **Step 3: Wire the routes and screens**

Update:
- `apps/mobile/app/index.tsx` to redirect to the real home route
- `apps/mobile/app/(tabs)/_layout.tsx` to remove `Tabs` UI and preserve only route grouping
- `HomeScreen` to use the shared frame and avatar entry
- `PlaceholderScreen` and `LinkTargetScreen` to use the shared frame and optional FAB
- `ChatScreen` back navigation to return to the home route, not `/(tabs)/home`
- add `ProfileScreen` plus `app/profile.tsx`

- [ ] **Step 4: Verify native checks**

Run:
```bash
pnpm --filter @gynecology-chatbot/mobile lint
```

Manual smoke in Expo:
1. Launch the app.
2. Confirm entry lands on home instead of the probe screen.
3. Confirm there is no bottom tab bar.
4. Confirm tapping the avatar opens profile.
5. Confirm the profile logout path returns to login.
6. Confirm the floating chat action still opens a new chat.

- [ ] **Step 5: Commit the native navigation update**

```bash
git add \
  apps/mobile/app/index.tsx \
  apps/mobile/app/'(tabs)'/_layout.tsx \
  apps/mobile/app/profile.tsx \
  apps/mobile/src/components/MobileScreenFrame.tsx \
  apps/mobile/src/screens/HomeScreen.tsx \
  apps/mobile/src/screens/PlaceholderScreen.tsx \
  apps/mobile/src/screens/LinkTargetScreen.tsx \
  apps/mobile/src/screens/ChatScreen.tsx \
  apps/mobile/src/screens/ProfileScreen.tsx
git commit -m "Match the native app to the hub navigation model"
```

## Chunk 4: Final Verification

### Task 7: Prove the navigation model is stable end-to-end

**Files:**
- Modify: `docs/superpowers/plans/2026-03-18-mobile-home-hub-navigation-implementation.md`

- [ ] **Step 1: Run the web verification suite one more time**

Run:
```bash
pnpm --filter @gynecology-chatbot/web exec jest --runInBand \
  src/app/page.test.tsx \
  src/components/mobile/MobileShell.test.tsx \
  src/components/mobile/MobileHomeView.test.tsx \
  src/components/mobile/MobileProfileView.test.tsx \
  src/components/mobile/MobileContentView.test.tsx \
  src/components/mobile/MobileLinkView.test.tsx \
  src/components/mobile/MobileRecordDayView.test.tsx
pnpm --filter @gynecology-chatbot/web lint
pnpm --filter @gynecology-chatbot/web type-check
```

Expected: PASS.

- [ ] **Step 2: Run the native lint pass**

Run:
```bash
pnpm --filter @gynecology-chatbot/mobile lint
```

Expected: PASS.

- [ ] **Step 3: Record manual smoke evidence**

Write down the exact screens checked and outcomes:
- home avatar
- no bottom tabs
- profile-owned logout
- FAB new chat
- existing session re-entry from home

- [ ] **Step 4: Commit any final verification-only doc touch if needed**

```bash
git add docs/superpowers/plans/2026-03-18-mobile-home-hub-navigation-implementation.md
git commit -m "Record completion of the mobile home-hub navigation rollout"
```

## Notes For The Implementer

- The worktree is already dirty. Do not revert unrelated edits in the mobile-web or admin files while following this plan.
- `apps/web` already has partially updated tests and mobile shell work in progress. Read the current file contents before applying each task; do not assume the examples above reflect HEAD exactly.
- `apps/mobile` currently has no dedicated React Native component test harness. Do not add new dependencies just to satisfy parity; prefer lint plus explicit manual smoke until the team asks for a native test rig.
