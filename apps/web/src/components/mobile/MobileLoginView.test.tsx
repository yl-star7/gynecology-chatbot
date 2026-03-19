import { render, waitFor } from "@testing-library/react";

import { MobileLoginView } from "./MobileLoginView";

const replace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ replace })),
}));

const appendUserIdToPath = jest.fn(
  (path: string, userId?: string | null) =>
    userId ? `${path}?userId=${userId}` : path,
);
const fetchCurrentMobileSession = jest.fn();

jest.mock("@/lib/mobile/web-mobile-api", () => ({
  appendUserIdToPath: (path: string, userId?: string | null) =>
    appendUserIdToPath(path, userId),
  completeOnboarding: jest.fn(),
  fetchCurrentMobileSession: () => fetchCurrentMobileSession(),
  requestPhoneVerification: jest.fn(),
  signInWithPhoneVerification: jest.fn(),
}));

const clearMobileSession = jest.fn();
const readStoredMobileSessionToken = jest.fn();
const readStoredMobileThemeKey = jest.fn(() => null);
const readStoredMobileUserId = jest.fn();
const setMobileOnboardingStatus = jest.fn();
const storeMobileProfile = jest.fn();
const storeMobileSessionToken = jest.fn();
const storeMobileThemeKey = jest.fn();
const storeMobileUserId = jest.fn();

jest.mock("@/lib/mobile/mobile-session", () => ({
  clearMobileSession: () => clearMobileSession(),
  hasCompletedMobileOnboarding: jest.fn(() => false),
  readStoredMobileSessionToken: () => readStoredMobileSessionToken(),
  readStoredMobileThemeKey: () => readStoredMobileThemeKey(),
  readStoredMobileUserId: () => readStoredMobileUserId(),
  setMobileOnboardingStatus: (completed: boolean) =>
    setMobileOnboardingStatus(completed),
  storeMobileProfile: (profile: unknown) => storeMobileProfile(profile),
  storeMobileSessionToken: (token: string) => storeMobileSessionToken(token),
  storeMobileThemeKey: (themeKey: string) => storeMobileThemeKey(themeKey),
  storeMobileUserId: (userId: string) => storeMobileUserId(userId),
}));

jest.mock("@/lib/mobile/themes", () => ({
  applyMobileTheme: jest.fn(),
}));

jest.mock("./native-bridge", () => ({
  setNativeTitle: jest.fn(),
}));

describe("MobileLoginView", () => {
  beforeEach(() => {
    replace.mockReset();
    appendUserIdToPath.mockClear();
    fetchCurrentMobileSession.mockReset();
    clearMobileSession.mockReset();
    readStoredMobileSessionToken.mockReset();
    readStoredMobileUserId.mockReset();
    setMobileOnboardingStatus.mockReset();
    storeMobileProfile.mockReset();
    storeMobileUserId.mockReset();
  });

  it("does not redirect from login when only a stale stored user id exists", async () => {
    readStoredMobileUserId.mockReturnValue("user-1");
    readStoredMobileSessionToken.mockReturnValue(null);

    render(<MobileLoginView initialUserId={null} />);

    await waitFor(() => expect(clearMobileSession).toHaveBeenCalled());
    expect(replace).not.toHaveBeenCalled();
    expect(fetchCurrentMobileSession).not.toHaveBeenCalled();
  });

  it("restores a valid session from storage and redirects away from login", async () => {
    readStoredMobileUserId.mockReturnValue("user-1");
    readStoredMobileSessionToken.mockReturnValue("session-token");
    fetchCurrentMobileSession.mockResolvedValue({
      user: {
        id: "user-1",
        displayName: "김수연",
        phoneNumber: "01012345678",
        hasCompletedOnboarding: false,
      },
    });

    render(<MobileLoginView initialUserId={null} />);

    await waitFor(() => expect(fetchCurrentMobileSession).toHaveBeenCalled());
    await waitFor(() =>
      expect(setMobileOnboardingStatus).toHaveBeenCalledWith(false),
    );
    expect(storeMobileUserId).toHaveBeenCalledWith("user-1");
    expect(storeMobileProfile).toHaveBeenCalledWith({
      userId: "user-1",
      displayName: "김수연",
      phoneNumber: "01012345678",
    });
    expect(replace).toHaveBeenCalledWith("/onboarding?userId=user-1");
  });
});
