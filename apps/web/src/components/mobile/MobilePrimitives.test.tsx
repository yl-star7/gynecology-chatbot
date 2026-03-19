import { render, screen } from "@testing-library/react";

import {
  MobileCard,
  mobileFieldClassName,
  mobileInsetCardClassName,
} from "./MobilePrimitives";

describe("MobilePrimitives", () => {
  it("defaults cards to the white primary surface", () => {
    render(<MobileCard>본문</MobileCard>);

    expect(screen.getByText("본문").closest("section")).toHaveClass(
      "bg-[var(--panel-strong)]",
    );
  });

  it("exposes dedicated field and inset card helpers", () => {
    expect(mobileFieldClassName).toContain("bg-[var(--field-surface)]");
    expect(mobileInsetCardClassName).toContain("bg-[var(--panel-muted)]");
  });
});
