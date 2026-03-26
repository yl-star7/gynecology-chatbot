# Mobile Patient Figma Mirroring Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the patient-facing mobile flow in `apps/mobile` to match the approved Figma-first structure, then mirror that structure into the mobile web surface in `apps/web`.

**Architecture:** Keep session/auth/API ports intact, but replace the patient-facing information hierarchy with a new mobile-first shell, screen set, and view-model layer. Mobile becomes the source of truth for patient UX, while web mirrors the same section order, labels, and derived display state with platform-appropriate rendering.

**Tech Stack:** Expo Router, React Native, existing mobile design system tokens/components, Next.js App Router, existing mobile web views, TypeScript, Jest/testing-library where already present.

---

## File Structure

### Mobile routes to keep as stable entry points

- Modify: `apps/mobile/app/index.tsx`
- Modify: `apps/mobile/app/(tabs)/home.tsx`
- Modify: `apps/mobile/app/(tabs)/knowledge.tsx`
- Modify: `apps/mobile/app/(tabs)/notebook.tsx`
- Modify: `apps/mobile/app/profile.tsx`
- Modify: `apps/mobile/app/chat/[sessionId].tsx`
- Modify: `apps/mobile/app/chat/link/[target].tsx`

### Mobile patient shell and screens

- Modify: `apps/mobile/src/components/MobileScreenFrame.tsx`
- Create: `apps/mobile/src/components/patient/PatientTabBar.tsx`
- Create: `apps/mobile/src/components/patient/PatientShell.tsx`
- Create: `apps/mobile/src/components/patient/PatientHeroBubble.tsx`
- Create: `apps/mobile/src/components/patient/PatientTodayTabs.tsx`
- Create: `apps/mobile/src/screens/patient/PatientHomeScreen.tsx`
- Create: `apps/mobile/src/screens/patient/PatientTodayScreen.tsx`
- Create: `apps/mobile/src/screens/patient/PatientContentScreen.tsx`
- Create: `apps/mobile/src/screens/patient/PatientRecordsScreen.tsx`
- Create: `apps/mobile/src/screens/patient/PatientProfileScreen.tsx`
- Create: `apps/mobile/src/screens/patient/index.ts`

### Mobile patient view-model and helpers

- Create: `apps/mobile/src/screens/patient/view-models/buildPatientHomeViewModel.ts`
- Create: `apps/mobile/src/screens/patient/view-models/buildPatientTodayViewModel.ts`
- Create: `apps/mobile/src/screens/patient/view-models/buildPatientRecordsViewModel.ts`
- Create: `apps/mobile/src/screens/patient/view-models/patient-copy.ts`
- Create: `apps/mobile/src/screens/patient/view-models/index.ts`

### Existing mobile screens to retire or convert into wrappers

- Modify or replace exports in: `apps/mobile/src/screens/HomeScreen.tsx`
- Modify or replace exports in: `apps/mobile/src/screens/ChatScreen.tsx`
- Modify or replace exports in: `apps/mobile/src/screens/ContentListScreen.tsx`
- Modify or replace exports in: `apps/mobile/src/screens/ProfileScreen.tsx`

### Mobile tests

- Create: `apps/mobile/src/screens/patient/view-models/buildPatientHomeViewModel.test.ts`
- Create: `apps/mobile/src/screens/patient/view-models/buildPatientTodayViewModel.test.ts`
- Create: `apps/mobile/src/screens/patient/view-models/buildPatientRecordsViewModel.test.ts`

### Web mobile views to mirror mobile

- Modify: `apps/web/src/components/mobile/MobileShell.tsx`
- Modify: `apps/web/src/components/mobile/MobileHomeView.tsx`
- Create: `apps/web/src/components/mobile/MobileTodayView.tsx`
- Modify: `apps/web/src/components/mobile/MobileContentView.tsx`
- Modify: `apps/web/src/components/mobile/MobileRecordDayView.tsx`
- Modify: `apps/web/src/components/mobile/MobileProfileView.tsx`
- Create: `apps/web/src/components/mobile/mobile-patient-view-models.ts`

