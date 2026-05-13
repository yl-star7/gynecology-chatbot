import { fireEvent, render, screen } from "@testing-library/react";

import { AdminPoolsSection } from "./AdminPoolsSection";

describe("AdminPoolsSection", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url === "/api/admin/content/home-copy" && !init?.method) {
          return new Response(
            JSON.stringify({
              homeCopyItems: [
                {
                  id: "copy-1",
                  slot: "hero_bubble",
                  variant: null,
                  title: "엄마에게 보내는 말",
                  body: "오늘도 잘 쉬어도 괜찮아요.",
                  status: "published",
                  displayOrder: 1,
                  updatedAt: "2026-05-13T00:00:00.000Z",
                },
              ],
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

  it("hides_the_baby_comfort_pool_tab_from_the_shared_pools_screen", async () => {
    render(<AdminPoolsSection />);

    expect(
      await screen.findByRole("tab", { name: "홈 위안 풀" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: "아기 위안 풀" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("기분별 변주 매트릭스")).not.toBeInTheDocument();
  });

  it("renders_penguin_preview_images_when_the_character_pool_is_opened", async () => {
    render(<AdminPoolsSection />);

    fireEvent.mouseDown(await screen.findByRole("tab", { name: "캐릭터 이미지" }), {
      button: 0,
      ctrlKey: false,
    });

    const neutralPreview = await screen.findByRole("img", {
      name: "기본 이미지 미리보기",
    });
    expect(neutralPreview).toHaveAttribute(
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
