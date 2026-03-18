# Patient Soft White Color System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved soft-white surface system across patient-facing mobile web and React Native screens without changing auth, chat, or navigation behavior.

**Architecture:** Add one shared missing token for writable field surfaces, then normalize patient-facing web primitives around semantic surface roles before remapping patient web screens. After the web contract is protected and passing, derive a small native patient-surface helper from the existing palette and refactor the React Native patient screens to use the same white-first / soft-secondary hierarchy.

**Tech Stack:** TypeScript, Next.js 15, React 19, Jest + Testing Library, Expo / React Native 0.76, pnpm, Turbo

---

## File Structure

### Shared theme sources

- Modify: `packages/app-core/src/theme.ts`
  - Keep the three existing preset families.
  - Add the missing writable-field token to both `web` and `native`.
  - Do not introduce an entirely new design-system object graph.
- Modify: `packages/app-core/src/index.ts`
  - Export any new theme helpers/types added in `theme.ts`.

### Web patient surface layer

- Modify: `apps/web/src/app/globals.css`
  - Add `--field-surface` and any patient-only semantic CSS variables needed for white-first surfaces.
- Modify: `apps/web/src/components/mobile/MobilePrimitives.tsx`
  - Make `MobileCard` default to the white primary card surface.
  - Add small helpers/constants for patient field surfaces and secondary/accent inset surfaces.
- Create: `apps/web/src/components/mobile/MobilePrimitives.test.tsx`
  - Lock the shared card/field surface contract in one focused test file.

### Web patient screens

- Modify: `apps/web/src/components/mobile/MobileThemePresetButtons.tsx`
- Modify: `apps/web/src/components/mobile/MobileShell.tsx`
- Modify: `apps/web/src/components/mobile/MobileLoginView.tsx`
- Modify: `apps/web/src/components/mobile/MobileOnboardingView.tsx`
- Modify: `apps/web/src/components/mobile/MobileHomeView.tsx`
- Modify: `apps/web/src/components/mobile/MobileProfileView.tsx`
- Modify: `apps/web/src/components/mobile/MobileChatComposer.tsx`
- Modify: `apps/web/src/components/mobile/MobileChatView.tsx`
- Modify: `apps/web/src/components/mobile/ChatPartRenderer.tsx`
- Modify: `apps/web/src/components/mobile/MobileRecordDayView.tsx`
- Modify: `apps/web/src/components/mobile/MobileContentView.tsx`
- Modify: `apps/web/src/components/mobile/MobileContentIndexView.tsx`

### Web regression tests

- Modify: `apps/web/src/components/mobile/MobileOnboardingView.test.tsx`
- Modify: `apps/web/src/components/mobile/MobileProfileView.test.tsx`
- Modify: `apps/web/src/components/mobile/MobileHomeView.test.tsx`
- Modify: `apps/web/src/components/mobile/MobileChatView.test.tsx`
- Modify: `apps/web/src/components/mobile/MobileRecordDayView.test.tsx`
- Modify: `apps/web/src/components/mobile/MobileContentView.test.tsx`
- Modify: `apps/web/src/components/mobile/MobileShell.test.tsx`

### Native patient surface layer

- Modify: `apps/mobile/src/theme.ts`
  - Derive a compact `patientSurfacePalette` (or equivalent) from the shared preset output.
- Modify: `apps/mobile/src/components/MobileScreenFrame.tsx`
  - Route shared shell controls through the new patient surface helper.

### Native patient screens

- Modify: `apps/mobile/src/screens/auth/LoginScreen.tsx`
- Modify: `apps/mobile/src/screens/onboarding/OnboardingScreen.tsx`
- Modify: `apps/mobile/src/screens/HomeScreen.tsx`
- Modify: `apps/mobile/src/screens/ProfileScreen.tsx`
- Modify: `apps/mobile/src/screens/ChatScreen.tsx`

## Chunk 1: Shared Tokens And Web Surface Contracts

### Task 1: Lock the shared web surface contract before changing implementation

