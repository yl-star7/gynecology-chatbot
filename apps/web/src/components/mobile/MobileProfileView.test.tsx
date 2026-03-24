import { render, screen } from "@testing-library/react";

import { fetchHome, fetchMobileProfile, fetchSessions } from "@/lib/mobile/web-mobile-api";
import { storeMobileProfile } from "@/lib/mobile/mobile-session";
import { MobileProfileView } from "./MobileProfileView";

jest.mock("@/lib/mobile/web-mobile-api", () => ({
  appendUserIdToPath: jest.fn((path: string, userId?: string | null) =>
    userId ? `${path}?userId=${userId}` : path,
  ),
  fetchHome: jest.fn(),
  fetchMobileProfile: jest.fn(),
  fetchSessions: jest.fn(),
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
    (fetchHome as jest.Mock).mockResolvedValue({
      home: {
        userName: "김수연",
        pregnancyDayCount: 128,
        pregnancyWeekLabel: "18주 2일",
        currentMonthLabel: "2026년 3월",
        calendarDays: [
          {
            isoDate: "2026-03-18",
            dayLabel: "18",
            hasChat: true,
            emotionTone: "calm",
            summary: "오늘 상담 기록",
          },
        ],
        notebookCard: {
          id: "notebook",
          title: "기록과 회고",
          description: "기록을 다시 읽어요.",
          href: "/notebook",
        },
        knowledgeCard: {
          id: "knowledge",
          title: "오늘 내용",
          description: "오늘 내용을 읽어요.",
          href: "/knowledge",
        },
      },
    });
    (fetchSessions as jest.Mock).mockResolvedValue({
      sessions: [
        {
          id: "session-1",
          title: "철분제 복용",
          preview: "철분제를 언제 먹는 게 좋을까요?",
          updatedAtLabel: "방금 전",
        },
      ],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders settings page with user data", async () => {
    render(<MobileProfileView userId="user-1" />);

    expect(
      await screen.findByRole("heading", { name: "튼튼이" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("김수연")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "뒤로 가기" })).toHaveAttribute(
      "href",
      "/?userId=user-1",
    );
    expect(
      screen.getAllByRole("button", { name: "로그아웃" }).length,
    ).toBeGreaterThan(0);
    expect(await screen.findByDisplayValue("김수연")).toHaveClass(
      "bg-[var(--field-surface)]",
    );
    expect(screen.getByDisplayValue("튼튼이")).toHaveClass(
      "bg-[var(--field-surface)]",
    );
    expect(storeMobileProfile).toHaveBeenCalledWith({
      userId: "user-1",
      displayName: "김수연",
      phoneNumber: "01012345678",
      pregnancyWeekLabel: "18주 2일",
      themeKey: "rose-sand",
    });
  });

  it("shows profile skeletons before the profile payload resolves", () => {
    (fetchMobileProfile as jest.Mock).mockImplementation(
      () => new Promise(() => undefined),
    );
    (fetchHome as jest.Mock).mockImplementation(() => new Promise(() => undefined));
    (fetchSessions as jest.Mock).mockImplementation(() => new Promise(() => undefined));

    render(<MobileProfileView userId="user-1" />);

    expect(screen.queryByText("확인 중")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "뒤로 가기" })).toHaveAttribute(
      "href",
      "/?userId=user-1",
    );
  });
});
