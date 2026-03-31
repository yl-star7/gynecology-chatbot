# Web Onboarding BabyNickname Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 웹 온보딩이 예정일과 태명을 분리된 필드로 전송하고 서버가 이를 그대로 저장하도록 맞춘다.

**Architecture:** 공용 온보딩 입력 타입에 `babyNickname` optional 필드를 추가하고, 웹 온보딩 뷰는 기존의 문자열 합치기를 제거한다. 모바일 앱의 기존 동작은 유지한 채 웹 API client, 모바일 온보딩 route, auth 저장 로직, 회귀 테스트를 함께 갱신한다.

**Tech Stack:** TypeScript, Next.js route handlers, Jest, Testing Library, shared app-core types

---

### Task 1: Shared onboarding input type 확장

**Files:**
- Modify: `packages/app-core/src/domain.ts:224-228`
- Test: 없음 (후속 consumer 테스트로 검증)

- [ ] **Step 1: 타입 사용처 확인**

Run: `grep -R "OnboardingProfileInput\|pregnancyWeekOrDueDate" packages/app-core/src apps/web/src apps/mobile/src`
Expected: 웹/모바일 온보딩 입력 경로가 보인다.

- [ ] **Step 2: `OnboardingProfileInput`에 `babyNickname` 추가**

```ts
export interface OnboardingProfileInput {
  pregnancyWeekOrDueDate: string;
  tonePreference: string;
  babyNickname?: string | null;
  themeKey?: MobileThemeKey | null;
}
```

- [ ] **Step 3: 타입 체크 범위 확인용 테스트 커맨드 준비**

Run: `pnpm --filter @gynecology-chatbot/web test -- --runInBand app/api/mobile/onboarding/route.test.ts src/components/mobile/MobileOnboardingView.test.tsx`
Expected: 아직 실패 가능. 이후 태스크에서 green으로 만든다.

- [ ] **Step 4: Commit**

```bash
git add packages/app-core/src/domain.ts
git commit -m "refactor: extend onboarding input with baby nickname"
```

### Task 2: 웹 온보딩 뷰가 분리된 필드로 전송하도록 변경

**Files:**
- Modify: `apps/web/src/components/mobile/MobileOnboardingView.tsx:58-69`
- Modify: `apps/web/src/components/mobile/MobileOnboardingView.test.tsx`
- Modify: `apps/web/src/lib/mobile/web-mobile-api.ts:324-339`

- [ ] **Step 1: 웹 온보딩 view test에 failing test 추가**

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { completeOnboarding } from "@/lib/mobile/web-mobile-api";