**Files:**
- Create: `apps/web/src/components/mobile/MobilePrimitives.test.tsx`
- Modify: `apps/web/src/components/mobile/MobileOnboardingView.test.tsx`
- Modify: `apps/web/src/components/mobile/MobileProfileView.test.tsx`

- [ ] **Step 1: Write failing shared-surface tests**

Add focused assertions for the approved visual contract:

```tsx
import { render, screen } from "@testing-library/react";

import {
  MobileCard,
  mobileFieldClassName,
  mobileInsetCardClassName,
} from "./MobilePrimitives";

describe("MobilePrimitives", () => {
  it("defaults cards to the white primary surface", () => {
    render(<MobileCard>본문</MobileCard>);
    expect(screen.getByText("본문").closest("section")).toHaveClass(
      "bg-[var(--panel-strong)]",
    );
  });

  it("exposes a dedicated white field surface helper", () => {
    expect(mobileFieldClassName).toContain("bg-[var(--field-surface)]");
    expect(mobileInsetCardClassName).toContain("bg-[var(--panel-muted)]");
  });
});
```

Also tighten onboarding/profile tests so their writable fields explicitly expect `bg-[var(--field-surface)]` instead of the current muted tint.

- [ ] **Step 2: Run the focused web tests and verify they fail**

Run:

```bash
pnpm --filter @gynecology-chatbot/web exec jest \
  apps/web/src/components/mobile/MobilePrimitives.test.tsx \
  apps/web/src/components/mobile/MobileOnboardingView.test.tsx \
  apps/web/src/components/mobile/MobileProfileView.test.tsx \
  --runInBand
```

Expected:
- `MobilePrimitives.test.tsx` fails because the file/helpers do not exist yet.
- onboarding/profile field-surface assertions fail because those screens still use `bg-[var(--panel-muted)]`.

- [ ] **Step 3: Add the missing field-surface token to the shared theme preset**

Update `packages/app-core/src/theme.ts` so both preset branches expose a dedicated field fill:

```ts
web: {
  bg: "#fbf4f7",
  panel: "rgba(255, 250, 252, 0.88)",
  panelStrong: "#fffdfd",
  panelMuted: "#f9eef3",
  field: "#ffffff",
  // ...
},
native: {
  background: "#fbf4f7",
  card: "#fffdfd",
  cardMuted: "#f9eef3",
  field: "#ffffff",
  // ...
},
```

Export the updated types through `packages/app-core/src/index.ts`.

- [ ] **Step 4: Implement the shared web surface helpers**

Update `apps/web/src/app/globals.css` and `apps/web/src/components/mobile/MobilePrimitives.tsx` with explicit white-first helpers:

```tsx
export const mobileFieldClassName =
  "w-full rounded-[18px] border border-[var(--line)] bg-[var(--field-surface)] px-4 py-3 text-[15px] text-[var(--text)] outline-none";

export const mobileInsetCardClassName =
  "rounded-[22px] border border-[var(--line)] bg-[var(--panel-muted)]";

const toneClasses = {
  primary: "bg-[var(--panel-strong)]",
  secondary: "bg-[var(--panel-muted)]",
  accent: "bg-[var(--accent-soft)]",
} as const;
```

Have `MobileCard` default to `primary`.

Add the matching CSS variable:

```css
[data-theme="rose-sand"],
:root {
  --field-surface: #ffffff;
}
```

- [ ] **Step 5: Re-run the focused shared-surface tests**

Run:

```bash
pnpm --filter @gynecology-chatbot/web exec jest \
  apps/web/src/components/mobile/MobilePrimitives.test.tsx \
  apps/web/src/components/mobile/MobileOnboardingView.test.tsx \
  apps/web/src/components/mobile/MobileProfileView.test.tsx \
  --runInBand
```

Expected: PASS

- [ ] **Step 6: Commit the shared token and primitive contract**

