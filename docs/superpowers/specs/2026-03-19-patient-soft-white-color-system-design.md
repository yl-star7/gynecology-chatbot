# Patient Soft White Color System Design

**Date:** 2026-03-19

**Scope:** Patient-facing mobile surfaces only.
Includes:
- `apps/web/src/components/mobile/*`
- `apps/mobile/src/screens/*`
- shared mobile theme tokens in `packages/app-core/src/theme.ts`
- native theme access in `apps/mobile/src/theme.ts`

Excludes:
- admin web console
- backend or API behavior changes
- navigation or copy rewrites unrelated to color/surface usage

## Goal

Rework the patient-facing mobile web and React Native UI so the product reads as a soft-white interface with light theme character, instead of a screen-by-screen mix of white, muted tint, and warm accent surfaces.

The intended visual result is:
- large cards feel calm and white-first
- inputs and text-entry surfaces are clearly white
- theme tint survives as a gentle secondary layer, not the default fill everywhere
- CTA and selected states still feel active and themed

## Problem Summary

The current patient UI uses theme colors directly at component call sites, which makes surface meaning inconsistent between screens and platforms.

Observed issues:
- large cards sometimes use tinted fills (`warm`, `accentSoft`, `panelMuted`) instead of a stable primary surface
- form fields on web often use muted tinted fills instead of a true input surface
- web and RN map similar UI moments to different fills, so the same feature feels different across platforms
- components choose from raw tokens instead of semantic surface roles

This makes the interface look less clinical and less organized than intended, especially in profile, onboarding, login, home, and chat composer flows.

## Approved Direction

Use the "soft white" direction.

This means:
- major card bodies are white or near-white
- secondary tiles may use a very light theme tint
- text-entry areas are white
- accent color is reserved for actions, selection, and small highlight surfaces

This is not a neutral grayscale redesign. The background and small inset surfaces should still carry light theme character.

## Chosen Approach

Adopt a role-based surface system on top of the existing mobile color presets.

Do not redesign the theme presets from scratch.
Do not create a large new design system abstraction layer first.
Instead:
- keep the current preset families (`rose-sand`, `soft-peach`, `mint-neutral`)
- reinterpret how patient UI components consume those colors
- align web and RN around the same semantic surface roles

This is the smallest change that fixes visual inconsistency without introducing unnecessary new infrastructure.

## Surface Role Model

The patient UI should use the following semantic roles.

| Role | Web source | RN source | Usage |
| --- | --- | --- | --- |
| `pageBackground` | `bg` | `background` | App canvas and sticky page chrome background |
| `surfacePrimary` | `panelStrong` | `card` | Main card body, form card, assistant message card, modal sheet |
| `surfaceSecondary` | `panelMuted` | `cardMuted` | Secondary info tile, inset summary, passive option block |
| `fieldSurface` | white / near-white dedicated field fill | white dedicated field fill | `input`, `textarea`, `select`, chat composer input |
| `surfaceAccent` | `accentSoft` | `accentSoft` | Selected option, notice, user message bubble, deep-link card, active chip |
| `accentSolid` | `accent` | `accent` | Primary CTA, floating action button, active action |
| `strokeSubtle` | `line` | `line` | Borders between soft-white surfaces |
| `textPrimary` | `text` | `ink` | Main text |
| `textSecondary` | `textSoft` | `subInk` | Supporting text |

## Role Rules

### 1. White-first large surfaces

Any top-level card that groups meaningful content should default to `surfacePrimary`.

Examples:
- onboarding form card
- login form card
- home summary card
- profile settings card
- chat assistant bubble
- recent-session sheet

Large cards should not default to `warm` or `accentSoft`.

### 2. Tint only for inset/supporting surfaces

Use `surfaceSecondary` for small internal blocks that support a larger white card.

Examples:
- profile stat tiles
- home secondary summary tiles
- record-day subcards
- passive theme option buttons
- calendar cells or small context chips when not selected

Tint is allowed here because the surface is visually subordinate to the main card.

### 3. Text-entry is always white

All text-entry surfaces should use `fieldSurface`.

Examples:
- login phone/code fields
- onboarding inputs and textarea
- profile form inputs
- chat composer textarea
- select-style controls where text is entered or chosen

The field should feel like a clear writable surface, not a tinted decorative block.

### 4. Accent is reserved

`accentSolid` is only for:
- primary CTA buttons
- floating action buttons
- explicit active state where a strong signal is needed

`surfaceAccent` is only for:
- selected chips or selected theme buttons
- notices
- user-authored message bubble
- deep-link or actionable support cards

Accent should not be the default background for large containers.

### 5. Avoid ad hoc color literals

Patient surfaces should stop introducing one-off fills like:
- `#f5efe5`
- `#eef6f3`
- similar untracked whites/tints

If a new surface is needed, it should map back to an existing semantic role.

## Component Mapping

### Shared web mobile primitives

`apps/web/src/components/mobile/MobilePrimitives.tsx`
- `MobileCard` should represent `surfacePrimary` by default
- form helpers should make it easy to keep fields on `fieldSurface`
- notice variants should distinguish muted support vs accent notice without using the card base

