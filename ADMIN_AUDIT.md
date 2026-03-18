# Admin & User UI Audit

Date: 2026-03-18
Scope: `apps/web` admin console, mobile web user flows, admin API surface
Reference: [Vercel Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md)

## Summary

The admin console is visually coherent, but it is not an operationally complete admin surface yet.
The largest gaps are:

- missing authorization checks on some admin write APIs
- incomplete audit attribution for admin actions
- incomplete CRUD coverage across core domain entities
- weak monitoring ergonomics for real operations
- keyboard focus accessibility gaps in user-facing forms
- weak failure-state handling in chat and admin actions

The user UI is understandable and mostly reasonable in flow, but it is not fully robust from an accessibility and interaction-trust perspective.

## Audit Method

- Reviewed admin page, admin components, admin data ports, and admin API routes
- Reviewed user-facing mobile web login, onboarding, profile, content, and chat flows
- Compared UI and interaction patterns against the latest Web Interface Guidelines
- Compared admin UI surface against the current Prisma schema and admin port definitions

## Findings

### P0

1. Unauthenticated admin write endpoints

- Files:
  - `apps/web/src/app/api/admin/users/update-phone/route.ts:4`
  - `apps/web/src/app/api/admin/users/reset-password/route.ts:4`
  - `apps/web/src/app/api/admin/rag/upload/route.ts:5`
- Problem:
  - These write routes do not verify admin session state before mutating data.
  - In the same admin API namespace, week routes do verify admin auth, so the boundary is inconsistent.
- Impact:
  - Any caller that can reach these routes can attempt admin-only mutations.
- Required fix:
  - Enforce `readAdminSessionUser()` or `requireAdminSession()` on every admin write route before parsing or mutating data.

### P1

2. Admin audit actor is not the logged-in admin

- Files:
  - `apps/web/src/lib/admin/adapters/supabase-admin-dashboard-port.ts:27`
  - `apps/web/src/lib/admin/adapters/supabase-admin-dashboard-port.ts:462`
  - `apps/web/src/lib/admin/adapters/supabase-admin-dashboard-port.ts:487`
- Problem:
  - Audit logs use `ADMIN_ACTOR_USER_ID` from environment instead of the current authenticated admin.
- Impact:
  - Audit records cannot reliably answer who performed a change.
  - Multi-admin environments become operationally unsafe.
- Required fix:
  - Thread the authenticated admin identity into write operations and persist the real actor ID in audit logs.

3. Admin does not support “all CRUD”

- Files:
  - `packages/app-core/src/ports.ts:61`
  - `apps/web/src/components/AdminDashboard.tsx:35`
  - `apps/web/prisma/schema.prisma:16`
- Problem:
  - Current admin surface only supports:
    - user phone update
    - password reset
    - week read/update
    - RAG document upload
  - Large parts of the schema are not manageable from admin at all.
- Missing entity coverage includes:
  - `AIPersona`
  - `SurveyTemplate`
  - `SurveyResponse`
  - `ProactiveTriggerType`
  - `ProactiveConversation`
  - `MedicalKnowledge`
  - `WorkflowDefinition`
  - `WorkflowVersion`
  - `DocumentSource`
  - `DocumentIngestJob`
  - `SessionMemory`
- Impact:
  - The current console cannot be called a full admin system.
- Required fix:
  - Define the admin ownership matrix first, then add explicit management surfaces per entity.

4. Week editor is not true CRUD for nested data

- Files:
  - `apps/web/src/components/admin/AdminContentSection.tsx:490`
  - `apps/web/src/components/admin/AdminContentSection.tsx:620`
  - `apps/web/src/lib/admin/adapters/supabase-admin-content-port.ts:187`
- Problem:
  - Existing sections/assets do not expose delete actions in UI.
  - The backend only updates or inserts incoming rows and never removes persisted rows omitted from the payload.
- Impact:
  - Admin cannot fully manage week child content.
  - Data cleanup requires manual DB intervention.
- Required fix:
  - Add delete semantics for existing sections/assets and reconcile removed child rows server-side.

5. Monitoring view is too shallow for real operations

- Files:
  - `apps/web/src/lib/admin/adapters/supabase-admin-dashboard-port.ts:335`
  - `apps/web/src/lib/admin/adapters/supabase-admin-dashboard-port.ts:361`
  - `apps/web/src/lib/admin/adapters/supabase-admin-dashboard-port.ts:391`
  - `apps/web/src/components/admin/AdminMonitoringSection.tsx:38`
- Problem:
  - The admin monitoring surface only shows small slices:
    - recovery logs limited to 8
    - history users limited to 6
    - sessions limited to 3 per user
    - messages limited to 5 per session
    - live actions limited to 12
  - There is no search, filter, pagination, export, or incident workflow.
- Impact:
  - Useful for demos, weak for production operations.
- Required fix:
  - Add query controls, pagination, filtering, and direct drill-down by user, session, event type, and date range.

### P2

6. Admin navigation is decorative rather than real navigation

- File:
  - `apps/web/src/components/admin/AdminConsoleShell.tsx:36`
- Problem:
  - Sidebar items are buttons without routing or section jump behavior.
  - Active state is hardcoded to the first item.
- Impact:
  - Information architecture and actual behavior diverge.
  - Users may expect navigation that does not exist.
- Required fix:
  - Convert nav into real links or section anchors and synchronize active state.

