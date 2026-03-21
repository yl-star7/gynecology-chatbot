import { render, screen } from "@testing-library/react";

import AdminLoginView from "./AdminLoginView";

describe("AdminLoginView", () => {
  it("renders a minimal admin login form", () => {
    render(<AdminLoginView />);

    expect(screen.getByRole("heading", { name: "관리자 로그인" })).toBeInTheDocument();
    expect(screen.getByLabelText("전화번호")).toBeInTheDocument();
    expect(screen.getByLabelText("비밀번호")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그인" })).toBeInTheDocument();
  });
});
