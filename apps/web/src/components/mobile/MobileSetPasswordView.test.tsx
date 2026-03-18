import { render, screen } from "@testing-library/react";

import { MobileSetPasswordView } from "./MobileSetPasswordView";

jest.mock("@/lib/mobile/web-mobile-api", () => ({
  appendUserIdToPath: jest.fn((path: string, userId?: string | null) =>
    userId ? `${path}?userId=${userId}` : path,
  ),
}));

jest.mock("./native-bridge", () => ({
  setNativeTitle: jest.fn(),
}));

describe("MobileSetPasswordView", () => {
  it("explains the phone verification flow and links back to login", () => {
    render(<MobileSetPasswordView />);

    expect(
      screen.getByRole("heading", { name: "비밀번호 설정 단계는 제거되었습니다" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "로그인 화면으로 이동" }),
    ).toBeInTheDocument();
  });
});
