import { render, waitFor } from "@testing-library/react";

import { useMobileSessionGuard } from "./useMobileSessionGuard";

const replace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ replace })),
  usePathname: jest.fn(() => "/profile"),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

const clearMobileSession = jest.fn();
const readStoredMobileSessionToken = jest.fn();
const readStoredMobileUserId = jest.fn();
const setMobileOnboardingStatus = jest.fn();
const storeMobileProfile = jest.fn();
const storeMobileUserId = jest.fn();

jest.mock("@/lib/mobile/mobile-session", () => ({
  clearMobileSession: () => clearMobileSession(),
  hasCompletedMobileOnboarding: jest.fn(() => false),
  readStoredMobileSessionToken: () => readStoredMobileSessionToken(),
  readStoredMobileUserId: () => readStoredMobileUserId(),
  setMobileOnboardingStatus: (completed: boolean) =>
    setMobileOnboardingStatus(completed),
  storeMobileProfile: (profile: unknown) => storeMobileProfile(profile),
  storeMobileUserId: (userId: string) => storeMobileUserId(userId),
}));

const appendUserIdToPath = jest.fn(
  (path: string, userId?: string | null) =>
    userId ? `${path}?userId=${userId}` : path,
);
const fetchCurrentMobileSession = jest.fn();

jest.mock("@/lib/mobile/web-mobile-api", () => ({
  appendUserIdToPath: (path: string, userId?: string | null) =>
    appendUserIdToPath(path, userId),
  fetchCurrentMobileSession: () => fetchCurrentMobileSession(),
  resolveMobileUserId: (userId?: string | null) => userId ?? null,
}));

function GuardProbe({ userId }: { userId?: string | null }) {
  useMobileSessionGuard(userId);
  return <div>guard-probe</div>;
}

describe("useMobileSessionGuard", () => {
  beforeEach(() => {
    replace.mockReset();
    clearMobileSession.mockReset();
    readStoredMobileSessionToken.mockReset();
    readStoredMobileUserId.mockReset();
    setMobileOnboardingStatus.mockReset();
    storeMobileProfile.mockReset();
    storeMobileUserId.mockReset();
    appendUserIdToPath.mockClear();
    fetchCurrentMobileSession.mockReset();
  });

  it("clears stale local storage and redirects to login when only a stored user id remains", async () => {
    readStoredMobileUserId.mockReturnValue("user-1");
    readStoredMobileSessionToken.mockReturnValue(null);

    render(<GuardProbe userId={null} />);

    await waitFor(() => expect(clearMobileSession).toHaveBeenCalled());
    expect(replace).toHaveBeenCalledWith("/auth/login");
    expect(fetchCurrentMobileSession).not.toHaveBeenCalled();
  });

  it("restores the current user from a stored session token before routing", async () => {
    readStoredMobileUserId.mockReturnValue(null);
    readStoredMobileSessionToken.mockReturnValue("session-token");
    fetchCurrentMobileSession.mockResolvedValue({
      user: {
        id: "user-2",
        displayName: "김수연",
        phoneNumber: "01012345678",
        hasCompletedOnboarding: true,
      },
    });

    render(<GuardProbe userId={null} />);

    await waitFor(() => expect(fetchCurrentMobileSession).toHaveBeenCalled());
    await waitFor(() =>
      expect(storeMobileUserId).toHaveBeenCalledWith("user-2"),
    );
    expect(storeMobileProfile).toHaveBeenCalledWith({
      userId: "user-2",
      displayName: "김수연",
      phoneNumber: "01012345678",
    });
    expect(setMobileOnboardingStatus).toHaveBeenCalledWith(true);
    expect(replace).toHaveBeenCalledWith("/profile?userId=user-2");
  });
});