it("예정일과 태명을 분리된 필드로 전송한다", async () => {
  const mockedCompleteOnboarding = jest.mocked(completeOnboarding);
  mockedCompleteOnboarding.mockResolvedValue({
    user: {
      id: "user-1",
      displayName: "김수연",
      phoneNumber: "01012345678",
      hasCompletedOnboarding: true,
    },
  });

  render(<MobileOnboardingView userId="user-1" />);

  fireEvent.change(screen.getByLabelText?.("출산 예정일") ?? screen.getByDisplayValue(""), {
    target: { value: "2026-08-15" },
  });
  fireEvent.click(screen.getByRole("button", { name: "다음" }));
  fireEvent.change(screen.getByPlaceholderText("예: 콩이, 달이"), {
    target: { value: "콩이" },
  });
  fireEvent.click(screen.getByRole("button", { name: "다음" }));
  fireEvent.click(screen.getByRole("button", { name: "차분하게" }));
  fireEvent.click(screen.getByRole("button", { name: "다음" }));
  fireEvent.click(screen.getByRole("button", { name: "시작하기" }));

  await waitFor(() => {
    expect(mockedCompleteOnboarding).toHaveBeenCalledWith({
      userId: "user-1",
      pregnancyWeekOrDueDate: "2026-08-15",
      babyNickname: "콩이",
      tonePreference: "차분하게",
      themeKey: "rose-sand",
    });
  });
});
```

- [ ] **Step 2: failing test 실행**

Run: `pnpm --filter @gynecology-chatbot/web test -- src/components/mobile/MobileOnboardingView.test.tsx`
Expected: FAIL, 현재는 `pregnancyWeekOrDueDate: "2026-08-15 / 태명: 콩이"`로 호출됨

- [ ] **Step 3: 웹 API client 입력 타입 확장**

```ts
export async function completeOnboarding(input: {
  userId: string;
  pregnancyWeekOrDueDate: string;
  tonePreference: string;
  babyNickname?: string | null;
  themeKey?: MobileThemeKey | null;
}) {
```

- [ ] **Step 4: 웹 온보딩 뷰의 전송 payload 수정**

```ts
const payload = await completeOnboarding({
  userId: userId!,
  pregnancyWeekOrDueDate: dueDate,
  babyNickname: babyNickname.trim() || null,
  tonePreference: tonePreference || "친근하게",
  themeKey,
});
```

- [ ] **Step 5: view test 재실행**

Run: `pnpm --filter @gynecology-chatbot/web test -- src/components/mobile/MobileOnboardingView.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/mobile/MobileOnboardingView.tsx apps/web/src/components/mobile/MobileOnboardingView.test.tsx apps/web/src/lib/mobile/web-mobile-api.ts
git commit -m "refactor: send baby nickname separately from web onboarding"
```

### Task 3: 모바일 온보딩 route가 `babyNickname`을 읽고 전달하도록 변경

**Files:**
- Modify: `apps/web/app/api/mobile/onboarding/route.ts:11-62`
- Modify: `apps/web/app/api/mobile/onboarding/route.test.ts:98-135`

- [ ] **Step 1: route test를 실제 계약으로 바꾸는 failing test 작성**

```ts
it("태명을 별도 필드로 받아 onboarding 완료 후 200 반환", async () => {
  mockedRequireMobileSession.mockResolvedValue({ userId: "user-1" } as never);
  mockedCompleteUserOnboarding.mockResolvedValue({
    id: "user-1",
    displayName: "김수연",
    phoneNumber: "01012345678",
    hasCompletedOnboarding: true,
  } as never);

  const response = await POST(
    new Request("http://localhost:3000/api/mobile/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "user-1",
        pregnancyWeekOrDueDate: "2026-08-15",
        babyNickname: "콩이",
        tonePreference: "calm",
      }),
    }) as never,
  );

  expect(response.status).toBe(200);
  expect(mockedCompleteUserOnboarding).toHaveBeenCalledWith({
    userId: "user-1",
    pregnancyWeekOrDueDate: "2026-08-15",
    babyNickname: "콩이",
    tonePreference: "calm",
    dueDate: "2026-08-15",
    themeKey: "rose-sand",
  });
});
```

- [ ] **Step 2: route test 실행**

Run: `pnpm --filter @gynecology-chatbot/web test -- app/api/mobile/onboarding/route.test.ts`
Expected: FAIL, `babyNickname`이 전달되지 않음

- [ ] **Step 3: route에서 `babyNickname` 읽어 auth로 전달**

```ts
const babyNickname =
  typeof body.babyNickname === "string" ? body.babyNickname.trim() : "";

