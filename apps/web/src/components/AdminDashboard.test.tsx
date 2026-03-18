import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import type {
  AdminDashboardData,
  AdminWeekDetail,
  AdminWeekSummary,
  AdminWeekUpdateInput,
} from "@gynecology-chatbot/app-core";

import AdminDashboard from "./AdminDashboard";

const dashboard: AdminDashboardData = {
  metrics: [
    {
      id: "active-users",
      label: "활성 사용자",
      value: "128",
      changeLabel: "최근 7일 +12%",
    },
    {
      id: "daily-chats",
      label: "채팅 세션",
      value: "342",
      changeLabel: "오늘 48건",
    },
    {
      id: "recovery",
      label: "복구 요청",
      value: "6",
      changeLabel: "오늘 2건",
    },
    {
      id: "rag-ready",
      label: "준비 문서",
      value: "24",
      changeLabel: "배포 대기 1건",
    },
  ],
  managedUsers: [
    {
      id: "user-1",
      name: "김수연",
      phoneNumber: "01012345678",
      status: "attention",
      latestIssue: "비밀번호 재설정 대기",
    },
  ],
  recoveryActions: [
    {
      id: "recovery-1",
      userName: "김수연",
      action: "password_reset",
      requestedAt: "2026. 3. 17. 오후 6:00:00",
      status: "completed",
    },
  ],
  ragDocuments: [
    {
      id: "rag-1",
      title: "임신 18주 복통 가이드",
      pregnancyWeekLabel: "18주차",
      category: "symptom",
      chunkCount: 4,
      updatedAt: "2026. 3. 17. 오후 7:00:00",
      status: "ready",
    },
  ],
  workflowRules: [
    {
      id: "workflow-1",
      name: "응급 증상 우선 라우팅",
      trigger: "복통, 출혈, 시야 흐림",
      retrievalScope: "응급 문서 우선",
      modelName: "gemini-2.5-flash-lite",
      status: "active",
    },
  ],
  historyUsers: [
    {
      id: "user-1",
      name: "김수연",
      phoneNumber: "01012345678",
      pregnancyWeekLabel: "18주 2일",
      latestSessionLabel: "방금 전",
      sessions: [
        {
          id: "session-1",
          title: "복통 채팅",
          updatedAtLabel: "방금 전",
          pregnancyWeekLabel: "18주 2일",
          messages: [
            {
              id: "message-1",
              role: "user",
              createdAtLabel: "18:00",
              summary: "복통이 있어요",
            },
          ],
        },
      ],
    },
  ],
  userActions: [
    {
      id: "action-1",
      userId: "user-1",
      userName: "김수연",
      actionType: "phone_verification_started",
      actionLabel: "초기 계정 인증 요청",
      detail: "초기 계정 설정 절차에서 인증 코드를 발송했습니다.",
      occurredAtLabel: "방금 전",
      sessionId: null,
      sessionTitle: null,
    },
  ],
};

const weekSummary: AdminWeekSummary = {
  id: "week-1",
  weekNumber: 1,
  title: "1주차 기본",
  babySizeLabel: "참깨",
  babySizeCompareObject: "참깨 한 알",
  babySummary: "작은 변화가 시작됩니다.",
  motherSummary: "몸의 변화를 느낄 수 있습니다.",
  heroImagePath: "/images/week1/hero.jpg",
  compareImagePath: "/images/week1/compare.jpg",
  status: "published",
  updatedAt: "2026-03-18T00:00:00.000Z",
};

const baseWeekDetail: AdminWeekDetail = {
  id: "week-1",
  weekNumber: 1,
  title: "1주차 기본",
  babySizeLabel: "참깨",
  babySizeCompareObject: "참깨 한 알",
  babySummary: "작은 변화가 시작됩니다.",
  motherSummary: "몸의 변화를 느낄 수 있습니다.",
  heroImagePath: "/images/week1/hero.jpg",
  compareImagePath: "/images/week1/compare.jpg",
  status: "published",
  updatedAt: "2026-03-18T00:00:00.000Z",
  sections: [
    {
      id: "section-1",
      sectionKey: "baby_growth",
      title: "아기 성장",
      body: "아주 작은 크기로 성장합니다.",
      displayOrder: 1,
      isRequired: true,
    },
    {
      id: "section-2",
      sectionKey: "mother_change",
      title: "산모 변화",
      body: "몸의 변화를 정리합니다.",
      displayOrder: 2,
      isRequired: false,
    },
  ],
  assets: [
    {
      id: "asset-1",
      assetType: "hero",
      storagePath: "/images/week1/hero.jpg",
      altText: "1주차 hero",
      styleKey: "hero-card",
      displayOrder: 1,
    },
    {
      id: "asset-2",
      assetType: "illustration",
      storagePath: "/images/week1/illustration.jpg",
      altText: "1주차 illustration",
      styleKey: "detail-card",
      displayOrder: 2,
    },
  ],
};

function createJsonResponse(payload: unknown, ok = true): Promise<Response> {
  return Promise.resolve({
    ok,
    json: async () => payload,
  } as Response);
}

