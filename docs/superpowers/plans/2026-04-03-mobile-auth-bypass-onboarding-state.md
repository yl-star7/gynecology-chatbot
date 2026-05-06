# Mobile Auth Bypass Onboarding State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 개발용 인증번호 우회는 SMS 검증만 생략하고, 사용자/세션/온보딩 상태 판정은 실제 API 로그인과 동일하게 유지한다.

**Architecture:** 서버의 `completePhoneSignIn`는 그대로 인증 검증 provider만 우회하고, 최종 라우팅 판단은 `getAuthenticatedUser()` 결과에만 의존한다. 회귀는 서버 단위 테스트에서 신규 사용자와 기존 온보딩 완료 사용자를 분리해 검증하고, 로컬 실행 기본 env는 이미 반영된 `dev:d`를 사용한다.

**Tech Stack:** Next.js route handlers, Jest, Expo mobile app, local docker data provider

---

### Task 1: Reproduce the current auth bypass test failure

**Files:**
- Modify: `apps/web/src/lib/mobile/auth.testmode-login.test.ts`
- Test: `apps/web/src/lib/mobile/auth.testmode-login.test.ts`

- [ ] **Step 1: Write the failing test setup for onboarding-state-sensitive bypass login**

```ts
test("returns hasCompletedOnboarding false for bypass login when no pregnancy profile exists", async () => {
  mockedlegacyBackendSelect.mockReset();
  mockedlegacyBackendInsert.mockReset();
  mockedlegacyBackendUpdate.mockReset();
  mockedCheckSmsVerification.mockReset();

  mockedlegacyBackendUpdate.mockResolvedValue([]);
  mockedlegacyBackendInsert.mockResolvedValue([]);
  mockedlegacyBackendSelect
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([
      {
        id: "user-1",
        phone_number_encrypted: "enc:+821012345678",
        phone_number_last4: "5678",
        account_status: "active",
        phone_verified_at: "2026-03-19T00:00:00.000Z",
        last_login_at: "2026-03-19T00:00:00.000Z",
      },
    ])
    .mockResolvedValueOnce([]);

  const result = await completePhoneSignIn("01012345678", "000000");

  expect(result.user.hasCompletedOnboarding).toBe(false);
  expect(mockedCheckSmsVerification).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "/Users/jskang/Projects/si" && pnpm --filter @gynecology-chatbot/web test -- auth.testmode-login.test.ts`
Expected: FAIL with the current mocked legacyBackend builder/response order not matching `auth.ts` query flow.

- [ ] **Step 3: Write minimal test harness fixes so the test exercises real auth flow**

