import { render, screen } from "@testing-library/react";

import HomePage from "./page";

jest.mock("@/components/mobile/MobileHomeView", () => ({
  MobileHomeView: ({ userId }: { userId: string }) => (
    <div>mobile-home:{userId}</div>
  ),
}));

jest.mock("@/components/mobile/MobileLoginView", () => ({
  MobileLoginView: ({ initialUserId }: { initialUserId: string | null }) => (
    <div>mobile-login:{String(initialUserId)}</div>
  ),
}));

describe("HomePage", () => {
  it("renders the mobile login view when userId is missing", async () => {
    const page = await HomePage({ searchParams: Promise.resolve({}) });

    render(page);

    expect(screen.getByText("mobile-login:null")).toBeInTheDocument();
  });

  it("renders the mobile home view when userId is present", async () => {
    const page = await HomePage({
      searchParams: Promise.resolve({ userId: "user-1" }),
    });

    render(page);

    expect(screen.getByText("mobile-home:user-1")).toBeInTheDocument();
  });
});