describe("AdminDashboard", () => {
  const originalFetch = global.fetch;
  let currentWeekDetail: AdminWeekDetail;
  let patchWeekDetail: (body: AdminWeekUpdateInput) => Promise<Response>;

  beforeEach(() => {
    currentWeekDetail = {
      ...baseWeekDetail,
      sections: [...baseWeekDetail.sections],
      assets: [...baseWeekDetail.assets],
    };
    patchWeekDetail = async (body: AdminWeekUpdateInput) => {
      currentWeekDetail = {
        ...currentWeekDetail,
        ...body,
        sections: body.sections.map((section, index) => ({
          id: section.id ?? `section-${index + 1}`,
          sectionKey: section.sectionKey,
          title: section.title,
          body: section.body,
          displayOrder: section.displayOrder,
          isRequired: section.isRequired,
        })),
        assets: body.assets.map((asset, index) => ({
          id: asset.id ?? `asset-${index + 1}`,
          assetType: asset.assetType,
          storagePath: asset.storagePath,
          altText: asset.altText,
          styleKey: asset.styleKey,
          displayOrder: asset.displayOrder,
        })),
        updatedAt: "2026-03-18T01:00:00.000Z",
      };

      return createJsonResponse({ week: currentWeekDetail });
    };

    global.fetch = jest.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.pathname
            : input.url;
      const pathname = url.startsWith("http") ? new URL(url).pathname : url;

      if (pathname === "/api/admin/content/weeks" && !init?.method) {
        return createJsonResponse({ weeks: [weekSummary] });
      }

      if (pathname === "/api/admin/content/weeks/1" && !init?.method) {
        return createJsonResponse({ week: currentWeekDetail });
      }

      if (pathname === "/api/admin/content/weeks/1" && init?.method === "PATCH") {
        const body = JSON.parse(String(init.body)) as AdminWeekUpdateInput;
        return patchWeekDetail(body);
      }

      if (pathname === "/api/admin/auth/logout" && init?.method === "POST") {
        return createJsonResponse({}, true);
      }

      throw new Error(`Unexpected fetch call: ${pathname}`);
    }) as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("renders a carbon-style operations console structure", async () => {
    render(
      <AdminDashboard dashboard={dashboard} adminDisplayName="운영자 김" />,
    );

    expect(
      screen.getByRole("heading", { name: "운영 제어 센터" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "운영 상태" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "계정 조치 큐" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "운영 감사 로그" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "지식 문서 관리" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "주차별 데이터 관리" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "응답 정책" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "실시간 사용자 이벤트" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "관리자 탐색" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("운영자 세션")).toHaveLength(2);
    expect(await screen.findByDisplayValue("1주차 기본")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /1주차/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("게시됨").length).toBeGreaterThan(0);
  });

  it("supports week row actions and keeps displayOrder in sync", async () => {
    render(
      <AdminDashboard dashboard={dashboard} adminDisplayName="운영자 김" />,
    );

    await screen.findByDisplayValue("1주차 기본");

    const sectionDownButton = screen
      .getAllByRole("button", { name: "섹션 아래로" })
      .find((button) => !(button as HTMLButtonElement).disabled);
    const assetDownButton = screen
      .getAllByRole("button", { name: "에셋 아래로" })
      .find((button) => !(button as HTMLButtonElement).disabled);

    expect(sectionDownButton).toBeDefined();
    expect(assetDownButton).toBeDefined();

    fireEvent.click(sectionDownButton!);
    fireEvent.click(assetDownButton!);
    fireEvent.click(screen.getByRole("button", { name: "섹션 추가" }));
    fireEvent.click(screen.getByRole("button", { name: "에셋 추가" }));

    expect(
      screen.getAllByRole("button", { name: "섹션 삭제" }),
    ).toHaveLength(1);
    expect(
      screen.getAllByRole("button", { name: "에셋 삭제" }),
    ).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "섹션 삭제" }));
    fireEvent.click(screen.getByRole("button", { name: "에셋 삭제" }));

    fireEvent.click(screen.getByRole("button", { name: "주차 저장" }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/content/weeks/1",
        expect.objectContaining({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining("\"title\":\"1주차 기본\""),
        }),
      ),
    );
    const patchCall = (global.fetch as jest.Mock).mock.calls.find(
      ([, init]) => init?.method === "PATCH",
    );
    expect(patchCall).toBeDefined();

    const body = JSON.parse(String(patchCall?.[1]?.body)) as AdminWeekUpdateInput;
    expect(body.sections).toHaveLength(2);
    expect(body.sections[0].sectionKey).toBe("mother_change");
    expect(body.sections.map((section) => section.displayOrder)).toEqual([1, 2]);
    expect(body.assets).toHaveLength(2);
    expect(body.assets[0].assetType).toBe("illustration");
    expect(body.assets.map((asset) => asset.displayOrder)).toEqual([1, 2]);

    expect(
      await screen.findByText("1주차 데이터를 저장했습니다."),
    ).toBeInTheDocument();
  });

  it("keeps week saving separate from account and rag actions", async () => {
    let resolvePatch: ((response: Response) => void) | null = null;
    patchWeekDetail = () =>
      new Promise<Response>((resolve) => {
        resolvePatch = resolve;
      });

    render(
      <AdminDashboard dashboard={dashboard} adminDisplayName="운영자 김" />,
    );

    await screen.findByDisplayValue("1주차 기본");

    fireEvent.click(screen.getByRole("button", { name: "주차 저장" }));

    expect(screen.getByRole("button", { name: "주차 저장" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "전화번호 갱신" }),
    ).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "문서 반영" })).not.toBeDisabled();

    await act(async () => {
      resolvePatch?.(
        await createJsonResponse({
          week: {
            ...currentWeekDetail,
            updatedAt: "2026-03-18T01:00:00.000Z",
          },
        }),
      );
    });

    expect(
      await screen.findByText("1주차 데이터를 저장했습니다."),
    ).toBeInTheDocument();
  });
});