### Web routes and tests

- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/app/chat/[sessionId]/page.tsx`
- Modify: `apps/web/app/knowledge/page.tsx`
- Modify: `apps/web/app/notebook/page.tsx`
- Modify: `apps/web/app/profile/page.tsx`
- Modify: `apps/web/app/records/[isoDate]/page.tsx`
- Create: `apps/web/src/components/mobile/MobileTodayView.test.tsx`
- Modify: `apps/web/src/components/mobile/MobileHomeView.test.tsx`
- Modify: `apps/web/src/components/mobile/MobileContentView.test.tsx`
- Modify: `apps/web/src/components/mobile/MobileProfileView.test.tsx`

## Chunk 1: Mobile Patient Shell And View Models

### Task 1: Lock down mobile-derived copy and fallback rules

**Files:**
- Create: `apps/mobile/src/screens/patient/view-models/patient-copy.ts`
- Test: `apps/mobile/src/screens/patient/view-models/buildPatientHomeViewModel.test.ts`

- [ ] **Step 1: Write the failing test for home fallback copy**

```ts
import { describe, expect, it } from "@jest/globals";
import { buildPatientHomeViewModel } from "./buildPatientHomeViewModel";

describe("buildPatientHomeViewModel", () => {
  it("fills missing baby message and hero copy with patient-safe defaults", () => {
    const viewModel = buildPatientHomeViewModel({
      home: null,
      profile: { babyNickname: "", dueDate: null, displayName: "정석" },
      now: new Date("2026-03-24T09:00:00+09:00"),
    });

    expect(viewModel.heroName).toBe("우리 아기");
    expect(viewModel.babyMessage.length).toBeGreaterThan(0);
    expect(viewModel.supportMessage).toContain("함께");
  });
});
```

- [ ] **Step 2: Run the test to confirm the helper does not exist yet**

Run: `pnpm --filter mobile test -- buildPatientHomeViewModel`
Expected: FAIL with missing module or missing export.

- [ ] **Step 3: Add centralized patient fallback copy**

Implement constants for:

- default baby nickname
- default baby message
- default emotional support line
- default today/talk CTA labels
- default empty-state text for today checklist, records, and profile

- [ ] **Step 4: Create `buildPatientHomeViewModel.ts` with fallback support**

```ts
export function buildPatientHomeViewModel({ home, profile, now }) {
  const heroName = profile?.babyNickname?.trim() || DEFAULT_BABY_NAME;
  return {
    heroName,
    monthLabel: formatMonth(now),
    dayLabel: String(now.getDate()),
    babyMessage: home?.heroMessage || DEFAULT_BABY_MESSAGE,
    supportMessage: DEFAULT_SUPPORT_MESSAGE,
  };
}
```

- [ ] **Step 5: Re-run the test**

Run: `pnpm --filter mobile test -- buildPatientHomeViewModel`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/screens/patient/view-models/patient-copy.ts apps/mobile/src/screens/patient/view-models/buildPatientHomeViewModel.ts apps/mobile/src/screens/patient/view-models/buildPatientHomeViewModel.test.ts
git commit -m "Define patient-facing fallback copy for Figma-first mobile screens"
```

### Task 2: Add mobile patient view-model builders

**Files:**
- Create: `apps/mobile/src/screens/patient/view-models/buildPatientTodayViewModel.ts`
- Create: `apps/mobile/src/screens/patient/view-models/buildPatientRecordsViewModel.ts`
- Create: `apps/mobile/src/screens/patient/view-models/index.ts`
- Test: `apps/mobile/src/screens/patient/view-models/buildPatientTodayViewModel.test.ts`
- Test: `apps/mobile/src/screens/patient/view-models/buildPatientRecordsViewModel.test.ts`

- [ ] **Step 1: Write the failing today-flow view-model test**

