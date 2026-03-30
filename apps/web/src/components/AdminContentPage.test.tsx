import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type {
  AdminDashboardData,
  AdminWeekDetail,
} from "@gynecology-chatbot/app-core";

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

function createWeekDetail(
  overrides: Partial<AdminWeekDetail> = {},
): AdminWeekDetail {
  return {
    id: "week-1",
    weekNumber: 1,
    title: "1주차 기본",
    babySizeLabel: "참깨",
    babySizeCompareObject: "참깨 한 알",
    babySummary: "작은 변화가 시작됩니다.",
    motherSummary: "몸의 변화를 느낄 수 있습니다.",
    heroImagePath: null,
    compareImagePath: null,
    status: "draft",
    updatedAt: "2026-03-18T00:00:00.000Z",
    days: [],
    sections: [],
    assets: [],
    media: [],
    ...overrides,
  };
}

function createPublishReadyWeekDetail(): AdminWeekDetail {
  return createWeekDetail({
    days: Array.from({ length: 7 }, (_, index) => ({
      id: `day-${index + 1}`,
      dayNumber: index + 1,
      title: `Day ${index + 1}`,
      babyDevelopmentItems: [`아기 변화 ${index + 1}`],
      babyMessage: `아기 메시지 ${index + 1}`,
      motherChangesItems: [`엄마 변화 ${index + 1}`],
      displayOrder: index + 1,
    })),
    sections: Array.from({ length: 7 }, (_, index) => ({
      id: `section-${index + 1}`,
      dayNumber: index + 1,
      sectionKey: `check-${index + 1}`,
      title: `체크리스트 ${index + 1}`,
      body: `체크 본문 ${index + 1}`,
      displayOrder: index + 1,
      isRequired: true,
      isActive: true,
    })),
    assets: Array.from({ length: 7 }, (_, index) => ({
      id: `asset-${index + 1}`,
      dayNumber: index + 1,
      assetType: "question",
      storagePath: `질문 ${index + 1}`,
      altText: null,
      styleKey: `question-${index + 1}`,
      displayOrder: index + 1,
      isRequired: true,
      isActive: true,
    })),
  });
}

describe("AdminContentPage", () => {
  const originalFetch = global.fetch;
  let currentWeekDetail: AdminWeekDetail;

  beforeEach(() => {
    currentWeekDetail = createWeekDetail();
    global.fetch = jest.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
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
          return new Response(JSON.stringify({ week: currentWeekDetail }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (url === "/api/admin/content/weeks/1" && init?.method === "PATCH") {
          const payload = JSON.parse(String(init.body)) as AdminWeekDetail;
          currentWeekDetail = {
            ...currentWeekDetail,
            ...payload,
            status: payload.status,
          };

          return new Response(JSON.stringify({ week: currentWeekDetail }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (
          url === "/api/admin/content/media/upload" &&
          init?.method === "POST"
        ) {
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

        if (
          url === "https://upload.example.test/week-cover" &&
          init?.method === "PUT"
        ) {
          return new Response(null, { status: 200 });
        }

        if (url === "/api/admin/auth/logout" && init?.method === "POST") {
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }

        throw new Error(`Unexpected fetch: ${url}`);
      },
    ) as typeof fetch;
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
    expect(fileInputs.length).toBeGreaterThanOrEqual(1);

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

  it("publishes a review-ready week through the explicit publish gate", async () => {
    currentWeekDetail = createPublishReadyWeekDetail();

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
    fireEvent.click(screen.getByRole("button", { name: "검수 후 게시" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/content/weeks/1",
        expect.objectContaining({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: expect.any(String),
        }),
      );
    });

    const patchCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url, init]) =>
        url === "/api/admin/content/weeks/1" && init?.method === "PATCH",
    );

    expect(patchCall).toBeDefined();
    expect(JSON.parse(String(patchCall?.[1]?.body))).toEqual(
      expect.objectContaining({ status: "published" }),
    );
    await screen.findByText("1주차를 검수 후 게시했습니다.");
  });

  it("blocks publishing when the week is not review-ready", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: "검수 후 게시" }));

    await screen.findByText(
      "게시 전에 검수 보드의 빈 항목을 먼저 채워 주세요.",
    );
    const patchCalls = (global.fetch as jest.Mock).mock.calls.filter(
      ([url, init]) =>
        url === "/api/admin/content/weeks/1" && init?.method === "PATCH",
    );
    expect(patchCalls).toHaveLength(0);
  });

  it("prevents the overlay status selector from bypassing the publish gate", async () => {
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
    const statusSelect = screen
      .getAllByRole("combobox", { name: "상태" })
      .at(-1);

    expect(statusSelect).toBeDefined();

    fireEvent.change(statusSelect as HTMLElement, {
      target: { value: "published" },
    });

    await screen.findByText("게시는 검수 후 게시 버튼으로만 진행해 주세요.");
    fireEvent.click(screen.getByRole("button", { name: "주차 저장" }));

    await waitFor(() => {
      const patchCall = (global.fetch as jest.Mock).mock.calls.find(
        ([url, init]) =>
          url === "/api/admin/content/weeks/1" && init?.method === "PATCH",
      );

      expect(patchCall).toBeDefined();
      expect(JSON.parse(String(patchCall?.[1]?.body))).toEqual(
        expect.objectContaining({ status: "draft" }),
      );
    });
  });
});