const user = await completeUserOnboarding({
  userId,
  pregnancyWeekOrDueDate,
  babyNickname: babyNickname || null,
  tonePreference,
  dueDate: extractedDueDate || null,
  themeKey: themeKey || DEFAULT_MOBILE_THEME_KEY,
});
```

- [ ] **Step 4: route test 재실행**

Run: `pnpm --filter @gynecology-chatbot/web test -- app/api/mobile/onboarding/route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/api/mobile/onboarding/route.ts apps/web/app/api/mobile/onboarding/route.test.ts
git commit -m "refactor: pass baby nickname through onboarding route"
```

### Task 4: auth 저장 로직이 babyNickname을 실제 payload에 반영하도록 변경

**Files:**
- Modify: `apps/web/src/lib/mobile/auth.ts:586-616`
- Modify: `apps/web/src/lib/mobile/auth.test.ts`

- [ ] **Step 1: auth 단위 테스트 failing case 추가**

```ts
test("completeUserOnboarding stores babyNickname in first-class column and onboarding payload", async () => {
  mockedSupabaseSelect
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
    .mockResolvedValueOnce([])
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
    .mockResolvedValueOnce([
      {
        id: "profile-1",
        user_id: "user-1",
        display_name: "김수연",
        onboarding_payload: null,
        due_date: "2026-08-15",
        baby_nickname: "콩이",
        notification_time: "08:30",
        theme_key: "rose-sand",
      },
    ]);
  mockedSupabaseInsert.mockResolvedValue([]);

  await completeUserOnboarding({
    userId: "user-1",
    pregnancyWeekOrDueDate: "2026-08-15",
    babyNickname: "콩이",
    tonePreference: "차분하게",
    dueDate: "2026-08-15",
    themeKey: "rose-sand",
  });

  expect(mockedSupabaseInsert).toHaveBeenCalledWith(
    "pregnancy_profiles",
    expect.objectContaining({
      baby_nickname: "콩이",
      onboarding_payload: expect.objectContaining({
        babyNickname: "콩이",
      }),
    }),
  );
});
```

- [ ] **Step 2: failing test 실행**

Run: `pnpm --filter @gynecology-chatbot/web test -- src/lib/mobile/auth.test.ts`
Expected: FAIL, 현재 `inputBabyNickname: null`로 고정됨

- [ ] **Step 3: `completeUserOnboarding` 입력과 payload 연결 수정**

```ts
export async function completeUserOnboarding(input: {
  userId: string;
  pregnancyWeekOrDueDate: string;
  babyNickname?: string | null;
  tonePreference: string;
  dueDate?: string | null;
  themeKey?: string | null;
}) {
  // ...
  const payload = buildPregnancyProfilePayload({
    pregnancyMetrics: metrics,
    dueDate: metrics.dueDate,
    pregnancyWeekOrDueDate: input.pregnancyWeekOrDueDate ?? null,
    tonePreference: input.tonePreference,
    inputBabyNickname: input.babyNickname ?? null,
    inputHospitalName: null,
    inputNotificationTime: "08:30",
    inputThemeKey: input.themeKey ?? DEFAULT_MOBILE_THEME_KEY,
  });
```

- [ ] **Step 4: auth test 재실행**

Run: `pnpm --filter @gynecology-chatbot/web test -- src/lib/mobile/auth.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/mobile/auth.ts apps/web/src/lib/mobile/auth.test.ts
git commit -m "feat: persist baby nickname during onboarding"
```

### Task 5: 관련 회귀 검증

**Files:**
- Modify: 없음
- Test: `apps/web/app/api/mobile/onboarding/route.test.ts`
- Test: `apps/web/src/components/mobile/MobileOnboardingView.test.tsx`
- Test: `apps/web/src/lib/mobile/auth.test.ts`
- Test: `apps/web/src/lib/mobile/auth.testmode-login.test.ts`

- [ ] **Step 1: 핵심 회귀 테스트 실행**

Run: `pnpm --filter @gynecology-chatbot/web test -- app/api/mobile/onboarding/route.test.ts src/components/mobile/MobileOnboardingView.test.tsx src/lib/mobile/auth.test.ts src/lib/mobile/auth.testmode-login.test.ts`
Expected: PASS, 0 failures

- [ ] **Step 2: 필요 시 web 패키지 타입 체크 실행**

Run: `pnpm --filter @gynecology-chatbot/web exec tsc --noEmit`
Expected: exit 0

- [ ] **Step 3: 최종 Commit**

```bash
git add apps/web/app/api/mobile/onboarding/route.ts apps/web/app/api/mobile/onboarding/route.test.ts apps/web/src/components/mobile/MobileOnboardingView.tsx apps/web/src/components/mobile/MobileOnboardingView.test.tsx apps/web/src/lib/mobile/web-mobile-api.ts apps/web/src/lib/mobile/auth.ts apps/web/src/lib/mobile/auth.test.ts packages/app-core/src/domain.ts
git commit -m "refactor: split baby nickname from onboarding due date"
```
