import { render, screen } from "@testing-library/react";

import OnboardingPage from "../../../app/onboarding/page";

jest.mock("@/components/mobile/MobileOnboardingView", () => ({
  MobileOnboardingView: ({ userId }: { userId: string | null }) => (
    <div>mobile-onboarding:{String(userId)}</div>
  ),
}));

describe("OnboardingPage", () => {
  it("forwards the userId into the web onboarding view", async () => {
    const page = await OnboardingPage({
      searchParams: Promise.resolve({ userId: "user-1" }),
    });

    render(page);

    expect(screen.getByText("mobile-onboarding:user-1")).toBeInTheDocument();
  });
});
