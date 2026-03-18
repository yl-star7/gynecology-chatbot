# Pregnancy Companion App-Level Execution Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Supabase-backed pregnancy companion product to the clarified scope: week 1..40 knowledge DB, week-based daily checklist, chat-driven diary capture, Twilio OTP signup, scheduled push notifications, admin test tooling, and saved user theme preference.

**Architecture:** Keep `apps/web` as the main product surface for admin and mobile web UI, and keep `apps/mobile` as the Expo wrapper during this phase. Extend the existing Supabase-first schema instead of replacing it, move week content into explicit relational tables, and let admin workflows operate directly on PostgreSQL-backed content and delivery logs. Chat, diary, checklist, home, and profile all read from the same user profile and week content model so state stays consistent.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase Postgres + RLS + Storage, Twilio Verify or Messaging OTP, Expo push notifications, existing `@gynecology-chatbot/app-core` ports, Expo wrapper app, Tailwind CSS.

---

## 1. Fixed Product Decisions

- Pregnancy progress is editable as `N주 N일` and also recalculable from due date.
- The canonical content DB has actual week rows `1..40`.
- Admin edits week content and checklist content in table form on PostgreSQL-backed screens.
- Domain split is fixed:
  - week knowledge tables
  - checklist template tables
  - user checklist log tables
  - chat session/message tables
  - diary data derived and stored from conversation answers
