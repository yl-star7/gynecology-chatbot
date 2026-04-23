import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type {
  AdminDashboardData,
  AdminWeekDetail,
  AdminWeekUpdateInput,
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

function createEditableWeekDetail(): AdminWeekDetail {
  return createWeekDetail({
    days: [
      {
        id: "day-1",
        dayNumber: 1,
        title: "Day 1",
        babyDevelopmentItems: ["작은 변화가 시작됩니다."],
        babyMessage: "엄마, 안녕하세요.",
        motherChangesItems: ["몸의 변화를 느낄 수 있습니다."],
        displayOrder: 1,
      },
    ],
    sections: [
      {
        id: "section-1",
        dayNumber: 1,
        sectionKey: "baby_growth",
        title: "아기 성장",
        body: "아주 작은 크기로 성장합니다.",
        displayOrder: 1,
        isRequired: true,
        isActive: true,
      },
      {
        id: "section-2",
        dayNumber: 1,
        sectionKey: "mother_change",
        title: "산모 변화",
        body: "몸의 변화를 정리합니다.",
        displayOrder: 2,
        isRequired: false,
        isActive: true,
      },
    ],
    assets: [
      {
        id: "asset-1",
        dayNumber: 1,
        assetType: "hero",
        storagePath: "/images/week1/hero.jpg",
        altText: "1주차 hero",
        styleKey: "hero-card",
        displayOrder: 1,
        isRequired: false,
        isActive: true,
      },
      {
        id: "asset-2",
        dayNumber: 1,
        assetType: "illustration",
        storagePath: "/images/week1/illustration.jpg",
        altText: "1주차 illustration",
        styleKey: "detail-card",
        displayOrder: 2,
        isRequired: false,
        isActive: true,
      },
    ],
    media: [
      {
        id: "media-1",
        dayNumber: null,
        mediaScope: "week",
        bucketId: "pregnancy-content",
        objectPath: "weeks/1/hero.jpg",
        mediaRole: "hero",
        altText: "1주차 대표 이미지",
        sourceFileName: "week1-hero.jpg",
        displayOrder: 1,
      },
    ],
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

        if (
          url === "/api/admin/content/paraphrases?weekNumber=1" &&
          !init?.method
        ) {
          return new Response(JSON.stringify({ paraphrases: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (url === "/api/admin/content/weeks/1" && init?.method === "PATCH") {
          const payload = JSON.parse(String(init.body)) as AdminWeekUpdateInput;
          currentWeekDetail = {
            ...currentWeekDetail,
            ...(payload as unknown as Partial<AdminWeekDetail>),
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

  it("shows a placeholder when the selected week has no static baby image", async () => {
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

    expect(screen.getByText("이미지 없음")).toBeInTheDocument();
    expect(screen.queryByAltText("1주 아기 일러스트")).not.toBeInTheDocument();
  });

  it("uploads and saves week cover images through signed URLs", async () => {
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
    expect(screen.getByText("주차 대표 이미지")).toBeInTheDocument();
    expect(screen.getByText("크기 비교 이미지")).toBeInTheDocument();

    const fileInputs = document.querySelectorAll('input[type="file"]');
    expect(fileInputs.length).toBeGreaterThanOrEqual(2);

    const file = new File(["cover"], "cover.png", { type: "image/png" });
    fireEvent.change(fileInputs[1] as HTMLInputElement, {
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

    await screen.findAllByText(
      "비교 이미지를 업로드했습니다. 주차 저장을 눌러 반영해 주세요.",
    );
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/content/weeks/1",
        expect.objectContaining({
          method: "PATCH",
        }),
      );
    });

    const patchCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url, init]) =>
        url === "/api/admin/content/weeks/1" && init?.method === "PATCH",
    );
    const body = JSON.parse(
      String(patchCall?.[1]?.body),
    ) as AdminWeekUpdateInput;

    expect(body.compareImagePath).toBe(
      "storage://pregnancy-content/weeks/01/123-cover.png",
    );
    expect(body.media).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          mediaRole: "compare",
          objectPath: "weeks/01/123-cover.png",
        }),
      ]),
    );
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

  it("keeps published status out of the overlay selector so publishing only uses the gate", async () => {
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
      .getAllByRole("combobox")
      .find((select) =>
        !Array.from((select as HTMLSelectElement).options)
          .map((option) => option.value)
          .includes("all"),
      );

    expect(statusSelect).toBeDefined();

    expect(
      Array.from((statusSelect as HTMLSelectElement).options).map(
        (option) => option.value,
      ),
    ).not.toContain("published");
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

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

  it("supports week row actions and keeps displayOrder in sync", async () => {
    currentWeekDetail = createEditableWeekDetail();

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

    const sectionDownButton = screen
      .getAllByRole("button", { name: "체크리스트 아래로" })
      .find((button) => !(button as HTMLButtonElement).disabled);
    const assetDownButton = screen
      .getAllByRole("button", { name: "질문 아래로" })
      .find((button) => !(button as HTMLButtonElement).disabled);

    expect(sectionDownButton).toBeDefined();
    expect(assetDownButton).toBeDefined();

    fireEvent.click(sectionDownButton!);
    fireEvent.click(assetDownButton!);
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/content/weeks/1",
        expect.objectContaining({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining('"title":"1주차 기본"'),
        }),
      );
    });

    const patchCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url, init]) =>
        url === "/api/admin/content/weeks/1" && init?.method === "PATCH",
    );
    const body = JSON.parse(
      String(patchCall?.[1]?.body),
    ) as AdminWeekUpdateInput;

    expect(body.sections).toHaveLength(2);
    expect(body.sections[0].sectionKey).toBe("mother_change");
    expect(body.sections.map((section) => section.displayOrder)).toEqual([
      1, 2,
    ]);
    expect(body.assets).toHaveLength(2);
    expect(body.assets[0].assetType).toBe("illustration");
    expect(body.assets.map((asset) => asset.displayOrder)).toEqual([1, 2]);
    expect(body.days).toHaveLength(1);
    expect(body.media).toHaveLength(1);
  });

  it("keeps the week save button busy while the save request is pending", async () => {
    currentWeekDetail = createEditableWeekDetail();
    let resolvePatch: ((response: Response) => void) | null = null;

    render(
      <AdminContentPage
        adminDisplayName="운영자"
        dashboard={dashboard}
        currentPath="/admin/content/weeks"
        title="주차 데이터"
        view="weeks"
      />,
    );

    const originalFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "/api/admin/content/weeks/1" && init?.method === "PATCH") {
        return new Promise<Response>((resolve) => {
          resolvePatch = resolve;
        });
      }
      return originalFetch(input, init);
    }) as typeof fetch;

    await screen.findByText("1주차 개요");
    fireEvent.click(screen.getByRole("button", { name: "상세 편집 열기" }));
    await screen.findByRole("heading", { name: "1주차 편집" });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();

    await waitFor(() => expect(resolvePatch).not.toBeNull());
    resolvePatch!(
      new Response(
        JSON.stringify({
          week: {
            ...currentWeekDetail,
            updatedAt: "2026-03-18T01:00:00.000Z",
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await screen.findByText("1주차 데이터를 저장했습니다.");
  });

  it("allows deleting persisted week sections and assets before saving", async () => {
    currentWeekDetail = createEditableWeekDetail();

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

    expect(
      screen.getAllByRole("button", { name: "체크리스트 삭제" }),
    ).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "질문 삭제" })).toHaveLength(
      2,
    );

    fireEvent.click(
      screen.getAllByRole("button", { name: "체크리스트 삭제" })[0],
    );
    fireEvent.click(screen.getAllByRole("button", { name: "질문 삭제" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/content/weeks/1",
        expect.objectContaining({ method: "PATCH" }),
      ),
    );

    const patchCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url, init]) =>
        url === "/api/admin/content/weeks/1" && init?.method === "PATCH",
    );
    const body = JSON.parse(
      String(patchCall?.[1]?.body),
    ) as AdminWeekUpdateInput;

    expect(body.sections).toHaveLength(1);
    expect(body.sections[0].id).toBe("section-2");
    expect(body.assets).toHaveLength(1);
    expect(body.assets[0].id).toBe("asset-2");
  });
});