```bash
git add \
  packages/app-core/src/theme.ts \
  packages/app-core/src/index.ts \
  apps/web/src/app/globals.css \
  apps/web/src/components/mobile/MobilePrimitives.tsx \
  apps/web/src/components/mobile/MobilePrimitives.test.tsx \
  apps/web/src/components/mobile/MobileOnboardingView.test.tsx \
  apps/web/src/components/mobile/MobileProfileView.test.tsx

git commit -F - <<'EOF'
Establish white-first patient surface primitives

Add the missing field surface token and normalize the shared patient web
primitives around white primary cards, secondary inset blocks, and explicit
white writable fields before screen-level remapping.

Constraint: Must preserve the existing theme families and patient behavior
Rejected: Keep reusing panelMuted for writable fields | conflicts with approved soft-white direction
Confidence: high
Scope-risk: narrow
Reversibility: clean
Directive: Keep writable fields on the dedicated field surface instead of reusing decorative tinted surfaces
Tested: Targeted Jest contract tests for primitives, onboarding, and profile
Not-tested: RN rendering at this stage
EOF
```

## Chunk 2: Apply The Surface Rules Across Patient Web Screens

### Task 2: Lock screen-level soft-white expectations with failing tests

**Files:**
- Modify: `apps/web/src/components/mobile/MobileHomeView.test.tsx`
- Modify: `apps/web/src/components/mobile/MobileChatView.test.tsx`
- Modify: `apps/web/src/components/mobile/MobileRecordDayView.test.tsx`
- Modify: `apps/web/src/components/mobile/MobileContentView.test.tsx`
- Modify: `apps/web/src/components/mobile/MobileShell.test.tsx`

- [ ] **Step 1: Add failing assertions for white-first cards and accented sub-surfaces**

Extend the existing tests to assert:
- home hero shell uses `bg-[var(--panel-strong)]`
- home/supporting session or day tiles use `bg-[var(--panel-muted)]`
- shell header uses the primary card surface
- chat composer textarea uses `bg-[var(--field-surface)]`
- assistant cards stay white while user-authored or deep-link support blocks remain accented

Example:

```tsx
expect(screen.getByRole("heading", { name: /오늘 기록과 상담/ }).closest("section"))
  .toHaveClass("bg-[var(--panel-strong)]");

expect(screen.getByPlaceholderText("증상이나 검사 결과를 입력하세요."))
  .toHaveClass("bg-[var(--field-surface)]");
```

- [ ] **Step 2: Run the focused screen tests and verify they fail**

Run:

```bash
pnpm --filter @gynecology-chatbot/web exec jest \
  apps/web/src/components/mobile/MobileHomeView.test.tsx \
  apps/web/src/components/mobile/MobileChatView.test.tsx \
  apps/web/src/components/mobile/MobileRecordDayView.test.tsx \
  apps/web/src/components/mobile/MobileContentView.test.tsx \
  apps/web/src/components/mobile/MobileShell.test.tsx \
  --runInBand
```

Expected: FAIL on the new class expectations.

### Task 3: Remap patient web screens to the semantic surface roles

**Files:**
- Modify: `apps/web/src/components/mobile/MobileThemePresetButtons.tsx`
- Modify: `apps/web/src/components/mobile/MobileShell.tsx`
- Modify: `apps/web/src/components/mobile/MobileLoginView.tsx`
- Modify: `apps/web/src/components/mobile/MobileOnboardingView.tsx`
- Modify: `apps/web/src/components/mobile/MobileHomeView.tsx`
- Modify: `apps/web/src/components/mobile/MobileProfileView.tsx`
- Modify: `apps/web/src/components/mobile/MobileChatComposer.tsx`
- Modify: `apps/web/src/components/mobile/MobileChatView.tsx`
- Modify: `apps/web/src/components/mobile/ChatPartRenderer.tsx`
- Modify: `apps/web/src/components/mobile/MobileRecordDayView.tsx`
- Modify: `apps/web/src/components/mobile/MobileContentView.tsx`
- Modify: `apps/web/src/components/mobile/MobileContentIndexView.tsx`

- [ ] **Step 1: Convert form fields to the shared white field helper**

Replace repeated field classes like:

```tsx
className="rounded-[18px] border border-[var(--line)] bg-[var(--panel-muted)] px-4 py-3 ..."
```

with the shared field helper/constant in:
- login
- onboarding
- profile
- chat composer

- [ ] **Step 2: Normalize top-level cards to the primary white surface**