```ts
it("combines content, checklist, and chat state into one today view model", () => {
  const viewModel = buildPatientTodayViewModel({
    dailyContent: {
      fetalDevelopment: "아기가 자라고 있어요.",
      maternalChanges: "엄마 몸도 변화하고 있어요.",
      checklist: [{ id: "walk", text: "가볍게 걸어요" }],
    },
    checklistItems: [],
    messages: [],
  });

  expect(viewModel.sections).toHaveLength(4);
  expect(viewModel.checklistItems[0].label).toBe("가볍게 걸어요");
});
```

- [ ] **Step 2: Write the failing records view-model test**

```ts
it("builds a record summary list even when only partial home calendar data exists", () => {
  const viewModel = buildPatientRecordsViewModel({
    calendarDays: [{ isoDate: "2026-03-24", dayLabel: "24", summary: null, hasChat: true, emotionTone: "calm" }],
  });

  expect(viewModel.days[0].isoDate).toBe("2026-03-24");
  expect(viewModel.days[0].chipLabel.length).toBeGreaterThan(0);
});
```

- [ ] **Step 3: Run both tests**

Run: `pnpm --filter mobile test -- buildPatientTodayViewModel buildPatientRecordsViewModel`
Expected: FAIL

- [ ] **Step 4: Implement the minimum builders**

Build:

- `buildPatientTodayViewModel` to merge daily content, checklist completion, and chat starter state
- `buildPatientRecordsViewModel` to convert calendar days into record cards and month summaries
- shared exports through `index.ts`

- [ ] **Step 5: Re-run both tests**

