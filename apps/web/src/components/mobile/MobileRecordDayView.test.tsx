import { render, screen } from "@testing-library/react";

import { fetchRecordDay } from "@/lib/mobile/web-mobile-api";
import { MobileRecordDayView } from "./MobileRecordDayView";

jest.mock("@/lib/mobile/web-mobile-api", () => ({
  appendUserIdToPath: jest.fn((path: string, userId?: string | null) =>
    userId ? `${path}?userId=${userId}` : path,
  ),
  fetchRecordDay: jest.fn(),
  resolveMobileUserId: jest.fn((userId?: string | null) => userId),
}));

jest.mock("@/lib/mobile/mobile-session", () => ({
  clearMobileSession: jest.fn(),
  readStoredMobileProfile: jest.fn(() => ({
    displayName: "김수연",
    pregnancyWeekLabel: "18주 2일",
  })),
  readStoredMobileThemeKey: jest.fn(() => null),
}));

jest.mock("./useMobileSessionGuard", () => ({
  useMobileSessionGuard: jest.fn((userId: string | null) => userId),
}));

describe("MobileRecordDayView", () => {
  beforeEach(() => {
    (fetchRecordDay as jest.Mock).mockResolvedValue({
      recordDay: {
        isoDate: "2026-03-18",
        dateLabel: "2026년 3월 18일",
        emotionTone: "calm",
        records: [
          {
            id: "record-1",
            title: "하복부 통증 메모",
            summary: "오전부터 가벼운 통증이 있었습니다.",
            entryType: "symptom_note",
            linkedSessionId: "chat-1",
          },
        ],
        relatedSessions: [
          {
            id: "chat-1",
            title: "하복부 통증 상담",
            preview: "통증 양상을 정리해 주세요.",
            updatedAtLabel: "방금 전",
          },
        ],
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("shows the record date once and summarizes day metadata in Korean", async () => {
    render(<MobileRecordDayView isoDate="2026-03-18" userId="user-1" />);

    expect(
      await screen.findByRole("heading", { name: "2026년 3월 18일" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("2026년 3월 18일")).toHaveLength(1);
    expect(screen.getByText("차분함")).toBeInTheDocument();
    expect(screen.getAllByText("1건")).toHaveLength(2);
    expect(screen.queryByText("Day Summary")).not.toBeInTheDocument();
    expect(screen.queryByText("Records")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^프로필$/ }),
    ).not.toBeInTheDocument();
  });
});
