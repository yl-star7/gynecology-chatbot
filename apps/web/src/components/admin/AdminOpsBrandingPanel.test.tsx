import { render, screen } from "@testing-library/react";

import { AdminOpsBrandingPanel } from "./AdminOpsBrandingPanel";

describe("AdminOpsBrandingPanel", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url === "/api/admin/branding" && !init?.method) {
          return new Response(
            JSON.stringify({
              mascotBucketId: null,
              mascotObjectPath: "assets/penguin-nurse/app/neutral.png",
              mascotSourceFileName: "neutral.png",
              mascotAltText: "마스코트",
              surveyFormUrl: null,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        if (url === "/api/admin/branding/character-images" && !init?.method) {
          return new Response(
            JSON.stringify({
              version: "v1",
              images: {
                neutral:
                  "https://storage.googleapis.com/pregnancy-content/assets/penguin-nurse/app/neutral.png",
                calm: "https://storage.googleapis.com/pregnancy-content/assets/penguin-nurse/app/calm.png",
                joyful:
                  "https://storage.googleapis.com/pregnancy-content/assets/penguin-nurse/app/joyful.png",
                anxious:
                  "https://storage.googleapis.com/pregnancy-content/assets/penguin-nurse/app/anxious.png",
                tired:
                  "https://storage.googleapis.com/pregnancy-content/assets/penguin-nurse/app/tired.png",
                sad: "https://storage.googleapis.com/pregnancy-content/assets/penguin-nurse/app/sad.png",
              },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        throw new Error(`Unexpected fetch: ${url}`);
      },
    ) as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("renders image previews for the mascot and character cache", async () => {
    render(<AdminOpsBrandingPanel />);

    const mascotPreview = await screen.findByRole("img", {
      name: "FAB 마스코트 미리보기",
    });
    expect(mascotPreview).toHaveAttribute(
      "src",
      "https://storage.googleapis.com/pregnancy-content/assets/penguin-nurse/app/neutral.png",
    );

    expect(
      screen.getByRole("img", { name: "기본 이미지 미리보기" }),
    ).toHaveAttribute(
      "src",
      "https://storage.googleapis.com/pregnancy-content/assets/penguin-nurse/app/neutral.png",
    );
    expect(
      screen.getByRole("img", { name: "차분 이미지 미리보기" }),
    ).toHaveAttribute(
      "src",
      "https://storage.googleapis.com/pregnancy-content/assets/penguin-nurse/app/calm.png",
    );
  });
});
