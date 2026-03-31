import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { completeOnboarding } from "@/lib/mobile/web-mobile-api";

import {
  MobileOnboardingView,
  buildWebOnboardingCompletionInput,
} from "./MobileOnboardingView";

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

describe("buildWebOnboardingCompletionInput", () => {
  it("normalizes dueDate to YYYY-MM-dd before submit", () => {
    expect(
      buildWebOnboardingCompletionInput({
        userId: "user-1",
        dueDate: "2026-08-15T09:12:33.000Z",
        babyNickname: "  콩이  ",
        tonePreference: "",
        themeKey: "rose-sand",
      }),
    ).toEqual({
      userId: "user-1",
      pregnancyWeekOrDueDate: "2026-08-15",
      babyNickname: "콩이",
      tonePreference: "친근하게",
      themeKey: "rose-sand",
    });
  });
});

describe("MobileOnboardingView", () => {
  beforeEach(() => {
    (completeOnboarding as jest.Mock).mockReset();
  });

  it("renders step 1 with due date calendar input", () => {
    render(<MobileOnboardingView userId="user-1" />);

    expect(
      screen.getByRole("heading", { name: "출산 예정일을 알려주세요" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다음" })).toBeInTheDocument();
  });

  it("submits due date and baby nickname as separate fields", async () => {
    const completeOnboardingMock = completeOnboarding as jest.Mock;
    completeOnboardingMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });

    render(<MobileOnboardingView userId="user-1" />);

    fireEvent.change(screen.getByLabelText("출산 예정일"), {
      target: { value: "2026-08-15" },
    });
    fireEvent.click(screen.getByRole("button", { name: "다음" }));

    fireEvent.change(screen.getByPlaceholderText("예: 콩이, 달이"), {
      target: { value: "콩이" },
    });
    fireEvent.click(screen.getByRole("button", { name: "다음" }));

    fireEvent.click(screen.getByRole("button", { name: "차분하게" }));
    fireEvent.click(screen.getByRole("button", { name: "다음" }));

    fireEvent.click(screen.getByRole("button", { name: "시작하기" }));

    await waitFor(() => {
      expect(completeOnboardingMock).toHaveBeenCalledWith({
        userId: "user-1",
        pregnancyWeekOrDueDate: "2026-08-15",
        babyNickname: "콩이",
        tonePreference: "차분하게",
        themeKey: "rose-sand",
      });
    });
  });

  it("userId가 없으면 저장하지 않고 안내 문구를 보여준다", async () => {
    const completeOnboardingMock = completeOnboarding as jest.Mock;
    render(<MobileOnboardingView userId={null} />);

    fireEvent.change(screen.getByLabelText("출산 예정일"), {
      target: { value: "2026-08-15" },
    });
    fireEvent.click(screen.getByRole("button", { name: "다음" }));
    fireEvent.click(screen.getByRole("button", { name: "건너뛰기" }));
    fireEvent.click(screen.getByRole("button", { name: "차분하게" }));
    fireEvent.click(screen.getByRole("button", { name: "다음" }));
    fireEvent.click(screen.getByRole("button", { name: "시작하기" }));

    expect(completeOnboardingMock).not.toHaveBeenCalled();
    expect(
      await screen.findByText("로그인 정보를 확인한 뒤 다시 시도해주세요."),
    ).toBeInTheDocument();
  });
});
