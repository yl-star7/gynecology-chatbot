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
  it("renders step 1 with pregnancy week input", () => {
    render(<MobileOnboardingView userId="user-1" />);

    expect(
      screen.getByRole("heading", { name: "지금 몇 주차예요?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("예: 16주 또는 2026-08-01"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "다음" }),
    ).toBeInTheDocument();
  });
});
