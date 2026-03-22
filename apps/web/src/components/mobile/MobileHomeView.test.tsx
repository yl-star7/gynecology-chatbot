import { render, screen } from "@testing-library/react";

import { fetchHome, fetchSessions } from "@/lib/mobile/web-mobile-api";
import { storeMobileProfile } from "@/lib/mobile/mobile-session";
import { MobileHomeView } from "./MobileHomeView";

jest.mock("@/lib/mobile/web-mobile-api", () => ({
  fetchHome: jest.fn(),
  fetchSessions: jest.fn(),
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

  it("keeps screenshot-facing home copy compact and avoids repeated profile metadata", async () => {
    render(<MobileHomeView userId="user-1" />);

    const heading = await screen.findByRole("heading", {
      name: "수연님, 오늘 기록과 상담을 이어가세요.",
    });

    expect(heading).toBeInTheDocument();
    expect(heading.closest("section")).toHaveClass("bg-[var(--panel-strong)]");
    expect(screen.getAllByText("18주 6일")).toHaveLength(1);
    expect(screen.getByText("철분제 복용").closest("a")).toHaveClass(
      "bg-[var(--panel-muted)]",
    );
    expect(screen.getByRole("link", { name: "프로필 열기" })).toHaveAttribute(
      "href",
      "/profile?userId=user-1",
    );
    expect(
      screen.queryByRole("link", { name: /^프로필$/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "새 상담 시작" })).toHaveAttribute(
      "href",
      "/chat/new?userId=user-1",
    );
    expect(
      screen.queryByRole("link", { name: "증상 상담 시작" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Today")).not.toBeInTheDocument();
    expect(screen.queryByText("Continue")).not.toBeInTheDocument();
    expect(screen.getByText("임신수첩")).toBeInTheDocument();
    expect(screen.getByText("임신 지식")).toBeInTheDocument();
    expect(storeMobileProfile).toHaveBeenCalledWith({
      displayName: "수연",
      pregnancyWeekLabel: "18주 6일",
    });
  });

  it("renders skeleton loading blocks instead of fallback loading copy", () => {
    (fetchHome as jest.Mock).mockImplementation(() => new Promise(() => undefined));
    (fetchSessions as jest.Mock).mockImplementation(
      () => new Promise(() => undefined),
    );

    render(<MobileHomeView userId="user-1" />);

    expect(screen.queryByText("오늘 상태를 불러오는 중입니다.")).not.toBeInTheDocument();
    expect(screen.queryByText("연결 중")).not.toBeInTheDocument();
    expect(screen.queryByText("데이터 확인 중")).not.toBeInTheDocument();
  });
});
