import { render, screen } from "@testing-library/react";

import { MobileOnboardingView } from "./MobileOnboardingView";

jest.mock("@/lib/mobile/web-mobile-api", () => ({
  appendUserIdToPath: jest.fn((path: string, userId?: string | null) =>
    userId ? `${path}?userId=${userId}` : path,
  ),
  completeOnboarding: jest.fn(),
}));

jest.mock("@/lib/mobile/mobile-session", () => ({
  markMobileOnboardingComplete: jest.fn(),
  readStoredMobileThemeKey: jest.fn(() => null),
  storeMobileProfile: jest.fn(),
  storeMobileThemeKey: jest.fn(),
  storeMobileUserId: jest.fn(),
}));

jest.mock("@/lib/mobile/themes", () => ({
  applyMobileTheme: jest.fn(),
}));

jest.mock("./native-bridge", () => ({
  setNativeTitle: jest.fn(),
}));

describe("MobileOnboardingView", () => {
  it("renders aligned onboarding fields with explicit labels", () => {
    render(<MobileOnboardingView userId="user-1" />);

    expect(
      screen.getByRole("heading", {
        name: "몇 가지만 알려주시면 바로 시작할 수 있어요",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("현재 주차 또는 예정일")).toBeInTheDocument();
    expect(screen.getByText("원하는 상담 톤")).toBeInTheDocument();
    expect(screen.getByText("추가 메모")).toBeInTheDocument();
    expect(screen.getByText("입력 예시")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "설정 저장하고 시작하기" }),
    ).toBeInTheDocument();
  });
});
