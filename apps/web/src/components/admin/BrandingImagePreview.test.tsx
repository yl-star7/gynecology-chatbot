import { fireEvent, render, screen } from "@testing-library/react";

import { BrandingImagePreview } from "./BrandingImagePreview";

describe("BrandingImagePreview", () => {
  it("shows the default image when the configured image fails to load", () => {
    render(
      <BrandingImagePreview
        src="https://storage.googleapis.com/branding-content/test.png"
        alt="마스코트 미리보기"
        fallbackSrc="https://storage.googleapis.com/pregnancy-content/assets/penguin-nurse/app/neutral.png"
        fallbackAlt="기본 마스코트 미리보기"
      />,
    );

    fireEvent.error(screen.getByRole("img", { name: "마스코트 미리보기" }));

    const fallbackImage = screen.getByRole("img", {
      name: "기본 마스코트 미리보기",
    });
    expect(fallbackImage).toHaveAttribute(
      "src",
      "https://storage.googleapis.com/pregnancy-content/assets/penguin-nurse/app/neutral.png",
    );
  });

  it("shows a clear placeholder when both configured and default images fail", () => {
    render(
      <BrandingImagePreview
        src="https://storage.googleapis.com/branding-content/test.png"
        alt="마스코트 미리보기"
        fallbackSrc="https://storage.googleapis.com/pregnancy-content/assets/penguin-nurse/app/neutral.png"
        fallbackAlt="기본 마스코트 미리보기"
      />,
    );

    fireEvent.error(screen.getByRole("img", { name: "마스코트 미리보기" }));
    fireEvent.error(
      screen.getByRole("img", { name: "기본 마스코트 미리보기" }),
    );

    expect(screen.getByText("이미지 확인 필요")).toBeInTheDocument();
  });
});
