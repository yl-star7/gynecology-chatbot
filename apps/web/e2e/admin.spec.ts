import { expect, test } from "@playwright/test";

// storageState에서 이미 admin 세션 쿠키가 주입됨
// 각 테스트는 /admin으로 바로 이동 가능

test.describe("관리자 E2E", () => {
  /* ─── 1. 로그인 ─── */

  test("로그인 성공 → 운영 상태", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("h2").first()).toContainText("운영 상태");
  });

  /* ─── 2. 셸 레이아웃 ─── */

  test("사이드바 네비게이션 항목", async ({ page }) => {
    await page.goto("/admin");
    const sidebar = page.locator("aside");
    await expect(sidebar.getByText("운영 상태")).toBeVisible();
    await expect(sidebar.getByText("계정")).toBeVisible();
    await expect(sidebar.getByText("콘텐츠")).toBeVisible();
    await expect(sidebar.getByText("모니터링")).toBeVisible();
  });

  test("운영자 이름 표시", async ({ page }) => {
    await page.goto("/admin");
    await expect(
      page.locator("aside").getByText("운영자").first(),
    ).toBeVisible();
  });

  /* ─── 3. 운영 상태 ─── */

  test("운영 상태 - h2 + 패널", async ({ page }) => {
    await page.goto("/admin/operations");
    await expect(page.locator("h2").first()).toContainText("운영 상태");
    await expect(page.locator("section").first()).toBeVisible();
  });

  /* ─── 4. 계정 관리 ─── */

  test("계정 페이지 로드", async ({ page }) => {
    await page.goto("/admin/accounts");
    await expect(page.locator("h2").first()).toContainText("사용자 설정");
  });

  test("계정 페이지 입력 필드", async ({ page }) => {
    await page.goto("/admin/accounts");
    const count = await page.locator("input").count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  /* ─── 5. 콘텐츠 관리 ─── */

  const contentPages = [
    { href: "/admin/content/weeks", title: "주차별 아기는요?" },
    { href: "/admin/content/documents", title: "참조 파일" },
    { href: "/admin/content/static", title: "지식 콘텐츠" },
    { href: "/admin/content/policies", title: "응답 워크플로우" },
  ] as const;

  for (const { href, title } of contentPages) {
    test(`콘텐츠: ${title}`, async ({ page }) => {
      await page.goto(href);
      await expect(page.locator("h2").first()).toContainText(title);
    });
  }

  /* ─── 6. 모니터링 ─── */

  test("모니터링 페이지", async ({ page }) => {
    await page.goto("/admin/monitoring");
    await expect(page.locator("h2").first()).toContainText("모니터링");
  });

  test("모니터링 섹션 렌더링", async ({ page }) => {
    await page.goto("/admin/monitoring");
    await expect(page.locator("section").first()).toBeVisible();
  });

  /* ─── 7. 네비게이션 ─── */

  const navRoutes = [
    { href: "/admin/operations", title: "운영 상태" },
    { href: "/admin/accounts", title: "사용자 설정" },
    { href: "/admin/content/weeks", title: "주차별 아기는요?" },
    { href: "/admin/monitoring", title: "모니터링" },
  ] as const;

  for (const { href, title } of navRoutes) {
    test(`직접 접근: ${title}`, async ({ page }) => {
      await page.goto(href);
      await expect(page.locator("h2").first()).toContainText(title);
    });
  }

  test("사이드바 클릭 전환", async ({ page }) => {
    await page.goto("/admin/operations");
    await page.locator("aside").getByText("계정").click();
    await expect(page).toHaveURL(/\/admin\/accounts/);
    await page.locator("aside").getByText("모니터링").click();
    await expect(page).toHaveURL(/\/admin\/monitoring/);
  });
});

/* ─── 8. 인증 가드 (storageState 미사용) ─── */

test.describe("인증 가드", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  const guardedRoutes = [
    "/admin/operations",
    "/admin/accounts",
    "/admin/content/weeks",
    "/admin/monitoring",
  ] as const;

  for (const href of guardedRoutes) {
    test(`비인증 → ${href} → 로그인 리다이렉트`, async ({ page }) => {
      await page.goto(href);
      await expect(page).toHaveURL(/\/admin\/login/, { timeout: 5_000 });
    });
  }
});
