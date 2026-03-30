import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AdminOperationsPanel } from "./AdminOperationsPanel";

describe("AdminOperationsPanel", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/admin/rag-provider" && !init?.method) {
        return new Response(JSON.stringify({ ragProvider: "auto" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url === "/api/admin/schedule" && !init?.method) {
        return new Response(
          JSON.stringify({
            dailyCheckEnabled: false,
            dailyCheckTime: "09:00",
            weeklyMilestoneEnabled: false,
            weeklyMilestoneTime: "10:00",
            weeklyMilestoneDay: 1,
            checkupReminderEnabled: false,
            checkupReminderTime: "08:00",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (url === "/api/admin/branding" && !init?.method) {
        return new Response(
          JSON.stringify({
            mascotBucketId: null,
            mascotObjectPath: null,
            mascotSourceFileName: null,
            mascotAltText: "마스코트",
            surveyFormUrl: null,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (url === "/api/admin/content/media/upload" && init?.method === "POST") {
        return new Response(
          JSON.stringify({
            ok: true,
            bucketId: "branding-assets",
            objectPath: "weeks/00/123-mascot.png",
            sourceFileName: "mascot.png",
            signedUrl: "https://upload.example.test/signed",
            contentType: "image/png",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (url === "https://upload.example.test/signed" && init?.method === "PUT") {
        return new Response(null, { status: 200 });
      }

      if (url === "/api/admin/branding" && init?.method === "PUT") {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url === "/api/admin/schift" && !init?.method) {
        return new Response(
          JSON.stringify({
            collections: [
              { id: "col1", name: "pregnancy-knowledge", vector_count: 759, model: "schift-embed-1", dimension: 1024 },
            ],
            workflows: [
              { id: "wf1", name: "내부 데이터 응답", description: "임신 지식 RAG", status: "published", block_count: 5, updated_at: "2026-03-26T02:25:59Z" },
            ],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      throw new Error(`Unexpected fetch: ${url}`);
    }) as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("uploads mascot files through signed URLs before saving branding", async () => {
    render(<AdminOperationsPanel />);

    const input = await screen.findByLabelText("마스코트 업로드");
    const file = new File(["image"], "mascot.png", { type: "image/png" });
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

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/branding",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          mascotBucketId: "branding-assets",
          mascotObjectPath: "weeks/00/123-mascot.png",
          mascotSourceFileName: "mascot.png",
          mascotAltText: "마스코트",
          surveyFormUrl: null,
        }),
      }),
    );
  });

  it("saves the survey form url through branding settings", async () => {
    render(<AdminOperationsPanel />);

    const input = await screen.findByLabelText("설문 링크");
    fireEvent.change(input, {
      target: { value: "https://docs.google.com/forms/d/e/example/viewform" },
    });

    fireEvent.click(screen.getByRole("button", { name: "설문 링크 저장" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/branding",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({
            mascotBucketId: null,
            mascotObjectPath: null,
            mascotSourceFileName: null,
            mascotAltText: "마스코트",
            surveyFormUrl: "https://docs.google.com/forms/d/e/example/viewform",
          }),
        }),
      );
    });
  });
});