Run: `pnpm --filter mobile test -- buildPatientTodayViewModel buildPatientRecordsViewModel`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/screens/patient/view-models/buildPatientTodayViewModel.ts apps/mobile/src/screens/patient/view-models/buildPatientRecordsViewModel.ts apps/mobile/src/screens/patient/view-models/buildPatientTodayViewModel.test.ts apps/mobile/src/screens/patient/view-models/buildPatientRecordsViewModel.test.ts apps/mobile/src/screens/patient/view-models/index.ts
git commit -m "Add mobile patient view models for home, today, and records flows"
```

## Chunk 2: Mobile Patient UX Rebuild

### Task 3: Build the new patient shell and bottom navigation

**Files:**
- Create: `apps/mobile/src/components/patient/PatientTabBar.tsx`
- Create: `apps/mobile/src/components/patient/PatientShell.tsx`
- Modify: `apps/mobile/src/components/MobileScreenFrame.tsx`
- Modify: `apps/mobile/src/components/ui/index.ts`

- [ ] **Step 1: Write a minimal shell render test if mobile test harness supports RN component tests**

If RN component tests already exist, add:

```ts
it("renders patient shell with active tab labels", () => {
  // render PatientShell around a stub child
  // expect 홈, 오늘,우리, 마이페이지 labels
});
```

If no RN component harness is practical, skip new component tests and rely on targeted typecheck plus manual render verification.

- [ ] **Step 2: Implement `PatientTabBar.tsx`**

Render a fixed bottom tab bar using existing theme tokens and `ui/Pressable`, with tabs for:

- 홈
- 오늘,우리
- 마이페이지

Use token-based spacing, radii, and shadows only.

- [ ] **Step 3: Implement `PatientShell.tsx`**

Wrap screen content with:

- safe outer background
- optional top back/profile affordances
- bottom tab bar
- shared content padding rules

- [ ] **Step 4: Update `MobileScreenFrame.tsx` to support the new shell or keep it as a thin backward-compatible wrapper**

Keep legacy callers working long enough for migration, but make patient screens consume the new shell directly.

- [ ] **Step 5: Run targeted mobile typecheck**

Run: `pnpm --filter mobile exec tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/components/patient/PatientTabBar.tsx apps/mobile/src/components/patient/PatientShell.tsx apps/mobile/src/components/MobileScreenFrame.tsx apps/mobile/src/components/ui/index.ts
git commit -m "Create the mobile patient shell and bottom navigation"
```

### Task 4: Replace the home screen with the Figma-first emotional hero

**Files:**
- Create: `apps/mobile/src/components/patient/PatientHeroBubble.tsx`
- Create: `apps/mobile/src/screens/patient/PatientHomeScreen.tsx`
- Modify: `apps/mobile/src/screens/HomeScreen.tsx`
- Modify: `apps/mobile/app/(tabs)/home.tsx`

- [ ] **Step 1: Add or extend the failing home view-model test to cover the hero card**

```ts
it("returns due-day metrics and primary actions for the Figma-style home hero", () => {
  const viewModel = buildPatientHomeViewModel(/* stub home + profile */);
  expect(viewModel.metricLabel).toContain("만나기까지");
  expect(viewModel.primaryAction.href).toBe("/chat/new");
});
```

- [ ] **Step 2: Run the test**

Run: `pnpm --filter mobile test -- buildPatientHomeViewModel`
Expected: FAIL

- [ ] **Step 3: Implement `PatientHeroBubble.tsx` and `PatientHomeScreen.tsx`**

The new screen should include:

- date and hero naming
- baby speech bubble
- large pregnancy-progress metric
- support quote and "오늘의 한마디" block
- CTA routing into today flow and supporting content

- [ ] **Step 4: Convert `HomeScreen.tsx` into a compatibility export**

```ts
export { PatientHomeScreen as HomeScreen } from "./patient/PatientHomeScreen";
```

- [ ] **Step 5: Verify the mobile route still points to the rebuilt home**

Run: `pnpm --filter mobile exec tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/components/patient/PatientHeroBubble.tsx apps/mobile/src/screens/patient/PatientHomeScreen.tsx apps/mobile/src/screens/HomeScreen.tsx apps/mobile/app/(tabs)/home.tsx apps/mobile/src/screens/patient/view-models/buildPatientHomeViewModel.ts apps/mobile/src/screens/patient/view-models/buildPatientHomeViewModel.test.ts
git commit -m "Rebuild the patient home screen around the approved Figma hero"
```

### Task 5: Replace chat with the integrated "오늘,우리" hub

**Files:**
- Create: `apps/mobile/src/components/patient/PatientTodayTabs.tsx`
- Create: `apps/mobile/src/screens/patient/PatientTodayScreen.tsx`
- Modify: `apps/mobile/src/screens/ChatScreen.tsx`
- Modify: `apps/mobile/app/chat/[sessionId].tsx`

- [ ] **Step 1: Extend the failing today view-model test to cover section order**

```ts
it("orders today sections as baby, mom, checklist, and conversation", () => {
  const viewModel = buildPatientTodayViewModel(/* stub data */);
  expect(viewModel.sections.map((section) => section.id)).toEqual([
    "baby",
    "mom",
    "checklist",
    "conversation",
  ]);
});
```

- [ ] **Step 2: Run the test**

Run: `pnpm --filter mobile test -- buildPatientTodayViewModel`
Expected: FAIL

- [ ] **Step 3: Implement `PatientTodayScreen.tsx`**

Integrate:

- baby/mom informational panels
- checklist completion
- emotion-aware conversation entry
- reuse of current `chatPort` send flow

Do not keep the old raw chat layout as the primary patient screen.

- [ ] **Step 4: Convert `ChatScreen.tsx` into the new patient hub or a compatibility export**

Preserve the `sessionId` prop so route callers remain stable.

- [ ] **Step 5: Run targeted verification**

Run: `pnpm --filter mobile exec tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/components/patient/PatientTodayTabs.tsx apps/mobile/src/screens/patient/PatientTodayScreen.tsx apps/mobile/src/screens/ChatScreen.tsx apps/mobile/app/chat/[sessionId].tsx apps/mobile/src/screens/patient/view-models/buildPatientTodayViewModel.ts apps/mobile/src/screens/patient/view-models/buildPatientTodayViewModel.test.ts
git commit -m "Turn the patient chat route into the integrated today hub"
```

### Task 6: Rebuild content, records, and profile around the new patient structure

**Files:**
- Create: `apps/mobile/src/screens/patient/PatientContentScreen.tsx`
- Create: `apps/mobile/src/screens/patient/PatientRecordsScreen.tsx`
- Create: `apps/mobile/src/screens/patient/PatientProfileScreen.tsx`
- Modify: `apps/mobile/src/screens/ContentListScreen.tsx`
- Modify: `apps/mobile/src/screens/ProfileScreen.tsx`
- Modify: `apps/mobile/app/(tabs)/knowledge.tsx`
- Modify: `apps/mobile/app/(tabs)/notebook.tsx`
- Modify: `apps/mobile/app/profile.tsx`

- [ ] **Step 1: Add the failing records view-model expectations for navigation affordances**

```ts
it("creates record cards with human labels and destination hrefs", () => {
  const viewModel = buildPatientRecordsViewModel(/* stub data */);
  expect(viewModel.days[0].href).toContain("/records/");
});
```

- [ ] **Step 2: Run the records test**

Run: `pnpm --filter mobile test -- buildPatientRecordsViewModel`
Expected: FAIL

- [ ] **Step 3: Implement the three patient screens**

Requirements:

- content screen follows the same design language as home/today
- records screen favors day cards and recap language over raw list rendering
- profile screen keeps form editing but adopts the softer patient layout

- [ ] **Step 4: Replace legacy screen exports**

Convert `ContentListScreen.tsx` and `ProfileScreen.tsx` into wrappers or compatibility exports to the patient versions.

- [ ] **Step 5: Run mobile typecheck**

Run: `pnpm --filter mobile exec tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/screens/patient/PatientContentScreen.tsx apps/mobile/src/screens/patient/PatientRecordsScreen.tsx apps/mobile/src/screens/patient/PatientProfileScreen.tsx apps/mobile/src/screens/ContentListScreen.tsx apps/mobile/src/screens/ProfileScreen.tsx apps/mobile/app/(tabs)/knowledge.tsx apps/mobile/app/(tabs)/notebook.tsx apps/mobile/app/profile.tsx apps/mobile/src/screens/patient/view-models/buildPatientRecordsViewModel.ts apps/mobile/src/screens/patient/view-models/buildPatientRecordsViewModel.test.ts
git commit -m "Rebuild patient content, records, and profile screens for the new flow"
```

## Chunk 3: Web Mobile Mirroring

### Task 7: Mirror the mobile shell and home structure into web

**Files:**
- Modify: `apps/web/src/components/mobile/MobileShell.tsx`
- Modify: `apps/web/src/components/mobile/MobileHomeView.tsx`
- Create: `apps/web/src/components/mobile/mobile-patient-view-models.ts`
- Modify: `apps/web/src/components/mobile/MobileHomeView.test.tsx`
- Modify: `apps/web/app/page.tsx`

- [ ] **Step 1: Write the failing web test for mirrored home structure**

```tsx
it("renders the mobile-mirrored home hero with baby message and progress metric", async () => {
  render(<MobileHomeView userId="user-1" />);
  expect(await screen.findByText(/만나기까지/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the home view test**

Run: `pnpm --filter web test -- MobileHomeView`
Expected: FAIL

- [ ] **Step 3: Implement shared web-side derived model helpers**

Add `mobile-patient-view-models.ts` to match the same section order and fallback logic used on mobile.

- [ ] **Step 4: Update `MobileShell.tsx` and `MobileHomeView.tsx`**

Mirror:

- softer emotional hero
- profile affordance
- fixed CTA behavior
- mobile-first ordering

- [ ] **Step 5: Re-run the test**

Run: `pnpm --filter web test -- MobileHomeView`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/mobile/MobileShell.tsx apps/web/src/components/mobile/MobileHomeView.tsx apps/web/src/components/mobile/mobile-patient-view-models.ts apps/web/src/components/mobile/MobileHomeView.test.tsx apps/web/app/page.tsx
git commit -m "Mirror the rebuilt patient home flow into mobile web"
```

### Task 8: Mirror the integrated today/content/records/profile flow into web

**Files:**
- Create: `apps/web/src/components/mobile/MobileTodayView.tsx`
- Modify: `apps/web/src/components/mobile/MobileContentView.tsx`
- Modify: `apps/web/src/components/mobile/MobileRecordDayView.tsx`
- Modify: `apps/web/src/components/mobile/MobileProfileView.tsx`
- Create: `apps/web/src/components/mobile/MobileTodayView.test.tsx`
- Modify: `apps/web/src/components/mobile/MobileContentView.test.tsx`
- Modify: `apps/web/src/components/mobile/MobileProfileView.test.tsx`
- Modify: `apps/web/app/chat/[sessionId]/page.tsx`
- Modify: `apps/web/app/knowledge/page.tsx`
- Modify: `apps/web/app/notebook/page.tsx`
- Modify: `apps/web/app/profile/page.tsx`
- Modify: `apps/web/app/records/[isoDate]/page.tsx`

- [ ] **Step 1: Write the failing today-view test**

```tsx
it("renders mirrored today sections in the mobile-defined order", async () => {
  render(<MobileTodayView userId="user-1" sessionId="new" />);
  expect(await screen.findByText("오늘 아기는요")).toBeInTheDocument();
  expect(screen.getByText("오늘 엄마는요")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the targeted web tests**

Run: `pnpm --filter web test -- MobileTodayView MobileContentView MobileProfileView`
Expected: FAIL

- [ ] **Step 3: Implement and route the mirrored views**

Web should follow the mobile structure, not reinterpret it:

- chat route becomes the today hub
- knowledge/notebook routes adopt the rebuilt content/records language
- profile mirrors the patient shell tone and grouping

- [ ] **Step 4: Re-run the targeted tests**

Run: `pnpm --filter web test -- MobileTodayView MobileContentView MobileProfileView`
Expected: PASS

- [ ] **Step 5: Run route-level typecheck or Jest pass**

Run: `pnpm --filter web exec tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/mobile/MobileTodayView.tsx apps/web/src/components/mobile/MobileContentView.tsx apps/web/src/components/mobile/MobileRecordDayView.tsx apps/web/src/components/mobile/MobileProfileView.tsx apps/web/src/components/mobile/MobileTodayView.test.tsx apps/web/src/components/mobile/MobileContentView.test.tsx apps/web/src/components/mobile/MobileProfileView.test.tsx apps/web/app/chat/[sessionId]/page.tsx apps/web/app/knowledge/page.tsx apps/web/app/notebook/page.tsx apps/web/app/profile/page.tsx apps/web/app/records/[isoDate]/page.tsx
git commit -m "Mirror the mobile-first patient today and profile flows on web"
```

## Chunk 4: Integration Verification And Cleanup

### Task 9: Verify mobile and web patient flows end to end

**Files:**
- Modify as needed based on failures from previous tasks

- [ ] **Step 1: Run mobile tests for the new patient view models**

Run: `pnpm --filter mobile test -- buildPatientHomeViewModel buildPatientTodayViewModel buildPatientRecordsViewModel`
Expected: PASS

- [ ] **Step 2: Run web component tests for mirrored patient views**

Run: `pnpm --filter web test -- MobileHomeView MobileTodayView MobileContentView MobileProfileView`
Expected: PASS

- [ ] **Step 3: Run mobile typecheck**

Run: `pnpm --filter mobile exec tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Run web typecheck**

Run: `pnpm --filter web exec tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Do a manual smoke review**

Check:

- mobile home opens into Figma-style hero
- mobile chat route shows the integrated today hub
- mobile knowledge/notebook/profile follow the new patient language
- web route order and section order match mobile

- [ ] **Step 6: Final commit**

```bash
git add apps/mobile apps/web
git commit -m "Ship the Figma-first patient flow rebuild across mobile and web"
```

## Notes For Execution

- Keep the mobile app as the decision maker. If web and mobile diverge, change web to match mobile.
- Prefer compatibility exports over deleting route entry points mid-migration.
- Reuse existing session, profile, home, knowledge, and chat ports before inventing new ones.
- Keep patient copy warm and non-technical.
- Respect `apps/mobile` design-system constraints: tokens and shared UI components first, no ad-hoc shadows or raw `Pressable` as the default.

## Plan Review Status

- Spec-based plan draft written
- External plan-review subagent loop not run in this harness session
