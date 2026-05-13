import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

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

        if (
          url === "/api/admin/content/media/upload" &&
          init?.method === "POST"
        ) {
          const formData = init.body as FormData;
          const objectPath =
            String(formData.get("objectPath") ?? "") ||
            "weeks/00/123-mascot.png";

          return new Response(
            JSON.stringify({
              ok: true,
              bucketId: "pregnancy-content",
              objectPath,
              sourceFileName: "custom.png",
              signedUrl: "https://upload.example.test/signed",
              contentType: "image/png",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        if (
          url === "https://upload.example.test/signed" &&
          init?.method === "PUT"
        ) {
          return new Response(null, { status: 200 });
        }

        if (url === "/api/admin/branding" && init?.method === "PUT") {
          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (
          url === "/api/admin/branding/character-images" &&
          init?.method === "PUT"
        ) {
          const body = JSON.parse(String(init.body));
          return new Response(
            JSON.stringify({
              ok: true,
              config: {
                version: "v2",
                images: body.images,
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

  it("rejects oversized mascot images before requesting an upload URL", async () => {
    render(<AdminOpsBrandingPanel />);

    const input = await screen.findByLabelText("마스코트 업로드");
    const file = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "large.png", {
      type: "image/png",
    });
    fireEvent.change(input, { target: { files: [file] } });

    expect(
      await screen.findByText("이미지는 2MB 이하로 올려주세요."),
    ).toBeInTheDocument();
    const uploadCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url, init]) =>
        url === "/api/admin/content/media/upload" && init?.method === "POST",
    );
    expect(uploadCall).toBeUndefined();
  });

  it("stores custom character images without overwriting the default penguin asset", async () => {
    render(<AdminOpsBrandingPanel />);

    const input = await screen.findByLabelText("차분 이미지");
    const file = new File(["image"], "calm-custom.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "https://upload.example.test/signed",
        expect.objectContaining({
          method: "PUT",
          body: file,
        }),
      );
    });

    const uploadCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url, init]) =>
        url === "/api/admin/content/media/upload" && init?.method === "POST",
    );
    const formData = uploadCall?.[1]?.body as FormData;
    expect(formData.get("mediaScope")).toBe("asset");
    expect(String(formData.get("objectPath"))).toMatch(
      /^assets\/penguin-nurse\/custom\/calm-/,
    );
    expect(formData.get("objectPath")).not.toBe(
      "assets/penguin-nurse/app/calm.png",
    );
  });

  it("restores mascot and character images to the default penguin assets", async () => {
    render(<AdminOpsBrandingPanel />);

    const mascotCard = await screen.findByTestId("mascot-image-card");
    fireEvent.click(
      within(mascotCard).getByRole("button", { name: "기본 이미지로 설정" }),
    );

    await waitFor(() => {
      const brandingSaveCall = (global.fetch as jest.Mock).mock.calls.find(
        ([url, init]) =>
          url === "/api/admin/branding" && init?.method === "PUT",
      );
      expect(brandingSaveCall).toBeTruthy();
      expect(JSON.parse(String(brandingSaveCall?.[1]?.body))).toEqual(
        expect.objectContaining({
          mascotBucketId: "pregnancy-content",
          mascotObjectPath: "assets/penguin-nurse/app/neutral.png",
          mascotSourceFileName: "neutral.png",
          mascotAltText: "펭귄 간호사",
        }),
      );
    });

    const calmCard = await screen.findByTestId("character-image-card-calm");
    fireEvent.click(
      within(calmCard).getByRole("button", { name: "기본 이미지로 설정" }),
    );

    await waitFor(() => {
      const characterSaveCall = (global.fetch as jest.Mock).mock.calls.find(
        ([url, init]) =>
          url === "/api/admin/branding/character-images" &&
          init?.method === "PUT",
      );
      expect(characterSaveCall).toBeTruthy();
      expect(JSON.parse(String(characterSaveCall?.[1]?.body)).images.calm).toBe(
        "https://storage.googleapis.com/pregnancy-content/assets/penguin-nurse/app/calm.png",
      );
    });
  });
});
