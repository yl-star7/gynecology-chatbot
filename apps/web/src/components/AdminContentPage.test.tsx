import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { AdminDashboardData, AdminWeekDetail } from "@gynecology-chatbot/app-core";

import AdminContentPage from "./AdminContentPage";

const dashboard: AdminDashboardData = {
  metrics: [],
  managedUsers: [],
  recoveryActions: [],
  ragDocuments: [],
  workflowRules: [],
  historyUsers: [],
  userActions: [],
};

const weekDetail: AdminWeekDetail = {
  id: "week-1",
  weekNumber: 1,
  title: "1주차 기본",
  babySizeLabel: "참깨",
  babySizeCompareObject: "참깨 한 알",
  babySummary: "작은 변화가 시작됩니다.",
  motherSummary: "몸의 변화를 느낄 수 있습니다.",
  heroImagePath: null,
  compareImagePath: null,
  status: "published",
  updatedAt: "2026-03-18T00:00:00.000Z",
  days: [],
  sections: [],
  assets: [],
  media: [],
};

describe("AdminContentPage", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/admin/content/weeks" && !init?.method) {
        return new Response(
          JSON.stringify({
            weeks: [
              {
                id: "week-1",
                weekNumber: 1,
                title: "1주차 기본",
                babySizeLabel: "참깨",
                babySizeCompareObject: "참깨 한 알",
                babySummary: "작은 변화가 시작됩니다.",
                motherSummary: "몸의 변화를 느낄 수 있습니다.",
                heroImagePath: null,
                compareImagePath: null,
                status: "published",
                updatedAt: "2026-03-18T00:00:00.000Z",
              },
            ],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (url === "/api/admin/content/weeks/1" && !init?.method) {
        return new Response(JSON.stringify({ week: weekDetail }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url === "/api/admin/content/media/upload" && init?.method === "POST") {
        return new Response(
          JSON.stringify({
            ok: true,
            bucketId: "pregnancy-content",
            objectPath: "weeks/01/123-cover.png",
            sourceFileName: "cover.png",
            signedUrl: "https://upload.example.test/week-cover",
            contentType: "image/png",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (url === "https://upload.example.test/week-cover" && init?.method === "PUT") {
        return new Response(null, { status: 200 });
      }

      if (url === "/api/admin/auth/logout" && init?.method === "POST") {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    }) as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("uploads week cover images through signed URLs", async () => {
    render(
      <AdminContentPage
        adminDisplayName="운영자"
        dashboard={dashboard}
        currentPath="/admin/content/weeks"
        title="주차 데이터"
        view="weeks"
      />,
    );

    await screen.findByText("1주차 개요");
    fireEvent.click(screen.getByRole("button", { name: "상세 편집 열기" }));
    await screen.findByRole("heading", { name: "1주차 편집" });

    const fileInputs = document.querySelectorAll('input[type="file"]');
    expect(fileInputs.length).toBeGreaterThanOrEqual(2);

    const file = new File(["cover"], "cover.png", { type: "image/png" });
    fireEvent.change(fileInputs[0] as HTMLInputElement, {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "https://upload.example.test/week-cover",
        expect.objectContaining({
          method: "PUT",
          body: file,
        }),
      );
    });
  });
});
