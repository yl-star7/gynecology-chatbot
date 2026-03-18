import { render, screen } from "@testing-library/react";

import { MobileSetPasswordView } from "./MobileSetPasswordView";

jest.mock("@/lib/mobile/web-mobile-api", () => ({
  appendUserIdToPath: jest.fn((path: string, userId?: string | null) =>
    userId ? `${path}?userId=${userId}` : path,
  ),
  setPassword: jest.fn(),
  startPhoneVerification: jest.fn(),
  verifyPhone: jest.fn(),
}));

jest.mock("@/lib/mobile/mobile-session", () => ({
  storeMobileUserId: jest.fn(),
}));

jest.mock("./native-bridge", () => ({
  setNativeTitle: jest.fn(),
}));

describe("MobileSetPasswordView", () => {
  it("renders the password setup flow with labeled fields and aligned CTA copy", () => {
    render(<MobileSetPasswordView />);

    expect(
      screen.getByRole("heading", { name: "문자 인증으로 시작하기" }),
    ).toBeInTheDocument();
    expect(screen.getByText("전화번호")).toBeInTheDocument();
    expect(screen.getByText("인증 코드")).toBeInTheDocument();
    expect(screen.getByText("새 비밀번호")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "비밀번호 만들고 계속하기" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Start")).not.toBeInTheDocument();
  });
});
