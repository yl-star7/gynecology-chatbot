import { render, screen } from "@testing-library/react";

import { fetchLinkTarget } from "@/lib/mobile/web-mobile-api";
import { MobileLinkView } from "./MobileLinkView";

jest.mock("@/lib/mobile/web-mobile-api", () => ({
  fetchLinkTarget: jest.fn(),
}));

jest.mock("@/lib/mobile/mobile-session", () => ({
  clearMobileSession: jest.fn(),
  readStoredMobileProfile: jest.fn(() => ({
    displayName: "김수연",
    pregnancyWeekLabel: "18주 2일",
  })),
  readStoredMobileThemeKey: jest.fn(() => null),
}));

describe("MobileLinkView", () => {
  beforeEach(() => {
    (fetchLinkTarget as jest.Mock).mockResolvedValue({
      content: {
        title: "24주차 위험 신호",
        section: "임신 지식",
        body: "지속적인 출혈이나 양수 의심 증상이 있으면 진료를 받으세요.",
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders linked content with a single visible content title", async () => {
    render(<MobileLinkView userId="user-1" target="knowledge" />);

    expect(
      await screen.findByRole("heading", { name: "24주차 위험 신호" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("24주차 위험 신호")).toHaveLength(1);
    expect(
      screen.queryByRole("link", { name: /^프로필$/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "상담으로 돌아가기" }),
    ).toHaveAttribute("href", "/chat/new?userId=user-1");
  });
});