- Checklist is week-bound and daily. Users perform the defined checklist during that week.
- Twins are out of scope.
- Onboarding/profile editable fields are due date, baby sex, baby nickname.
- Diary stores both raw chat source and summary form.
- Signup verification uses OTP SMS.
- Scheduled in-app push notifications are required.
- Admin web must be able to test notification delivery and flows.
- Home view and ChatGPT-like chat view must support quick switching via swipe and FAB.
- User theme is selectable and persisted.
- Theme palette sources:
  - rose/sand palette: [color-hex 22229](https://www.color-hex.com/color-palette/22229)
  - soft peach palette: [color-hex 1072537](https://www.color-hex.com/color-palette/1072537)
  - neutral green to mint gradient variant

## 2. Recommended Delivery Approach

### Approach A: Extend the existing `apps/web` mobile UI and keep Expo as wrapper

Recommended.

- Fastest path to product because current routes, API handlers, Supabase REST helpers, and admin dashboard already exist.
- Swipe/FAB navigation can be implemented once in the mobile web shell and reused inside Expo WebView.
- Admin tooling, OTP setup, content operations, and profile-driven rendering stay in one backend stack.

### Approach B: Rebuild the user app natively inside `apps/mobile`

Not recommended for the next slice.

- Gives better mobile interaction long-term.
- Delays delivery because every existing mobile web route and serializer needs a native equivalent.
- Doubles the immediate UI and test surface.

### Approach C: Hybrid native shell plus incremental native screens

Possible later.

- Keep web for content-heavy screens and move only chat/home/calendar first.
- Higher coordination cost than Approach A.

## 3. Scope Decomposition

This should be executed as eight implementation slices, in this order:

1. Supabase schema and seedable week content model
2. Profile and onboarding model upgrade
3. Mobile home, week content, and theme system
4. Checklist templates and daily user logs
5. Chat-driven diary capture and record timeline consolidation
6. Twilio OTP signup and reset flows
7. Scheduled push notifications and admin delivery testing
8. Admin console expansion for content, checklist, notifications, and QA

## 4. Target Information Architecture

### User surfaces

- `/`
  - mobile shell root
  - contains home panel and chat panel with swipe or FAB switching
- `/profile`
  - due date
  - baby sex
  - baby nickname
  - theme selection
  - notification opt-in and time
- `/knowledge`
  - current week knowledge landing
  - drill down to week detail
- `/notebook`
  - current week checklist and diary hub
- `/records/[isoDate]`
  - day timeline with chat summary, diary, checklist status, related session link
- `/chat/[sessionId]`
  - direct deep link for session recovery and admin QA

### Admin surfaces

- `/admin`
  - overview cards
  - content completion status
  - push delivery status
  - OTP delivery status
- `/admin/content/weeks`
  - week 1..40 row management
- `/admin/content/checklists`
  - checklist templates and items
- `/admin/content/themes`
  - theme tokens and preview
- `/admin/notifications`
  - schedule definitions
  - test send
  - delivery log
- `/admin/users`
  - search
  - profile overrides
  - notification state
- `/admin/history`
  - sessions
  - diary extraction logs
  - checklist activity

## 5. Canonical Data Model

The current migration already has `users`, `pregnancy_profiles`, `chat_sessions`, `chat_messages`, `calendar_logs`, and `pregnancy_documents`. The next migration should extend rather than replace.

### Keep and extend

- `public.users`
  - keep as account root
  - add `push_enabled`, `push_token`, `last_seen_at` if not already present in later migrations
- `public.pregnancy_profiles`
  - add first-class columns:
    - `baby_sex text check ('male','female','unknown')`
    - `baby_nickname varchar(80)`
    - `theme_key varchar(40)`
    - `notification_time time`
    - `notification_enabled boolean default true`
    - `week_override integer`
    - `day_override integer`
  - keep `onboarding_payload` only as raw capture, not as the primary query surface

### New content tables

- `public.pregnancy_weeks`
  - one row per week `1..40`
  - columns:
    - `week_number unique`
    - `title`
    - `baby_size_label`
    - `baby_size_compare_object`
    - `baby_summary`
    - `mother_summary`
    - `hero_image_path`
    - `compare_image_path`
    - `status`
    - `updated_at`
- `public.pregnancy_week_sections`
  - flexible content blocks for admin table editing
  - columns:
    - `week_id`
    - `section_key` such as `baby_appearance`, `mother_changes`, `attachment_question`, `medical_tip`
    - `title`
    - `body`
    - `display_order`
    - `is_required`
- `public.pregnancy_week_assets`
  - week image metadata if one row needs multiple image variants
  - columns:
    - `week_id`
    - `asset_type` such as `hero`, `compare`, `icon`
    - `storage_path`
    - `alt_text`
    - `style_key`

### Checklist tables

- `public.checklist_templates`
  - one or more templates per week
  - columns:
    - `id`
    - `week_number`
    - `title`
    - `description`
    - `status`
    - `is_daily`
    - `updated_at`
- `public.checklist_template_items`
  - columns:
    - `template_id`
    - `item_key`
    - `label`
    - `description`
    - `display_order`
    - `is_required`
- `public.user_checklist_logs`
  - per user per date per checklist item status
  - columns:
    - `user_id`
    - `date`
    - `week_number`
    - `template_id`
    - `item_id`
    - `status` with `pending`, `done`, `skipped`
    - `completed_at`
    - `source` with `manual`, `chat`, `system`
    - unique key on `(user_id, date, item_id)`

### Diary tables

- `public.diary_prompts`
  - week-bound prompt bank for attachment and reflection questions
  - columns:
    - `week_number`
    - `prompt_key`
    - `prompt_text`
    - `category`
    - `display_order`
- `public.diary_entries`
  - daily user-facing diary record
  - columns:
    - `user_id`
    - `date`
    - `week_number`
    - `title`
    - `summary`
    - `raw_transcript_excerpt`
    - `source_session_id`
    - `source_message_id`
    - `created_by` with `assistant`, `user`, `system`
- `public.diary_entry_sources`
  - optional N:M map when one diary entry draws from multiple chat messages
  - columns:
    - `diary_entry_id`
    - `message_id`

### Notification and OTP tables

- `public.otp_challenges`
  - phone signup and reset verification
  - columns:
    - `phone_number`
    - `purpose` with `signup`, `login`, `reset_password`
    - `provider` with `twilio`
    - `verification_sid`
    - `status`
    - `attempt_count`
    - `expires_at`
- `public.notification_schedules`
  - reusable push schedule rules
  - columns:
    - `name`
    - `schedule_type` with `daily`, `weekly`, `event`
    - `default_time`
    - `template_key`
    - `enabled`
- `public.user_notification_preferences`
  - per-user opt-in and quiet hours
  - columns:
    - `user_id`
    - `notification_enabled`
    - `schedule_id`
    - `preferred_time`
    - `timezone`
- `public.push_delivery_logs`
  - delivery audit and admin QA
  - columns:
    - `user_id`
    - `schedule_id`
    - `delivery_type` with `scheduled`, `admin_test`
    - `provider_message_id`
    - `status`
    - `payload`
    - `sent_at`

### Theme storage

Do not create a separate table unless theme catalog becomes admin-managed. For this phase:

- persist `theme_key` on `pregnancy_profiles`
- keep theme catalog as typed frontend/server config
- later promote to DB-backed `theme_presets` only if admin editing is required

## 6. API and Port Changes

### `packages/app-core/src/domain.ts`

Add or extend:

- `MobileProfileViewData`
  - `babySex`
  - `themeKey`
  - `notificationEnabled`
  - `notificationTime`
- `HomeViewData`
  - `themeKey`
  - `currentWeekHero`
  - `compareObjectLabel`
  - `todayChecklistSummary`
- new types:
  - `WeekKnowledgeView`
  - `ChecklistTemplate`
  - `ChecklistDayLog`
  - `DiaryEntry`
  - `ThemeOption`
  - `NotificationTestResult`

### `packages/app-core/src/ports.ts`

Extend with:

- `KnowledgePort.getCurrentWeekContent()`
- `ChecklistPort.getChecklistForDate()`
- `ChecklistPort.updateChecklistItem()`
- `DiaryPort.listDiaryEntriesForDate()`
- `DiaryPort.saveDiaryEntryFromChat()`
- `NotificationPort.getPreferences()`
- `NotificationPort.updatePreferences()`
- `AdminContentPort`
- `AdminNotificationPort`
- `OtpPort`

### Web API routes to add

- `apps/web/src/app/api/mobile/checklists/route.ts`
- `apps/web/src/app/api/mobile/checklists/[isoDate]/route.ts`
- `apps/web/src/app/api/mobile/diary/route.ts`
- `apps/web/src/app/api/mobile/otp/request/route.ts`
- `apps/web/src/app/api/mobile/otp/verify/route.ts`
- `apps/web/src/app/api/mobile/notifications/route.ts`
- `apps/web/src/app/api/admin/content/weeks/route.ts`
- `apps/web/src/app/api/admin/content/checklists/route.ts`
- `apps/web/src/app/api/admin/notifications/test/route.ts`
- `apps/web/src/app/api/admin/notifications/logs/route.ts`

## 7. UI System Plan

### Theme tokens

Create theme presets in `apps/web/src/components/mobile` or `apps/web/src/lib/mobile`:

- `rose-sand`
- `soft-peach`
- `mint-neutral`

Each preset should define:

- shell background
- card background
- text primary
- text secondary
- accent
- success
- warning
- calendar selected state
- FAB gradient

### Mobile navigation behavior

Recommended:

- keep current route-based pages for deep links and admin QA
- add a root mobile shell controller that supports:
  - horizontal swipe between home and chat
  - persistent FAB to jump to chat composer
  - route sync so refresh still works

Implementation target:

- modify [`MobileShell.tsx`](/Users/jskang/si/gynecology-chatbot/apps/web/src/components/mobile/MobileShell.tsx)
- update [`MobileHomeView.tsx`](/Users/jskang/si/gynecology-chatbot/apps/web/src/components/mobile/MobileHomeView.tsx)
- update [`MobileChatView.tsx`](/Users/jskang/si/gynecology-chatbot/apps/web/src/components/mobile/MobileChatView.tsx)

### Week content presentation

Home should show:

- current week label
- baby compare object
- week hero illustration
- 2 to 4 structured content sections
- today checklist completion bar
- quick diary prompt or latest saved diary

## 8. Admin Console Plan

The current [`AdminDashboard.tsx`](/Users/jskang/si/gynecology-chatbot/apps/web/src/components/AdminDashboard.tsx) is too coarse for the clarified scope. Expand it into feature panels instead of a single giant screen.

Recommended split:

- `AdminDashboardShell.tsx`
- `AdminWeekContentTable.tsx`
- `AdminChecklistTable.tsx`
- `AdminNotificationPanel.tsx`
- `AdminUserSearchPanel.tsx`
- `AdminHistoryPanel.tsx`
- `AdminThemePreviewPanel.tsx`

Admin capabilities required in this phase:

- create and edit week 1..40 rows
- upload and assign week images to Supabase Storage
- edit section blocks in table form
- edit checklist templates and items
- inspect per-user checklist completion
- inspect diary entry extraction and linked session/message
- fire test push to a selected user
- inspect push delivery logs
- trigger OTP send to QA number in non-production mode
- inspect content completeness coverage by week

## 9. Implementation Tasks

## Chunk 1: Schema and Seed Model

### Task 1: Add the missing relational week-content schema

**Files:**
- Create: `supabase/migrations/20260317_add_week_content_checklist_diary_notification_schema.sql`
- Modify: `docs/reference/DATABASE_SCHEMA.md`
- Test: SQL validation against existing schema expectations

- [ ] Review existing tables in `20260314_create_session_based_core_schema.sql` and `20251223_extend_schema.sql`.
- [ ] Add new tables for `pregnancy_weeks`, `pregnancy_week_sections`, `pregnancy_week_assets`, `checklist_templates`, `checklist_template_items`, `user_checklist_logs`, `diary_prompts`, `diary_entries`, `diary_entry_sources`, `otp_challenges`, `notification_schedules`, `user_notification_preferences`, and `push_delivery_logs`.
- [ ] Extend `pregnancy_profiles` with `baby_sex`, `baby_nickname`, `theme_key`, `notification_time`, `notification_enabled`, `week_override`, and `day_override`.
- [ ] Add indexes for week lookup, date lookup, and admin audit lookup.
- [ ] Add RLS policies for user-owned logs and admin-only operations.
- [ ] Seed immutable `pregnancy_weeks` rows `1..40`.
- [ ] Update schema documentation after the SQL is settled.

### Task 2: Define storage and image conventions

**Files:**
- Modify: `docs/reference/DATABASE_SCHEMA.md`
- Modify: `supabase/migrations/20260317_add_week_content_checklist_diary_notification_schema.sql`

- [ ] Define storage bucket names for week images and diary media.
- [ ] Define naming convention for week images so admin upload does not create duplicate ambiguous keys.
- [ ] Add storage policy notes for admin upload and public read strategy.

## Chunk 2: Domain Contracts and Server Adapters

### Task 3: Expand app-core domain contracts

**Files:**
- Modify: `packages/app-core/src/domain.ts`
- Modify: `packages/app-core/src/ports.ts`
- Modify: `packages/app-core/src/index.ts`
- Modify: `packages/app-core/src/testing.ts`

- [ ] Add types for week content, checklist, diary, OTP, notification preference, and theme selection.
- [ ] Extend existing profile and home DTOs.
- [ ] Add new ports for checklist, diary, notifications, OTP, and admin content.
- [ ] Update test fixtures so mock screens still compile.

### Task 4: Add Supabase-backed service adapters

**Files:**
- Create: `apps/web/src/lib/mobile/checklists.ts`
- Create: `apps/web/src/lib/mobile/diary.ts`
- Create: `apps/web/src/lib/mobile/notifications.ts`
- Create: `apps/web/src/lib/mobile/otp.ts`
- Modify: `apps/web/src/lib/mobile/auth.ts`
- Modify: `apps/web/src/lib/mobile/serializers.ts`

- [ ] Keep REST adapter style consistent with `supabase-rest.ts`.
- [ ] Centralize week calculation so due date and manual override produce one canonical value.
- [ ] Add serializer helpers for diary summary extraction and checklist completion rollups.

## Chunk 3: Mobile Profile and Theme Foundation

### Task 5: Upgrade onboarding and profile editing

**Files:**
- Modify: `apps/web/src/app/api/mobile/onboarding/route.ts`
- Modify: `apps/web/src/app/api/mobile/profile/route.ts`
- Modify: `apps/web/src/components/mobile/MobileOnboardingView.tsx`
- Modify: `apps/web/src/components/mobile/MobileProfileView.tsx`

- [ ] Add editable fields for due date, baby sex, baby nickname, theme, notification enabled, and notification time.
- [ ] Persist fields on `pregnancy_profiles`.
- [ ] Preserve backward compatibility with existing onboarding payload reads until migration is complete.

### Task 6: Add theme tokens and persistence wiring

**Files:**
- Create: `apps/web/src/lib/mobile/themes.ts`
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/src/components/mobile/MobileShell.tsx`
- Modify: `apps/web/src/components/mobile/MobileProfileView.tsx`

- [ ] Define the three approved theme presets.
- [ ] Apply theme variables at shell level.
- [ ] Read saved `theme_key` from profile payload and persist changes through profile update route.

## Chunk 4: Home, Week Content, and Navigation

### Task 7: Replace placeholder home cards with week-aware content

**Files:**
- Modify: `apps/web/src/app/api/mobile/home/route.ts`
- Modify: `apps/web/src/components/mobile/MobileHomeView.tsx`
- Create: `apps/web/src/app/api/mobile/knowledge/current-week/route.ts`

- [ ] Join profile week data with `pregnancy_weeks` and `pregnancy_week_sections`.
- [ ] Surface baby compare object, hero image, mother summary, and attachment prompt.
- [ ] Show checklist completion summary and latest diary summary snippet.

### Task 8: Add swipe and FAB switching between home and chat

**Files:**
- Modify: `apps/web/src/components/mobile/MobileShell.tsx`
- Modify: `apps/web/src/components/mobile/MobileChatView.tsx`
- Modify: `apps/web/src/app/page.tsx`

- [ ] Add a small two-panel controller instead of separate isolated views.
- [ ] Keep deep links to `/chat/[sessionId]` working.
- [ ] Make FAB always available on home and records screens.

## Chunk 5: Checklist and Diary

### Task 9: Implement week-based daily checklist

**Files:**
- Create: `apps/web/src/app/api/mobile/checklists/route.ts`
- Create: `apps/web/src/app/api/mobile/checklists/[isoDate]/route.ts`
- Create: `apps/web/src/components/mobile/MobileChecklistCard.tsx`
- Modify: `apps/web/src/components/mobile/MobileHomeView.tsx`
- Modify: `apps/web/src/components/mobile/MobileRecordDayView.tsx`

- [ ] Resolve current week from profile.
- [ ] Load all active checklist items for the week.
- [ ] Upsert per-day completion state into `user_checklist_logs`.
- [ ] Reflect checklist state on calendar day detail.

### Task 10: Implement chat-derived diary storage

**Files:**
- Create: `apps/web/src/app/api/mobile/diary/route.ts`
- Modify: `apps/web/src/app/api/mobile/chat/route.ts`
- Modify: `apps/web/src/app/api/mobile/records/route.ts`
- Create: `apps/web/src/lib/mobile/diary.ts`

- [ ] Define which prompts or answer tags create diary entries.
- [ ] Save raw excerpt and summary form together.
- [ ] Link diary entries back to session and message ids.
- [ ] Expose diary rows in day-record APIs and calendar summaries.

## Chunk 6: OTP and Authentication

### Task 11: Add Twilio OTP request and verification flow

**Files:**
- Create: `apps/web/src/app/api/mobile/otp/request/route.ts`
- Create: `apps/web/src/app/api/mobile/otp/verify/route.ts`
- Modify: `apps/web/src/lib/mobile/auth.ts`
- Modify: `apps/web/src/components/mobile/MobileLoginView.tsx`
- Modify: `apps/web/src/components/mobile/MobileSetPasswordView.tsx`
- Modify: `.env.example`

- [ ] Add Twilio env names without hardcoded URLs or secrets.
- [ ] Persist OTP challenge lifecycle in `otp_challenges`.
- [ ] Gate account activation on OTP verification success.
- [ ] Reuse the same mechanism for password reset.

## Chunk 7: Push Notifications and Admin Testing

### Task 12: Add user push preference and scheduled send support

**Files:**
- Create: `apps/web/src/app/api/mobile/notifications/route.ts`
- Create: `apps/web/src/lib/mobile/notifications.ts`
- Modify: `apps/mobile/src/web/EmbeddedWebContent.native.tsx`
- Modify: `apps/mobile/src/web/EmbeddedWebContent.web.tsx`
- Modify: `apps/mobile/app/index.tsx`

- [ ] Register Expo push token from the wrapper app.
- [ ] Save push token and preference state to Supabase.
- [ ] Define a server-side schedule executor contract.
- [ ] Add an initial daily notification schedule for checklist or diary nudges.

### Task 13: Add admin test-send and delivery inspection

**Files:**
- Create: `apps/web/src/app/api/admin/notifications/test/route.ts`
- Create: `apps/web/src/app/api/admin/notifications/logs/route.ts`
- Modify: `apps/web/src/components/AdminDashboard.tsx` or split components under `apps/web/src/components/admin/`
- Modify: `apps/web/src/lib/admin/adapters/supabase-admin-dashboard-port.ts`

- [ ] Allow admin to select a user and trigger a test send.
- [ ] Record test sends in `push_delivery_logs` as `admin_test`.
- [ ] Surface delivery result and recent failures in the admin console.

## Chunk 8: Admin Content Operations

### Task 14: Build week-content CRUD screens

**Files:**
- Create: `apps/web/src/app/api/admin/content/weeks/route.ts`
- Create: `apps/web/src/app/api/admin/content/checklists/route.ts`
- Create: `apps/web/src/components/admin/AdminWeekContentTable.tsx`
- Create: `apps/web/src/components/admin/AdminChecklistTable.tsx`
- Create: `apps/web/src/components/admin/AdminNotificationPanel.tsx`
- Modify: `apps/web/src/components/AdminDashboard.tsx`

- [ ] Make week 1..40 visible as rows with completion state.
- [ ] Allow inline editing of summaries, compare objects, and image paths.
- [ ] Allow checklist template and item editing.
- [ ] Record changes into `admin_audit_logs`.

## 10. Testing Plan

- Database:
  - validate new migration against the current Supabase project
  - verify RLS for user-owned logs and admin-only content editing
- Web server:
  - route tests for profile, checklist, diary, OTP, and notification APIs
  - serializer tests for week calculation and diary extraction
- UI:
  - mobile home rendering by week
  - theme switching persistence
  - checklist toggle optimistic update
  - admin content table editing
- Wrapper app:
  - push token registration handshake
  - notification permission handling

## 11. Risks and Constraints

- Existing mobile web routes already read from `pregnancy_profiles.onboarding_payload`; migrations must remain backward compatible until all readers switch to first-class columns.
- Admin dashboard is currently one large component. Splitting it should happen as part of the feature work, not as a separate refactor.
- Scheduled push requires an execution surface. If Supabase cron is used, keep payload generation inside server-owned code and record every send attempt.
- Week images need one consistent visual style across 40 weeks. Storage schema must assume re-upload and version replacement.

## 12. First Execution Slice

Start with these deliverables before any UI expansion:

- new migration for week content, checklist, diary, OTP, and push tables
- `pregnancy_profiles` field extension
- `packages/app-core` domain contract expansion
- minimal admin read endpoint for week 1..40 content

That slice unlocks all later screens without repainting the data model twice.
