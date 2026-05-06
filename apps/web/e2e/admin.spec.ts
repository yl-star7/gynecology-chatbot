import { expect, test } from "@playwright/test";

// storageState에서 이미 admin 세션 쿠키가 주입됨
// 각 테스트는 /admin으로 바로 이동 가능

test.describe("관리자 E2E", () => {
  /* ─── 1. 로그인 ─── */

  test("로그인 성공 → 대시보드", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(page.locator("h2").first()).toContainText("대시보드");
  });

  /* ─── 2. 셸 레이아웃 ─── */

  test("사이드바 네비게이션 항목", async ({ page }) => {
    await page.goto("/admin");
    const sidebar = page.locator("aside");
    await expect(sidebar.getByText("대시보드")).toBeVisible();
    await expect(sidebar.getByText("채팅 로그")).toBeVisible();
    await expect(sidebar.getByText("자산 관리")).toBeVisible();
    await expect(sidebar.getByText("사전 (RAG)")).toBeVisible();
    await expect(sidebar.getByText("대화 엔진")).toBeVisible();
    await expect(sidebar.getByText("시스템 운영")).toBeVisible();
  });

  test("운영자 이름 표시", async ({ page }) => {
    await page.goto("/admin");
    await expect(
      page.locator("aside").getByText("운영자").first(),
    ).toBeVisible();
  });

  /* ─── 3. 대시보드 ─── */

  test("대시보드 - h2 + 패널", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page.locator("h2").first()).toContainText("대시보드");
    await expect(page.locator("section").first()).toBeVisible();
  });

  /* ─── 4. 사용자 운영 ─── */

  test("사용자 운영 액션 페이지 로드", async ({ page }) => {
    await page.goto("/admin/ops/users");
    await expect(page.locator("h2").first()).toContainText("사용자 운영 액션");
  });

  test("사용자 운영 액션 페이지 입력 필드", async ({ page }) => {
    await page.goto("/admin/ops/users");
    const count = await page.locator("input").count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  /* ─── 5. 콘텐츠 관리 ─── */

  const contentPages = [
    { href: "/admin/assets/weeks", title: "주차별 아기는요?" },
    { href: "/admin/lexicon", title: "사전 (RAG 참조)" },
    { href: "/admin/engine/copy", title: "지식 콘텐츠" },
    { href: "/admin/engine/workflows", title: "워크플로우" },
  ] as const;

  for (const { href, title } of contentPages) {
    test(`콘텐츠: ${title}`, async ({ page }) => {
      await page.goto(href);
      await expect(page.locator("h2").first()).toContainText(title);
    });
  }

  /* ─── 6. 모니터링 ─── */

  test("모니터링 페이지", async ({ page }) => {
    await page.goto("/admin/ops/monitoring");
    await expect(page.locator("h2").first()).toContainText("모니터링");
  });

  test("모니터링 섹션 렌더링", async ({ page }) => {
    await page.goto("/admin/ops/monitoring");
    await expect(page.locator("section").first()).toBeVisible();
  });

  /* ─── 7. 네비게이션 ─── */

  const navRoutes = [
    { href: "/admin/dashboard", title: "대시보드" },
    { href: "/admin/ops/users", title: "사용자 운영 액션" },
    { href: "/admin/assets/weeks", title: "주차별 아기는요?" },
    { href: "/admin/ops/monitoring", title: "모니터링" },
  ] as const;

  for (const { href, title } of navRoutes) {
    test(`직접 접근: ${title}`, async ({ page }) => {
      await page.goto(href);
      await expect(page.locator("h2").first()).toContainText(title);
    });
  }

  test("사이드바 클릭 전환", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await page.locator("aside").getByText("사용자 운영 액션").click();
    await expect(page).toHaveURL(/\/admin\/ops\/users/);
    await page.locator("aside").getByText("모니터링").click();
    await expect(page).toHaveURL(/\/admin\/ops\/monitoring/);
  });
});

/* ─── 8. 인증 가드 (storageState 미사용) ─── */

test.describe("인증 가드", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  const guardedRoutes = [
    "/admin/dashboard",
    "/admin/ops/users",
    "/admin/assets/weeks",
    "/admin/ops/monitoring",
  ] as const;

  for (const href of guardedRoutes) {
    test(`비인증 → ${href} → 로그인 리다이렉트`, async ({ page }) => {
      await page.goto(href);
      await expect(page).toHaveURL(/\/admin\/login/, { timeout: 5_000 });
    });
  }
});