Make these white-first:
- `MobileShell` header
- onboarding intro/form cards
- login intro/form cards
- home hero and shortcut cards
- profile summary/settings/logout cards
- record-day/content primary containers
- assistant chat cards and neutral carousel cards

- [ ] **Step 3: Restrict tinted surfaces to secondary and accent moments**

Keep tint only on:
- selected theme button
- notices
- user bubble
- deep-link/action blocks
- small inset summary tiles
- active calendar day or quick-selection state

Use `surfaceSecondary` (muted tint) for passive sub-tiles and `surfaceAccent` only for strong selection/action emphasis.

- [ ] **Step 4: Remove patient-facing ad hoc fill values and duplicated card recipes**

As you touch files, delete any remaining patient-facing direct mixes that duplicate the new shared roles.

Concretely, do not leave patient surfaces using:

```tsx
bg-[var(--panel)]
bg-[var(--panel-muted)] // for writable fields
bg-[var(--accent-soft)] // for large neutral containers
```

unless the surface is genuinely secondary/accent by the approved spec.

- [ ] **Step 5: Re-run the focused web screen tests**

Run:

```bash
pnpm --filter @gynecology-chatbot/web exec jest \
  apps/web/src/components/mobile/MobileHomeView.test.tsx \
  apps/web/src/components/mobile/MobileChatView.test.tsx \
  apps/web/src/components/mobile/MobileRecordDayView.test.tsx \
  apps/web/src/components/mobile/MobileContentView.test.tsx \
  apps/web/src/components/mobile/MobileShell.test.tsx \
  apps/web/src/components/mobile/MobileOnboardingView.test.tsx \
  apps/web/src/components/mobile/MobileProfileView.test.tsx \
  apps/web/src/components/mobile/MobilePrimitives.test.tsx \
  --runInBand
```

Expected: PASS

- [ ] **Step 6: Run lint and type-check for the web package**

Run:

```bash
pnpm --filter @gynecology-chatbot/web lint
pnpm --filter @gynecology-chatbot/web type-check
```

Expected:
- `eslint` exits 0
- `tsc --noEmit` exits 0

- [ ] **Step 7: Commit the patient web remap**

```bash
git add \
  apps/web/src/components/mobile/MobileThemePresetButtons.tsx \
  apps/web/src/components/mobile/MobileShell.tsx \
  apps/web/src/components/mobile/MobileLoginView.tsx \
  apps/web/src/components/mobile/MobileOnboardingView.tsx \
  apps/web/src/components/mobile/MobileHomeView.tsx \
  apps/web/src/components/mobile/MobileProfileView.tsx \
  apps/web/src/components/mobile/MobileChatComposer.tsx \
  apps/web/src/components/mobile/MobileChatView.tsx \
  apps/web/src/components/mobile/ChatPartRenderer.tsx \
  apps/web/src/components/mobile/MobileRecordDayView.tsx \
  apps/web/src/components/mobile/MobileContentView.tsx \
  apps/web/src/components/mobile/MobileContentIndexView.tsx \
  apps/web/src/components/mobile/MobileHomeView.test.tsx \
  apps/web/src/components/mobile/MobileChatView.test.tsx \
  apps/web/src/components/mobile/MobileRecordDayView.test.tsx \
  apps/web/src/components/mobile/MobileContentView.test.tsx \
  apps/web/src/components/mobile/MobileShell.test.tsx

git commit -F - <<'EOF'
Apply the soft-white surface rules to patient web screens

Remap patient web cards, fields, composer surfaces, and inset blocks to the
approved semantic surface roles so large containers are white-first and tint
is limited to secondary support or accent moments.

Constraint: Must not affect admin pages or mobile API behavior
Rejected: Leave screen-level surface choices inline and ad hoc | would keep drift between screens
Confidence: high
Scope-risk: moderate
Reversibility: clean
Directive: When adding future patient web screens, start from MobileCard + shared field helpers instead of inventing new fills
Tested: Targeted mobile component Jest suite, web lint, web type-check
Not-tested: Device-browser visual QA at this stage
EOF
```

## Chunk 3: Align React Native With The Same Surface Roles

### Task 4: Add a native patient-surface helper and refactor the shared shell

