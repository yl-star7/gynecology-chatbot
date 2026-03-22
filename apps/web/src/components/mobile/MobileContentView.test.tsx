import { render, screen } from "@testing-library/react";

import { fetchLinkTarget } from "@/lib/mobile/web-mobile-api";
import { MobileContentView } from "./MobileContentView";

jest.mock("@/lib/mobile/web-mobile-api", () => ({
  appendUserIdToPath: jest.fn((path: string, userId?: string | null) =>
    userId ? `${path}?userId=${userId}` : path,
  ),
  fetchLinkTarget: jest.fn(),
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

jest.mock("./native-bridge", () => ({
  setNativeTitle: jest.fn(),
}));

jest.mock("./useMobileSessionGuard", () => ({
  useMobileSessionGuard: jest.fn((userId: string | null) => userId),
}));

describe("MobileContentView", () => {
  beforeEach(() => {
    (fetchLinkTarget as jest.Mock).mockResolvedValue({
      content: {
        title: "임신 지식",
        section: "임신 지식",
        body: "이번 주 변화와 주의할 증상을 확인합니다.",
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("uses a non-duplicated eyebrow when section and content titles match", async () => {
    render(
      <MobileContentView
        target="knowledge"
        title="임신 지식"
        userId="user-1"
      />,
    );

    const heading = await screen.findByRole("heading", { name: "임신 지식" });

    expect(heading).toBeInTheDocument();
    expect(heading.closest("header")).toHaveClass("bg-[var(--panel-strong)]");
    expect(screen.getAllByText("임신 지식")).toHaveLength(1);
    expect(screen.getByText("참고 문서")).toBeInTheDocument();
    expect(
      screen.getByText("이번 주 변화와 주의할 증상을 확인합니다.").closest("article"),
    ).toHaveClass("bg-[var(--panel-strong)]");
    expect(
      screen.queryByRole("link", { name: /^프로필$/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "새 상담 시작" })).toHaveAttribute(
      "href",
      "/chat/new?userId=user-1",
    );
    expect(
      screen.queryByRole("link", { name: "상담으로 이동" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "뒤로 가기" })).toHaveAttribute(
      "href",
      "/?userId=user-1",
    );
  });

  it("shows skeletons instead of loading copy while waiting for content", () => {
    (fetchLinkTarget as jest.Mock).mockImplementation(
      () => new Promise(() => undefined),
    );

    render(
      <MobileContentView
        target="knowledge"
        title="임신 지식"
        userId="user-1"
      />,
    );

    expect(screen.queryByText("내용을 불러오고 있어요.")).not.toBeInTheDocument();
  });
});
