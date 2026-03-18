import type { ReactElement } from "react";

import { DEFAULT_MOBILE_THEME_KEY } from "@gynecology-chatbot/app-core";

import RootLayout from "./layout";

describe("RootLayout", () => {
  test("sets the default mobile theme on the html element", () => {
    const layout = RootLayout({
      children: <div>child</div>,
    }) as ReactElement<Record<string, unknown>>;

    expect(layout.props.lang).toBe("ko");
    expect(layout.props["data-theme"]).toBe(DEFAULT_MOBILE_THEME_KEY);
    expect(layout.props.suppressHydrationWarning).toBe(true);
  });
});
