import { render, screen } from "@testing-library/react";

import { MobileResetPasswordView } from "./MobileResetPasswordView";

jest.mock("@/lib/mobile/web-mobile-api", () => ({
}));

jest.mock("./native-bridge", () => ({
  setNativeTitle: jest.fn(),
}));

describe("MobileResetPasswordView", () => {
  it("renders the session reset notice and login link", () => {
    render(<MobileResetPasswordView />);

    expect(
      screen.getByRole("heading", { name: "비밀번호 재설정 단계는 더 이상 필요하지 않습니다" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "로그인 화면으로 이동" }),
    ).toBeInTheDocument();
  });
});
