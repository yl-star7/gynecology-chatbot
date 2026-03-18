import { render, screen } from "@testing-library/react";

import { fetchMobileProfile } from "@/lib/mobile/web-mobile-api";
import { storeMobileProfile } from "@/lib/mobile/mobile-session";
import { MobileProfileView } from "./MobileProfileView";

jest.mock("@/lib/mobile/web-mobile-api", () => ({
  appendUserIdToPath: jest.fn((path: string, userId?: string | null) =>
    userId ? `${path}?userId=${userId}` : path,
  ),
  fetchMobileProfile: jest.fn(),
  resolveMobileUserId: jest.fn((userId?: string | null) => userId),
  updateMobileProfile: jest.fn(),
}));

jest.mock("@/lib/mobile/mobile-session", () => ({
  clearMobileSession: jest.fn(),
  readStoredMobileProfile: jest.fn(() => ({
    displayName: "김수연",
    pregnancyWeekLabel: "18주 2일",
  })),
  readStoredMobileThemeKey: jest.fn(() => null),
  storeMobileProfile: jest.fn(),
  storeMobileThemeKey: jest.fn(),
}));

jest.mock("@/lib/mobile/themes", () => ({
  applyMobileTheme: jest.fn(),
}));

jest.mock("./useMobileSessionGuard", () => ({
  useMobileSessionGuard: jest.fn((userId: string | null) => userId),
}));

describe("MobileProfileView", () => {
  beforeEach(() => {
    (fetchMobileProfile as jest.Mock).mockResolvedValue({
      profile: {
        userId: "user-1",
        displayName: "김수연",
        phoneNumber: "01012345678",
        pregnancyWeekLabel: "18주 2일",
        pregnancyDayCount: 128,
        accountStatus: "active",
        hasCompletedOnboarding: true,
        dueDate: "2026-08-01",
        tonePreference: "calm",
        babyNickname: "튼튼이",
        hospitalName: "산단여성병원",
        notificationTime: "08:30",
        themeKey: "rose-sand",
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("keeps profile metadata in the body without repeating it in the shell header", async () => {
    render(<MobileProfileView userId="user-1" />);

    expect(
      await screen.findByRole("heading", { name: "계정과 상담 설정" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("김수연")).toBeInTheDocument();
    expect(screen.getAllByText("김수연")).toHaveLength(1);
    expect(screen.getAllByText("18주 2일")).toHaveLength(1);
    expect(
      screen.queryByRole("link", { name: /^프로필$/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "프로필 열기" })).toHaveAttribute(
      "href",
      "/profile?userId=user-1",
    );
    expect(storeMobileProfile).toHaveBeenCalledWith({
      userId: "user-1",
      displayName: "김수연",
      phoneNumber: "01012345678",
      pregnancyWeekLabel: "18주 2일",
      themeKey: "rose-sand",
    });
  });
});
