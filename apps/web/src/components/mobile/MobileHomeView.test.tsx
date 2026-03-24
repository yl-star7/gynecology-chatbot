import { render, screen } from "@testing-library/react";

import { fetchHome, fetchMobileProfile } from "@/lib/mobile/web-mobile-api";
import { storeMobileProfile } from "@/lib/mobile/mobile-session";
import { MobileHomeView } from "./MobileHomeView";

jest.mock("@/lib/mobile/web-mobile-api", () => ({
  fetchHome: jest.fn(),
  fetchMobileProfile: jest.fn(),
}));

jest.mock("@/lib/mobile/mobile-session", () => ({
  clearMobileSession: jest.fn(),
  readStoredMobileProfile: jest.fn(() => ({
    displayName: "김수연",
    pregnancyWeekLabel: "18주 6일",
  })),
  readStoredMobileThemeKey: jest.fn(() => null),
  storeMobileProfile: jest.fn(),
  storeMobileThemeKey: jest.fn(),
}));

jest.mock("./useMobileSessionGuard", () => ({
  useMobileSessionGuard: jest.fn((userId: string | null) => userId),
}));

describe("MobileHomeView", () => {
  beforeEach(() => {
    (fetchHome as jest.Mock).mockResolvedValue({
      home: {
        userName: "수연",
        pregnancyDayCount: 132,
        pregnancyWeekLabel: "18주 6일",
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
          title: "임신수첩",
          description: "오늘 해야 할 체크리스트와 저장 기록을 확인합니다.",
          href: "/notebook",
        },
        knowledgeCard: {
          id: "knowledge",
          title: "임신 지식",
          description: "이번 주 변화와 놓치면 안 될 위험 신호를 먼저 봅니다.",
          href: "/knowledge",
        },
      },
    });
    (fetchMobileProfile as jest.Mock).mockResolvedValue({
      profile: {
        userId: "user-1",
        displayName: "수연",
        phoneNumber: "01012345678",
        pregnancyWeekLabel: "18주 6일",
        pregnancyDayCount: 132,
        accountStatus: "active",
        hasCompletedOnboarding: true,
        dueDate: "2026-08-01",
        babyNickname: "튼튼이",
        themeKey: "rose-sand",
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the mirrored home hero and primary patient actions", async () => {
    render(<MobileHomeView userId="user-1" />);

    const heading = await screen.findByRole("heading", {
      name: "튼튼이",
    });

    expect(heading).toBeInTheDocument();
    expect(screen.getByText("튼튼이의 한마디")).toBeInTheDocument();
    expect(screen.getByText("18주 6일")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "마이페이지 열기" })).toHaveAttribute(
      "href",
      "/profile?userId=user-1",
    );
    expect(
      screen.queryByRole("link", { name: "오늘 내용 보기" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "오늘,우리 보기" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "오늘,우리" })).toHaveAttribute(
      "href",
      "/today?userId=user-1",
    );
    expect(storeMobileProfile).toHaveBeenCalledWith({
      userId: "user-1",
      displayName: "수연",
      phoneNumber: "01012345678",
      pregnancyWeekLabel: "18주 6일",
      themeKey: "rose-sand",
    });
  });

  it("renders skeleton loading blocks instead of fallback loading copy", () => {
    (fetchHome as jest.Mock).mockImplementation(() => new Promise(() => undefined));
    (fetchMobileProfile as jest.Mock).mockImplementation(
      () => new Promise(() => undefined),
    );

    render(<MobileHomeView userId="user-1" />);

    expect(screen.queryByText("오늘 상태를 불러오는 중입니다.")).not.toBeInTheDocument();
    expect(screen.queryByText("연결 중")).not.toBeInTheDocument();
    expect(screen.queryByText("데이터 확인 중")).not.toBeInTheDocument();
  });
});
