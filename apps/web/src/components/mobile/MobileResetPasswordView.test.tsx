import { render, screen } from "@testing-library/react";

import { MobileResetPasswordView } from "./MobileResetPasswordView";

jest.mock("@/lib/mobile/web-mobile-api", () => ({
  requestPasswordReset: jest.fn(),
  setPassword: jest.fn(),
  verifyPhone: jest.fn(),
}));

jest.mock("./native-bridge", () => ({
  setNativeTitle: jest.fn(),
}));

describe("MobileResetPasswordView", () => {
  it("renders reset flow as two aligned steps with labeled inputs", () => {
    render(<MobileResetPasswordView />);

    expect(
      screen.getByRole("heading", { name: "비밀번호 재설정" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "인증 코드 받기" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "새 비밀번호 저장" }),
    ).toBeInTheDocument();
    expect(screen.getByText("전화번호")).toBeInTheDocument();
    expect(screen.getByText("인증 코드")).toBeInTheDocument();
    expect(screen.getByText("새 비밀번호")).toBeInTheDocument();
    expect(screen.queryByText("Reset Password")).not.toBeInTheDocument();
  });
});
