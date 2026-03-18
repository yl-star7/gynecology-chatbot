import { fireEvent, render, screen } from "@testing-library/react";

import { MobileShell } from "./MobileShell";

jest.mock("@/lib/mobile/mobile-session", () => ({
  clearMobileSession: jest.fn(),
  readStoredMobileProfile: jest.fn(() => ({
    displayName: "김수연",
    pregnancyWeekLabel: "18주 2일",
    themeKey: "rose-sand",
  })),
  readStoredMobileThemeKey: jest.fn(() => "rose-sand"),
  storeMobileThemeKey: jest.fn(),
}));

describe("MobileShell", () => {
  it("renders mobile navigation with user scoped links", () => {
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
      screen.getByRole("navigation", { name: "모바일 기본 탐색" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "홈" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "프로필" })).toHaveAttribute(
      "href",
      "/profile?userId=user-1",
    );
    expect(screen.getByRole("link", { name: "채팅" })).toHaveAttribute(
      "href",
      "/chat/new?userId=user-1",
    );
  });

  it("applies the selected theme with one click", () => {
    const sessionModule = jest.requireMock("@/lib/mobile/mobile-session");

    render(
      <MobileShell
        title="홈"
        description="모바일 웹 기본 구조"
        userId="user-1"
      >
        <div>본문</div>
      </MobileShell>,
    );

    fireEvent.click(screen.getByRole("button", { name: "민트 테마 적용" }));

    expect(sessionModule.storeMobileThemeKey).toHaveBeenCalledWith(
      "mint-neutral",
    );
    expect(document.documentElement).toHaveAttribute(
      "data-theme",
      "mint-neutral",
    );
  });
});
