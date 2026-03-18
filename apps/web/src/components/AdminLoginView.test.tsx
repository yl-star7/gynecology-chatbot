import { render, screen } from "@testing-library/react";

import AdminLoginView from "./AdminLoginView";

describe("AdminLoginView", () => {
  it("renders the admin login as an operator access gate", () => {
    render(<AdminLoginView />);

    expect(
      screen.getByRole("heading", { name: "운영 콘솔 인증" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("권한이 확인된 운영 계정만 접근할 수 있습니다."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "권한 확인" })).toBeInTheDocument();
  });
});