7. Workflow rules are read-only

- File:
  - `apps/web/src/components/admin/AdminContentSection.tsx:669`
- Problem:
  - “Response Policies” only displays current rules.
  - No create, edit, disable, version switch, or compare action exists.
- Impact:
  - Admin cannot operate one of the most sensitive areas of product behavior.
- Required fix:
  - Add policy management actions with confirmation and audit logging.

8. User-facing forms remove default focus without replacement

- Files:
  - `apps/web/src/components/mobile/MobileLoginView.tsx:157`
  - `apps/web/src/components/mobile/MobileOnboardingView.tsx:111`
  - `apps/web/src/components/mobile/MobileProfileView.tsx:224`
  - `apps/web/src/components/mobile/MobileChatComposer.tsx:85`
- Problem:
  - Inputs use `outline-none` and do not add an equivalent visible focus treatment.
- Impact:
  - Keyboard and assistive-tech users lose clear focus location.
- Required fix:
  - Add visible `focus-visible` states across all interactive controls.

9. Chat optimistic UI can lie about send success

- File:
  - `apps/web/src/components/mobile/MobileChatView.tsx:260`
- Problem:
  - A draft user message is appended before the request finishes.
  - On failure, the draft is not marked failed or rolled back.
- Impact:
  - Users can believe a message was sent when it was not.
- Required fix:
  - Track optimistic message state and reconcile success/failure explicitly.

10. Error and async feedback is present, but not announced accessibly

- Files:
  - `apps/web/src/components/mobile/MobileLoginView.tsx:176`
  - `apps/web/src/components/mobile/MobileOnboardingView.tsx:148`
  - `apps/web/src/components/mobile/MobileProfileView.tsx:293`
  - `apps/web/src/components/mobile/MobileChatComposer.tsx:105`
- Problem:
  - Async and error messages are visually rendered but not exposed through `aria-live`.
- Impact:
  - Screen reader users may miss important state changes.
- Required fix:
  - Add `aria-live="polite"` to inline status/error regions.

## CRUD Matrix

### Users

- Create: No
- Read: Partial
- Update: Partial
- Delete: No
- Notes:
  - Phone number update exists
  - Password reset exists
  - Role, status, profile fields, and deletion are not admin-manageable

### RAG Documents / Pregnancy Documents

- Create: Yes
- Read: Partial
- Update: No
- Delete: No
- Notes:
  - Upload exists
  - List exists
  - Edit, delete, re-embed, source tracing, and ingest job tracking do not

### Pregnancy Weeks

- Create: No
- Read: Yes
- Update: Yes
- Delete: No
- Notes:
  - Base week data can be edited
  - Nested child delete is incomplete

### Workflow Rules

- Create: No
- Read: Yes
- Update: No
- Delete: No

### Monitoring / Audit / Sessions

- Create: Not applicable
- Read: Partial
- Update: Not applicable
- Delete: Not applicable
- Notes:
  - Monitoring is a thin read-only slice, not a proper operations console

## Admin UI Assessment

### What Works

- Strong visual consistency
- Clear separation between account, content, and monitoring areas
- Dense operator-oriented tone instead of consumer UI styling
- Week editor keeps related fields in one workflow context

### What Is Missing

- Real navigation model
- Search and filtering
- Bulk actions
- Destructive action confirmation flows
- Pagination and deep links
- Clear ownership boundaries between “view-only” and “editable” data
- Full entity coverage

### Operational Verdict

The admin UI is good enough as a prototype or internal pilot console.
It is not yet a complete admin system, and it is not sufficient for “all CRUD” claims.

## User UI Assessment

### What Works

- Login, onboarding, home, chat, content, and profile form a coherent user journey
- Copy is generally understandable and task-oriented
- Mobile layout is visually calm and appropriate for the domain
- Main actions are usually obvious

### Weak Points

- Keyboard focus visibility is weak or missing
- Error and async states are not announced accessibly
- Chat send failure handling is not trustworthy enough
- Some flows depend heavily on local stored session assumptions
- Navigation state is URL-driven only through `userId` query propagation, which is fragile

### User Reasonableness Verdict

From a visual and copy standpoint, the UI is mostly reasonable.
From an accessibility and interaction-reliability standpoint, it still needs work before being called solid.

## Recommended Fix Order

### Phase 1: Security and correctness

1. Add admin session checks to every admin write endpoint
2. Replace env-based admin actor logging with the authenticated admin identity
3. Add confirmation and failure handling for destructive or sensitive admin actions
4. Fix optimistic chat send reconciliation

### Phase 2: CRUD completion

5. Define which schema entities truly belong in admin scope
6. Add missing create/update/delete operations for week nested children
7. Add document edit/delete and ingest traceability
8. Add workflow rule management instead of read-only listing

### Phase 3: Operations usability

9. Add search, filtering, pagination, and direct drill-down in monitoring
10. Make admin nav real and deep-linkable
11. Improve audit log fidelity and exportability

### Phase 4: Accessibility and user trust

12. Add visible `focus-visible` states across mobile forms and controls
13. Add `aria-live` for inline async and error feedback
14. Audit touch targets, hover/focus parity, and keyboard traversal

## Verification Notes

- Static code review completed
- Runtime verification not completed in this environment
- `node`, `npm`, and `pnpm` were unavailable, so type-check and tests could not be executed here

