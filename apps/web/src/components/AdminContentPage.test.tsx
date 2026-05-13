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
    id: "week-6",
    weekNumber: 6,
    title: "6주차 기본",
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
        storagePath: "/images/week6/hero.jpg",
        altText: "6주차 hero",
        styleKey: "hero-card",
        displayOrder: 1,
        isRequired: false,
        isActive: true,
      },
      {
        id: "asset-2",
        dayNumber: 1,
        assetType: "illustration",
        storagePath: "/images/week6/illustration.jpg",
        altText: "6주차 illustration",
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
        objectPath: "weeks/6/hero.jpg",
        mediaRole: "hero",
        altText: "6주차 대표 이미지",
        sourceFileName: "week6-hero.jpg",
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
                  id: "week-6",
                  weekNumber: 6,
                  title: "6주차 기본",
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

        if (url === "/api/admin/content/weeks/6" && !init?.method) {
          return new Response(JSON.stringify({ week: currentWeekDetail }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (
          url === "/api/admin/content/paraphrases?weekNumber=6" &&
          !init?.method
        ) {
          return new Response(JSON.stringify({ paraphrases: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (url === "/api/admin/content/weeks/6" && init?.method === "PATCH") {
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
              objectPath: "weeks/06/123-cover.png",
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

  it("shows only weeks 6 through 40", async () => {
    currentWeekDetail = createWeekDetail({
      id: "week-6",
      weekNumber: 6,
      title: "6주차 공개",
      babySizeLabel: "레몬",
      babySizeCompareObject: "레몬 한 개",
      status: "published",
      updatedAt: "2026-03-19T00:00:00.000Z",
    });
    global.fetch = jest.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url === "/api/admin/content/weeks" && !init?.method) {
          return new Response(
            JSON.stringify({
              weeks: [
                {
                  id: "week-5",
                  weekNumber: 5,
                  title: "5주차 준비중",
                  babySizeLabel: "참깨",
                  babySizeCompareObject: "참깨 한 알",
                  babySummary: "초기 draft 요약",
                  motherSummary: "초기 draft 요약",
                  heroImagePath: null,
                  compareImagePath: null,
                  status: "draft",
                  updatedAt: "2026-03-18T00:00:00.000Z",
                },
                {
                  id: "week-6",
                  weekNumber: 6,
                  title: "6주차 공개",
                  babySizeLabel: "레몬",
                  babySizeCompareObject: "레몬 한 개",
                  babySummary: "공개 아기 요약",
                  motherSummary: "공개 엄마 요약",
                  heroImagePath: null,
                  compareImagePath: null,
                  status: "published",
                  updatedAt: "2026-03-19T00:00:00.000Z",
                },
                {
                  id: "week-40",
                  weekNumber: 40,
                  title: "40주차 공개",
                  babySizeLabel: "수박",
                  babySizeCompareObject: "수박 한 통",
                  babySummary: "40주 아기 요약",
                  motherSummary: "40주 엄마 요약",
                  heroImagePath: null,
                  compareImagePath: null,
                  status: "published",
                  updatedAt: "2026-03-20T00:00:00.000Z",
                },
                {
                  id: "week-41",
                  weekNumber: 41,
                  title: "41주차 제외",
                  babySizeLabel: "수박",
                  babySizeCompareObject: "수박 한 통",
                  babySummary: "41주 아기 요약",
                  motherSummary: "41주 엄마 요약",
                  heroImagePath: null,
                  compareImagePath: null,
                  status: "published",
                  updatedAt: "2026-03-21T00:00:00.000Z",
                },
              ],
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        if (url === "/api/admin/content/weeks/6" && !init?.method) {
          return new Response(JSON.stringify({ week: currentWeekDetail }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (
          url === "/api/admin/content/paraphrases?weekNumber=6" &&
          !init?.method
        ) {
          return new Response(JSON.stringify({ paraphrases: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        throw new Error(`Unexpected fetch: ${url}`);
      },
    ) as typeof fetch;

    render(
      <AdminContentPage
        adminDisplayName="운영자"
        dashboard={dashboard}
        currentPath="/admin/assets/weeks"
        title="주차 데이터"
        view="weeks"
      />,
    );

    await screen.findByText("6주차 개요");

    expect(
      screen.queryByRole("button", { name: /5주차/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /6주차/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /40주차/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /41주차/ }),
    ).not.toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalledWith("/api/admin/content/weeks/5");
    expect(global.fetch).not.toHaveBeenCalledWith(
      "/api/admin/content/weeks/41",
    );
  });

  it("shows the static baby image for a visible week", async () => {
    render(
      <AdminContentPage
        adminDisplayName="운영자"
        dashboard={dashboard}
        currentPath="/admin/assets/weeks"
        title="주차 데이터"
        view="weeks"
      />,
    );

    await screen.findByText("6주차 개요");

    expect(screen.getByAltText("6주 아기 일러스트")).toBeInTheDocument();
    expect(screen.queryByText("이미지 없음")).not.toBeInTheDocument();
  });

  it("uploads and saves week cover images through signed URLs", async () => {
    render(
      <AdminContentPage
        adminDisplayName="운영자"
        dashboard={dashboard}
        currentPath="/admin/assets/weeks"
        title="주차 데이터"
        view="weeks"
      />,
    );

    await screen.findByText("6주차 개요");
    fireEvent.click(screen.getByRole("button", { name: "상세 편집 열기" }));
    await screen.findByRole("heading", { name: "6주차 편집" });
    fireEvent.mouseDown(screen.getByRole("tab", { name: "이미지" }), {
      button: 0,
      ctrlKey: false,
    });
    expect(await screen.findByText("주차 대표 이미지")).toBeInTheDocument();
    expect(screen.getByText("크기 비교 이미지")).toBeInTheDocument();
    expect(screen.getByAltText("주차 대표 이미지")).toHaveAttribute(
      "src",
      "/week-baby/week-baby-w06.png",
    );
    expect(screen.getByText("크기 비교 이미지가 아직 없어요.")).toBeInTheDocument();
    expect(screen.queryByText("이미지를 불러오지 못했어요.")).not.toBeInTheDocument();

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
        "/api/admin/content/weeks/6",
        expect.objectContaining({
          method: "PATCH",
        }),
      );
    });

    const patchCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url, init]) =>
        url === "/api/admin/content/weeks/6" && init?.method === "PATCH",
    );
    const body = JSON.parse(
      String(patchCall?.[1]?.body),
    ) as AdminWeekUpdateInput;

    expect(body.compareImagePath).toBe(
      "storage://pregnancy-content/weeks/06/123-cover.png",
    );
    expect(body.media).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          mediaRole: "compare",
          objectPath: "weeks/06/123-cover.png",
        }),
      ]),
    );
  });

  it("removes citation markers and line breaks from daily body and checklist copy", async () => {
    currentWeekDetail = createEditableWeekDetail();
    currentWeekDetail.days[0] = {
      ...currentWeekDetail.days[0]!,
      babyDevelopmentItems: ["아기의 심장이\n움직이기 시작해요. (1)(2)"],
      motherChangesItems: [
        "어지러움이 나타날 수 있어요.\n몸 신호를 살펴보세요. (3)",
      ],
    };
    currentWeekDetail.sections[0] = {
      ...currentWeekDetail.sections[0]!,
      title: "태동 패턴을\n기록해 보기. (3)(5)",
      body: "평소와 다른 점을\n적어두면 좋아요. (1)",
    };

    render(
      <AdminContentPage
        adminDisplayName="운영자"
        dashboard={dashboard}
        currentPath="/admin/assets/weeks"
        title="주차 데이터"
        view="weeks"
      />,
    );

    await screen.findByText("6주차 개요");
    fireEvent.click(screen.getByRole("button", { name: "상세 편집 열기" }));
    await screen.findByRole("heading", { name: "6주차 편집" });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/content/weeks/6",
        expect.objectContaining({ method: "PATCH" }),
      ),
    );

    const patchCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url, init]) =>
        url === "/api/admin/content/weeks/6" && init?.method === "PATCH",
    );
    const body = JSON.parse(
      String(patchCall?.[1]?.body),
    ) as AdminWeekUpdateInput;

    expect(body.days[0]?.babyDevelopmentItems).toEqual([
      "아기의 심장이 움직이기 시작해요.",
    ]);
    expect(body.days[0]?.motherChangesItems).toEqual([
      "어지러움이 나타날 수 있어요. 몸 신호를 살펴보세요.",
    ]);
    expect(body.sections[0]?.title).toBe("태동 패턴을 기록해 보기.");
    expect(body.sections[0]?.body).toBe("평소와 다른 점을 적어두면 좋아요.");
  });

  it("hides publish gate and exposure review controls from the week workspace", async () => {
    currentWeekDetail = createPublishReadyWeekDetail();

    render(
      <AdminContentPage
        adminDisplayName="운영자"
        dashboard={dashboard}
        currentPath="/admin/assets/weeks"
        title="주차 데이터"
        view="weeks"
      />,
    );

    await screen.findByText("6주차 개요");
    expect(screen.queryByText("게시 게이트")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "검수 후 게시" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("사용자 노출본 검수")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "상세 편집 열기" }));
    await screen.findByRole("heading", { name: "6주차 편집" });
    expect(screen.queryByRole("tab", { name: "노출본" })).not.toBeInTheDocument();

    const patchCalls = (global.fetch as jest.Mock).mock.calls.filter(
      ([url, init]) =>
        url === "/api/admin/content/weeks/6" && init?.method === "PATCH",
    );
    expect(patchCalls).toHaveLength(0);
  });

  it("keeps status controls out of the overlay and splits editors by tab", async () => {
    render(
      <AdminContentPage
        adminDisplayName="운영자"
        dashboard={dashboard}
        currentPath="/admin/assets/weeks"
        title="주차 데이터"
        view="weeks"
      />,
    );

    await screen.findByText("6주차 개요");
    fireEvent.click(screen.getByRole("button", { name: "상세 편집 열기" }));
    await screen.findByRole("heading", { name: "6주차 편집" });

    expect(
      screen.queryByRole("combobox", { name: "주차 상태" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "게시" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "기본 정보" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "체크리스트" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "질문" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "이미지" })).toBeVisible();
  });

  it("hides week structure controls while preserving stored order", async () => {
    currentWeekDetail = createEditableWeekDetail();

    render(
      <AdminContentPage
        adminDisplayName="운영자"
        dashboard={dashboard}
        currentPath="/admin/assets/weeks"
        title="주차 데이터"
        view="weeks"
      />,
    );

    await screen.findByText("6주차 개요");
    fireEvent.click(screen.getByRole("button", { name: "상세 편집 열기" }));
    await screen.findByRole("heading", { name: "6주차 편집" });
    fireEvent.mouseDown(screen.getByRole("tab", { name: "일별 본문" }), {
      button: 0,
      ctrlKey: false,
    });
    expect(screen.getByRole("heading", { name: "6주 0일" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Day 추가" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Day 아래로" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Day 삭제" }),
    ).not.toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("tab", { name: "체크리스트" }), {
      button: 0,
      ctrlKey: false,
    });

    await screen.findByText("체크리스트 2개");
    expect(screen.queryByText("Day 번호")).not.toBeInTheDocument();
    expect(screen.queryByText("체크리스트 코드")).not.toBeInTheDocument();
    expect(screen.queryByText("필수 여부")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "체크리스트 아래로" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "체크리스트 삭제" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("앱 노출")).toHaveLength(2);

    fireEvent.mouseDown(screen.getByRole("tab", { name: "질문" }), {
      button: 0,
      ctrlKey: false,
    });
    expect(
      screen.queryByRole("button", { name: "질문 아래로" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "질문 삭제" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("앱 노출").length).toBeGreaterThanOrEqual(2);
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/content/weeks/6",
        expect.objectContaining({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining('"title":"6주차 기본"'),
        }),
      );
    });

    const patchCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url, init]) =>
        url === "/api/admin/content/weeks/6" && init?.method === "PATCH",
    );
    const body = JSON.parse(
      String(patchCall?.[1]?.body),
    ) as AdminWeekUpdateInput;

    expect(body.sections).toHaveLength(2);
    expect(body.sections[0].sectionKey).toBe("baby_growth");
    expect(body.sections.map((section) => section.displayOrder)).toEqual([
      1, 2,
    ]);
    expect(body.assets).toHaveLength(2);
    expect(body.assets[0].id).toBe("asset-1");
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
        currentPath="/admin/assets/weeks"
        title="주차 데이터"
        view="weeks"
      />,
    );

    const originalFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "/api/admin/content/weeks/6" && init?.method === "PATCH") {
        return new Promise<Response>((resolve) => {
          resolvePatch = resolve;
        });
      }
      return originalFetch(input, init);
    }) as typeof fetch;

    await screen.findByText("6주차 개요");
    fireEvent.click(screen.getByRole("button", { name: "상세 편집 열기" }));
    await screen.findByRole("heading", { name: "6주차 편집" });
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

    await screen.findByText("6주차 데이터를 저장했습니다.");
  });

  it("preserves persisted rows while hiding destructive operator controls", async () => {
    currentWeekDetail = createEditableWeekDetail();

    render(
      <AdminContentPage
        adminDisplayName="운영자"
        dashboard={dashboard}
        currentPath="/admin/assets/weeks"
        title="주차 데이터"
        view="weeks"
      />,
    );

    await screen.findByText("6주차 개요");
    fireEvent.click(screen.getByRole("button", { name: "상세 편집 열기" }));
    await screen.findByRole("heading", { name: "6주차 편집" });
    fireEvent.mouseDown(screen.getByRole("tab", { name: "체크리스트" }), {
      button: 0,
      ctrlKey: false,
    });

    await screen.findByText("체크리스트 2개");
    expect(
      screen.queryByRole("button", { name: "체크리스트 삭제" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("순서")).not.toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("tab", { name: "이미지" }), {
      button: 0,
      ctrlKey: false,
    });
    expect(screen.getByText("대표 이미지")).toBeVisible();
    expect(screen.queryByText("이미지 매핑")).not.toBeInTheDocument();
    expect(screen.queryByText("Bucket ID")).not.toBeInTheDocument();
    expect(screen.queryByText("Object Path")).not.toBeInTheDocument();
    expect(screen.queryByText("Media Role")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "이미지 삭제" }),
    ).not.toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("tab", { name: "질문" }), {
      button: 0,
      ctrlKey: false,
    });
    expect(
      screen.queryByRole("button", { name: "질문 삭제" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("질문 타입")).not.toBeInTheDocument();
    expect(screen.queryByText("질문 코드")).not.toBeInTheDocument();
    expect(screen.queryByText("순서")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/content/weeks/6",
        expect.objectContaining({ method: "PATCH" }),
      ),
    );

    const patchCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url, init]) =>
        url === "/api/admin/content/weeks/6" && init?.method === "PATCH",
    );
    const body = JSON.parse(
      String(patchCall?.[1]?.body),
    ) as AdminWeekUpdateInput;

    expect(body.sections).toHaveLength(2);
    expect(body.sections.map((section) => section.id)).toEqual([
      "section-1",
      "section-2",
    ]);
    expect(body.assets).toHaveLength(2);
    expect(body.assets.map((asset) => asset.id)).toEqual([
      "asset-1",
      "asset-2",
    ]);
    expect(body.media).toHaveLength(1);
  });
});