**Files:**
- Modify: `apps/mobile/src/theme.ts`
- Modify: `apps/mobile/src/components/MobileScreenFrame.tsx`

- [ ] **Step 1: Introduce a native helper that names the approved surfaces**

Derive a small helper object from the existing palette instead of spreading raw `card`, `cardMuted`, and `warm` across screens:

```ts
export const patientSurfacePalette = {
  pageBackground: palette.background,
  surfacePrimary: palette.card,
  surfaceSecondary: palette.cardMuted,
  fieldSurface: palette.field,
  surfaceAccent: palette.accentSoft,
  accentSolid: palette.accent,
  strokeSubtle: palette.line,
  textPrimary: palette.ink,
  textSecondary: palette.subInk,
};
```

Keep this helper in `apps/mobile/src/theme.ts` unless the file becomes unwieldy.

- [ ] **Step 2: Route the shared RN screen frame through the helper**

Update `MobileScreenFrame.tsx` so:
- safe area uses `pageBackground`
- icon button uses `surfacePrimary`
- profile/avatar button uses a small accent/secondary surface only if still visually intentional
- FAB keeps `accentSolid`

- [ ] **Step 3: Run TS and lint checks before changing screens**

Run:

```bash
pnpm --filter @gynecology-chatbot/mobile exec tsc --noEmit
pnpm --filter @gynecology-chatbot/mobile lint
```

Expected: PASS

- [ ] **Step 4: Commit the native surface helper**

```bash
git add \
  apps/mobile/src/theme.ts \
  apps/mobile/src/components/MobileScreenFrame.tsx

git commit -F - <<'EOF'
Name the native patient surface roles before screen remapping

Introduce a compact helper over the existing native palette so patient RN
screens can consume stable surface semantics instead of mixing raw card,
warm, and accent values per screen.

Constraint: No RN theme-family redesign in this change
Rejected: Keep direct palette access in every screen | makes the soft-white rules impossible to enforce consistently
Confidence: high
Scope-risk: narrow
Reversibility: clean
Directive: Use patientSurfacePalette for patient screens; do not reintroduce warm as a default large-card fill
Tested: Mobile type-check and lint
Not-tested: Device rendering
EOF
```

### Task 5: Remap patient RN screens to the soft-white system

**Files:**
- Modify: `apps/mobile/src/screens/auth/LoginScreen.tsx`
- Modify: `apps/mobile/src/screens/onboarding/OnboardingScreen.tsx`
- Modify: `apps/mobile/src/screens/HomeScreen.tsx`
- Modify: `apps/mobile/src/screens/ProfileScreen.tsx`
- Modify: `apps/mobile/src/screens/ChatScreen.tsx`

- [ ] **Step 1: Replace writable fields with the dedicated field surface**

Any `TextInput` that currently uses inline `#ffffff` or another fill should use `patientSurfacePalette.fieldSurface`.

- [ ] **Step 2: Convert large containers to primary white surfaces**

Change the default large-card usage in:
- login / onboarding form blocks
- home hero and main cards
- profile summary/settings/logout sections
- chat assistant bubbles, composer shell, modal sheet

Prefer `surfacePrimary` unless the surface is clearly subordinate.

- [ ] **Step 3: Reduce tint usage to secondary and accent moments**

Use `surfaceSecondary` for:
- profile meta tiles
- calendar passive cells
- carousel support cards
- passive attachment framing

Use `surfaceAccent` only for:
- user bubbles
- selected or active support blocks
- attachment button if it still needs active emphasis
- non-error notice surfaces

Retire or shrink current broad usage of:
- `palette.warm`
- hard-coded `#eef6f3`
- hard-coded `#f5efe5`

- [ ] **Step 4: Run mobile lint and type-check again**

Run:

```bash
pnpm --filter @gynecology-chatbot/mobile exec tsc --noEmit
pnpm --filter @gynecology-chatbot/mobile lint
```

Expected: PASS

- [ ] **Step 5: Perform manual RN visual verification**

Run one of the local app entry points you can access in this environment:

```bash
pnpm --filter @gynecology-chatbot/mobile web
```

