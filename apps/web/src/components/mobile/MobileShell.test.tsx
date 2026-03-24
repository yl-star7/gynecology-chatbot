import { render, screen } from "@testing-library/react";

import { MobileShell } from "./MobileShell";

jest.mock("@/lib/mobile/mobile-session", () => ({
  readStoredMobileProfile: jest.fn(() => ({
    displayName: "김수연",
    pregnancyWeekLabel: "18주 2일",
    themeKey: "rose-sand",
  })),
  readStoredMobileThemeKey: jest.fn(() => "rose-sand"),
  storeMobileThemeKey: jest.fn(),
}));

jest.mock("@/lib/mobile/themes", () => ({
  applyMobileTheme: jest.fn(),
}));

describe("MobileShell", () => {
  it("renders a compact profile entry without shell-owned navigation or logout", () => {
    render(
      <MobileShell
        title="홈"
        description="모바일 웹 기본 구조"
        userId="user-1"
      >
        <div>본문</div>
      </MobileShell>,
    );

    expect(screen.getByRole("link", { name: "마이페이지 열기" })).toHaveAttribute(
      "href",
      "/profile?userId=user-1",
    );
    expect(screen.getAllByText("홈").length).toBeGreaterThan(0);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "로그아웃" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("빠른 테마")).not.toBeInTheDocument();
  });

  it("does not render a chat FAB anymore", () => {
    render(
      <MobileShell
        title="홈"
        description="모바일 웹 기본 구조"
        userId="user-1"
      >
        <div>본문</div>
      </MobileShell>,
    );

    expect(
      screen.queryByRole("link", { name: "오늘,우리 열기" }),
    ).not.toBeInTheDocument();
  });
});