`apps/web/src/app/globals.css`
- add or clarify CSS variables/classes for patient field surfaces
- reduce direct `panelMuted` usage for writable fields
- keep global background tinted but calm

### Shared RN mobile surfaces

`apps/mobile/src/theme.ts`
- expose or derive patient-facing semantic surface helpers from preset colors
- keep the existing palette source, but make component intent clearer than raw `card/cardMuted/warm`

`apps/mobile/src/components/MobileScreenFrame.tsx`
- header buttons and shared shell surfaces should align with the same white-first logic
- icon button surfaces should read as white controls
- profile shortcut/avatar can remain lightly tinted as a small accent surface

## Screen-Level Mapping

### Login

Web and RN:
- top explainer card: `surfacePrimary`
- phone/code fields: `fieldSurface`
- secondary action: border + text accent on white or transparent base
- primary action: `accentSolid`

### Onboarding

Web and RN:
- introduction card: `surfacePrimary`
- form card: `surfacePrimary`
- fields and textarea: `fieldSurface`
- theme selector inactive states: `surfaceSecondary`
- theme selector selected state: `surfaceAccent`

### Home

Web and RN:
- hero summary card: `surfacePrimary`
- supporting stat blocks inside hero: `surfaceSecondary` or one controlled light tint variant
- notebook/knowledge shortcuts: `surfacePrimary`
- calendar passive cells: `surfaceSecondary`
- selected/active day state: `surfaceAccent`

The current RN `heroCard` use of `warm` should be retired or reduced to a small inset.

### Profile

Web and RN:
- hero/profile summary card: `surfacePrimary`
- meta tiles: `surfaceSecondary`
- settings section: `surfacePrimary`
- inputs: `fieldSurface`
- logout section container: `surfacePrimary`
- destructive/non-primary actions should not default to dark `ink` fills unless a stronger contrast need is intentional

### Chat

Web and RN:
- page background stays tinted through `pageBackground`
- assistant bubbles: `surfacePrimary`
- user bubbles: `surfaceAccent`
- quick prompt chips: white or `surfacePrimary` when neutral, `surfaceAccent` when selected
- composer shell: `surfacePrimary`
- composer textarea: `fieldSurface`
- image attachment framing: `surfacePrimary` or `surfaceSecondary`, not arbitrary hard-coded fills
- carousel cards and informational subcards: `surfaceSecondary` unless they are stronger actions

## Implementation Boundaries

This work is visual and structural, not behavioral.

Allowed changes:
- token value tuning
- semantic variable additions
- component class/style remapping
- removal of hard-coded patient surface colors

Not allowed in this change:
- auth flow changes
- chat/session logic changes
- data model changes
- copy/content redesign beyond tiny supporting label adjustments if needed for layout

## Error Handling And Risk Control

Main risk is visual drift between web and RN, not logic regression.

To control that risk:
- change shared surface rules first
- apply them screen-by-screen
- avoid mixing old and new meanings in the same file once touched
- do not broaden the work into admin UI

Because this is mostly presentational:
- no behavior should change
- form submission, navigation, and chat logic must remain untouched

## Verification Criteria

The change is correct when all of the following are true:

1. Most large patient cards read as white or near-white on both web and RN.
2. All writable fields read as white text-entry surfaces.
3. Background tint remains visible at the page level.
4. Accent color is concentrated in CTA, selected state, notices, and user-authored chat surfaces.
5. Profile, onboarding, login, home, and chat feel materially more aligned between web and RN.
6. No admin UI colors change.

## Target Files

Expected touch points:
- `packages/app-core/src/theme.ts`
- `apps/web/src/app/globals.css`
- `apps/web/src/components/mobile/MobilePrimitives.tsx`
- `apps/web/src/components/mobile/MobileThemePresetButtons.tsx`
- `apps/web/src/components/mobile/MobileShell.tsx`
- `apps/web/src/components/mobile/MobileLoginView.tsx`
- `apps/web/src/components/mobile/MobileOnboardingView.tsx`
- `apps/web/src/components/mobile/MobileHomeView.tsx`
- `apps/web/src/components/mobile/MobileProfileView.tsx`
- `apps/web/src/components/mobile/MobileChatComposer.tsx`
- `apps/web/src/components/mobile/MobileChatView.tsx`
- `apps/web/src/components/mobile/ChatPartRenderer.tsx`
- `apps/mobile/src/theme.ts`
- `apps/mobile/src/components/MobileScreenFrame.tsx`
- `apps/mobile/src/screens/auth/LoginScreen.tsx`
- `apps/mobile/src/screens/onboarding/OnboardingScreen.tsx`
- `apps/mobile/src/screens/HomeScreen.tsx`
- `apps/mobile/src/screens/ProfileScreen.tsx`
- `apps/mobile/src/screens/ChatScreen.tsx`

## Non-Goals

- creating a brand-new cross-platform component system
- redesigning typography or layout hierarchy
- changing navigation patterns
- replacing the existing theme families
- introducing new dependencies

## Design Summary

The patient UI should move from "many tinted cards" to "white-first cards with selective tint."

The stable composition should be:
- tinted page background
- white primary cards
- lightly tinted secondary inset cards
- white text-entry fields
- accent only for action and selection

This preserves the product's warmth while making the interface cleaner, more medical, and easier to scan.