If simulator/device access is available, also run:

```bash
pnpm --filter @gynecology-chatbot/mobile ios
```

Manual checklist:
- login card reads white-first
- onboarding form card is white and fields are white
- home hero is white-first with only small tinted insets
- profile sections are white, meta tiles are softly tinted
- assistant chat surfaces are white, user bubble is accented
- composer input is clearly white

- [ ] **Step 6: Commit the RN screen remap**

```bash
git add \
  apps/mobile/src/screens/auth/LoginScreen.tsx \
  apps/mobile/src/screens/onboarding/OnboardingScreen.tsx \
  apps/mobile/src/screens/HomeScreen.tsx \
  apps/mobile/src/screens/ProfileScreen.tsx \
  apps/mobile/src/screens/ChatScreen.tsx

git commit -F - <<'EOF'
Align patient RN screens with the soft-white surface rules

Apply the same white-first patient surface hierarchy used on web to the
React Native login, onboarding, home, profile, and chat screens so cross-platform
patient UI feels consistent without changing behavior.

Constraint: No RN navigation, auth, or chat logic changes
Rejected: Keep current warm hero and ad hoc tinted cards | drifts from approved patient direction
Confidence: medium
Scope-risk: moderate
Reversibility: clean
Directive: Reserve accent for CTA, selection, and user-authored emphasis; keep large neutral containers on surfacePrimary
Tested: Mobile type-check, mobile lint, manual RN visual checklist
Not-tested: Automated RN UI tests (no existing harness)
EOF
```

## Chunk 4: Final Cross-App Verification And Handoff

### Task 6: Run full verification and capture remaining risks

**Files:**
- Modify: none expected unless verification exposes a defect

- [ ] **Step 1: Run the targeted patient web test suite one more time**

Run:

```bash
pnpm --filter @gynecology-chatbot/web exec jest \
  apps/web/src/components/mobile/MobilePrimitives.test.tsx \
  apps/web/src/components/mobile/MobileOnboardingView.test.tsx \
  apps/web/src/components/mobile/MobileProfileView.test.tsx \
  apps/web/src/components/mobile/MobileHomeView.test.tsx \
  apps/web/src/components/mobile/MobileChatView.test.tsx \
  apps/web/src/components/mobile/MobileRecordDayView.test.tsx \
  apps/web/src/components/mobile/MobileContentView.test.tsx \
  apps/web/src/components/mobile/MobileShell.test.tsx \
  --runInBand
```

Expected: PASS

- [ ] **Step 2: Run workspace-level lint and type-check if the environment cost is acceptable**

Run:

```bash
pnpm lint
pnpm type-check
```

Expected: PASS, or a documented pre-existing failure outside touched patient files.

- [ ] **Step 3: Confirm no admin files were touched**

Run:

```bash
git diff --name-only HEAD~3..HEAD
```

Expected: only shared theme files and patient-facing mobile web / RN files.

- [ ] **Step 4: If verification reveals regressions, fix them before handoff**

Do not stop at the first failure. Return to the relevant chunk, make the minimal fix, and re-run the failed verification command.

- [ ] **Step 5: Prepare the handoff summary**

Capture:
- changed files
- which surfaces were simplified or deleted
- which remaining risks are manual-visual only

Suggested summary structure:

```md
- Shared theme: added explicit field surface token
- Web patient UI: normalized cards to primary white surfaces and fields to dedicated white fills
- RN patient UI: removed warm-as-default large cards and aligned chat/profile/home surfaces
- Remaining risk: visual QA still matters on physical devices for RN
```

## Plan Review Notes

Manual review completed in lieu of a subagent review loop for this session.

Specific review checks already satisfied:
- no TODO/TBD placeholders in the parent spec
- scope remains patient mobile web + RN only
- no new dependencies required
- admin UI remains explicitly out of scope

## Execution Notes

- Keep diffs small and reversible.
- Prefer deletion over introducing new helper layers unless the helper is shared by 3+ patient screens.
- Do not revert unrelated dirty worktree changes.
- If visual QA shows one screen genuinely needs a slightly stronger inset tint, implement it as a secondary-surface exception, not as a new raw color literal.