```ts
jest.mock("@/lib/legacyBackend/admin-client", () => ({
  legacyBackendInsert: jest.fn(),
  legacyBackendSelect: jest.fn(),
  legacyBackendUpdate: jest.fn(),
  getlegacyBackendAdminClient: jest.fn(() => ({
    from: jest.fn((table: string) => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          limit: jest.fn(async () => ({ data: nextRows(table), error: null })),
        })),
      })),
      insert: jest.fn(async () => ({ data: [], error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(async () => ({ data: [], error: null })),
      })),
    })),
  })),
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd "/Users/jskang/Projects/si" && pnpm --filter @gynecology-chatbot/web test -- auth.testmode-login.test.ts`
Expected: PASS for the new `hasCompletedOnboarding false` test, with no Twilio check call.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/mobile/auth.testmode-login.test.ts
git commit -m "test: cover auth bypass onboarding state"
```

### Task 2: Lock in the two valid bypass outcomes

**Files:**
- Modify: `apps/web/src/lib/mobile/auth.testmode-login.test.ts`
- Test: `apps/web/src/lib/mobile/auth.testmode-login.test.ts`

- [ ] **Step 1: Write the failing test for onboarding-complete bypass login**

```ts
test("returns hasCompletedOnboarding true for bypass login when pregnancy profile exists", async () => {
  mockedlegacyBackendSelect.mockReset();
  mockedlegacyBackendInsert.mockReset();
  mockedlegacyBackendUpdate.mockReset();
  mockedCheckSmsVerification.mockReset();

  mockedlegacyBackendUpdate.mockResolvedValue([]);
  mockedlegacyBackendInsert.mockResolvedValue([]);
  mockedlegacyBackendSelect
    .mockResolvedValueOnce([
      {
        id: "user-1",
        phone_number_encrypted: "enc:+821012345678",
        phone_number_last4: "5678",
        account_status: "active",
        phone_verified_at: "2026-03-19T00:00:00.000Z",
        last_login_at: "2026-03-19T00:00:00.000Z",
      },
    ])
    .mockResolvedValueOnce([
      {
        id: "user-1",
        phone_number_encrypted: "enc:+821012345678",
        phone_number_last4: "5678",
        account_status: "active",
        phone_verified_at: "2026-03-19T00:00:00.000Z",
        last_login_at: "2026-03-19T00:00:00.000Z",
      },
    ])
    .mockResolvedValueOnce([
      {
        user_id: "user-1",
        due_date: "2026-10-01",
        onboarding_payload: {
          tonePreference: "차분하게",
          pregnancyWeekOrDueDate: "2026-10-01",
        },
      },
    ]);

  const result = await completePhoneSignIn("01012345678", "000000");

  expect(result.user.hasCompletedOnboarding).toBe(true);
  expect(mockedCheckSmsVerification).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "/Users/jskang/Projects/si" && pnpm --filter @gynecology-chatbot/web test -- auth.testmode-login.test.ts`
Expected: FAIL until the test file consistently mirrors the production query order for existing-user + profile lookup.

- [ ] **Step 3: Write minimal test data helpers for query-order-specific rows**

```ts
function queueSelectRows(...rows: unknown[][]) {
  mockedlegacyBackendSelect.mockReset();
  for (const result of rows) {
    mockedlegacyBackendSelect.mockResolvedValueOnce(result as never);
  }
}
```

```ts
queueSelectRows(
  [existingUser],
  [existingUser],
  [completedProfile],
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd "/Users/jskang/Projects/si" && pnpm --filter @gynecology-chatbot/web test -- auth.testmode-login.test.ts`
Expected: PASS for both bypass outcomes — incomplete onboarding stays false, completed onboarding stays true.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/mobile/auth.testmode-login.test.ts
git commit -m "test: distinguish bypass onboarding outcomes"
```

### Task 3: Verify mobile routing still follows authenticated user state

**Files:**
- Modify: `apps/mobile/src/core/MobileAppSessionProvider.tsx` (only if testability requires export changes)
- Test: `apps/web/src/lib/mobile/auth.testmode-login.test.ts`
- Test: existing API smoke calls against `app/api/mobile/auth/login`

- [ ] **Step 1: Write the failing expectation for route-driving user state**

```ts
expect(result.user.hasCompletedOnboarding).toBe(false);
expect(result.user.hasCompletedOnboarding).toBe(true);
```

```tsx
const nextUser = await services.authPort.signInWithPhoneVerification(input);
setCurrentUser(nextUser);
return nextUser;
```

- [ ] **Step 2: Run focused tests and API verification to confirm current failure or coverage gap**

Run: `cd "/Users/jskang/Projects/si" && pnpm --filter @gynecology-chatbot/web test -- auth.testmode-login.test.ts`
Expected: If the server tests pass, the returned user state is sufficient for `LoginScreen.tsx` routing (`router.replace(user.hasCompletedOnboarding ? "/home" : "/onboarding")`).

- [ ] **Step 3: Write minimal production change only if tests prove user state is wrong**

```ts
const nextUser = await getAuthenticatedUser(userId);
if (!nextUser) {
  throw new Error("로그인 사용자 정보를 확인하지 못했습니다.");
}

return {
  user: nextUser,
  sessionToken,
};
```

- [ ] **Step 4: Run verification tests and API checks**

Run: `cd "/Users/jskang/Projects/si" && pnpm --filter @gynecology-chatbot/web test -- auth.testmode-login.test.ts && curl -s -o /tmp/mobile-login.json -w "%{http_code}" -X POST "http://localhost:3005/api/mobile/auth/login" -H "Content-Type: application/json" --data '{"phoneNumber":"01012345678","verificationCode":"000000"}'`
Expected: Jest passes and curl returns `200` with a user payload whose `hasCompletedOnboarding` reflects the DB-backed profile state.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/mobile/auth.ts apps/web/src/lib/mobile/auth.testmode-login.test.ts
git commit -m "fix: keep onboarding state in auth bypass"
```

### Task 4: Verify local developer workflow stays documented and usable

**Files:**
- Modify: `package.json`
- Modify: `.env.example`
- Test: `apps/mobile/package-config.test.mjs`

- [ ] **Step 1: Write the failing config assertions if not already present**

```js
assert.match(devDockerScript, /MOBILE_AUTH_TEST_MODE=true/);
assert.match(devDockerScript, /EXPO_PUBLIC_MOBILE_DATA_PROVIDER=api/);
assert.match(envExample, /^MOBILE_AUTH_TEST_MODE=true$/m);
assert.match(envExample, /^EXPO_PUBLIC_MOBILE_DATA_PROVIDER=api$/m);
```

- [ ] **Step 2: Run test to verify it fails when config drifts**

Run: `cd "/Users/jskang/Projects/si/apps/mobile" && pnpm test:config`
Expected: FAIL if the root script or env example no longer includes the required local auth bypass settings.

- [ ] **Step 3: Keep the minimal config values in place**

```json
"dev:d": "SERVER_DATA_PROVIDER=docker ADMIN_DATA_PROVIDER=backend EXPO_PUBLIC_MOBILE_DATA_PROVIDER=api MOBILE_AUTH_TEST_MODE=true ..."
```

```env
EXPO_PUBLIC_MOBILE_DATA_PROVIDER=api
MOBILE_AUTH_TEST_MODE=true
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd "/Users/jskang/Projects/si/apps/mobile" && pnpm test:config`
Expected: PASS with 5/5 passing tests.

- [ ] **Step 5: Commit**

```bash
git add package.json .env.example apps/mobile/package-config.test.mjs
git commit -m "test: lock local mobile auth env"
```

## Self-Review

- Spec coverage: Covers the approved scope only — bypass skips SMS verification, but onboarding completion still comes from authenticated user/profile state.
- Placeholder scan: No TBD/TODO placeholders remain; every task includes file paths, code, commands, and expected results.
- Type consistency: Uses existing `completePhoneSignIn`, `getAuthenticatedUser`, `MobileAppSessionProvider`, and `hasCompletedOnboarding` names consistently across all tasks.
