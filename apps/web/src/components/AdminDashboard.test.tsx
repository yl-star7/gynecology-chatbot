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
      latestIssue: "세션 초기화 대기",
    },
  ],
  recoveryActions: [
    {
      id: "recovery-1",
      userName: "김수연",
      action: "session_reset",
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

async function openWeekOverlay() {
  await screen.findByText("1주차 개요");
  fireEvent.click(screen.getByRole("button", { name: "상세 편집 열기" }));
  await screen.findByRole("heading", { name: "1주차 편집" });
}

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
        days: body.days.map((day, index) => ({
          id: day.id ?? `day-${index + 1}`,
          dayNumber: day.dayNumber,
          title: day.title,
          babyDevelopmentItems: [...day.babyDevelopmentItems],
          babyMessage: day.babyMessage,
          motherChangesItems: [...day.motherChangesItems],
          displayOrder: day.displayOrder,
        })),
        sections: body.sections.map((section, index) => ({
          id: section.id ?? `section-${index + 1}`,
          dayNumber: section.dayNumber,
          sectionKey: section.sectionKey,
          title: section.title,
          body: section.body,
          displayOrder: section.displayOrder,
          isRequired: section.isRequired,
          isActive: section.isActive,
        })),
        assets: body.assets.map((asset, index) => ({
          id: asset.id ?? `asset-${index + 1}`,
          dayNumber: asset.dayNumber,
          assetType: asset.assetType,
          storagePath: asset.storagePath,
          altText: asset.altText,
          styleKey: asset.styleKey,
          displayOrder: asset.displayOrder,
          isRequired: asset.isRequired,
          isActive: asset.isActive,
        })),
        media: body.media.map((media, index) => ({
          id: media.id ?? `media-${index + 1}`,
          dayNumber: media.dayNumber,
          mediaScope: media.mediaScope,
          bucketId: media.bucketId,
          objectPath: media.objectPath,
          mediaRole: media.mediaRole,
          altText: media.altText,
          sourceFileName: media.sourceFileName,
          displayOrder: media.displayOrder,
        })),
        updatedAt: "2026-03-18T01:00:00.000Z",
      };

      return createJsonResponse({ week: currentWeekDetail });
    };

    global.fetch = jest.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
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

        if (pathname === "/api/admin/allowed-phone-numbers" && !init?.method) {
          return createJsonResponse({
            allowedPhoneNumbers: [
              {
                id: "allow-1",
                phoneNumber: "01012345678",
                displayName: "김수연",
                note: "1차 파일럿",
                createdAt: "2026-03-18T09:00:00.000Z",
                updatedAt: "2026-03-18T09:00:00.000Z",
              },
            ],
          });
        }

        if (
          pathname === "/api/admin/content/knowledge-items" &&
          !init?.method
        ) {
          return createJsonResponse({
            knowledgeItems: [
              {
                id: "knowledge-item-1",
                slug: "warning-signs",
                section: "knowledge",
                title: "24주차 위험 신호",
                body: "규칙적인 수축, 양수 유출 의심, 선명한 출혈은 즉시 확인이 필요합니다.",
                status: "published",
                updatedAt: "2026-03-18T09:20:00.000Z",
              },
            ],
          });
        }

        if (pathname === "/api/admin/content/weeks/1" && !init?.method) {
          return createJsonResponse({ week: currentWeekDetail });
        }

        if (
          pathname === "/api/admin/content/weeks/1" &&
          init?.method === "PATCH"
        ) {
          const body = JSON.parse(String(init.body)) as AdminWeekUpdateInput;
          return patchWeekDetail(body);
        }

        if (pathname === "/api/admin/auth/logout" && init?.method === "POST") {
          return createJsonResponse({}, true);
        }

        throw new Error(`Unexpected fetch call: ${pathname}`);
      },
    ) as typeof fetch;
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
      screen.getByRole("heading", { name: "사용자 선택" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "허용 전화번호 관리" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "실시간 사용자 이벤트" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "관리자 탐색" }),
    ).toBeInTheDocument();
    expect(screen.getByText("운영자")).toBeInTheDocument();
    expect(screen.getByText("주차별 간호 정보")).toBeInTheDocument();
    expect(screen.getByText("응답 워크플로우")).toBeInTheDocument();
  });

  it.skip("supports week row actions and keeps displayOrder in sync", async () => {
    render(
      <AdminDashboard dashboard={dashboard} adminDisplayName="운영자 김" />,
    );

    await openWeekOverlay();

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

    expect(
      screen.getAllByRole("button", { name: "체크리스트 삭제" }),
    ).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "질문 삭제" })).toHaveLength(
      2,
    );

    fireEvent.click(screen.getByRole("button", { name: "체크리스트 추가" }));
    fireEvent.click(screen.getByRole("button", { name: "질문 추가" }));

    expect(
      screen.getAllByRole("button", { name: "체크리스트 삭제" }),
    ).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: "질문 삭제" })).toHaveLength(
      3,
    );

    fireEvent.click(
      screen.getAllByRole("button", { name: "체크리스트 삭제" })[2],
    );
    fireEvent.click(screen.getAllByRole("button", { name: "질문 삭제" })[2]);

    fireEvent.click(screen.getByRole("button", { name: "주차 저장" }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/content/weeks/1",
        expect.objectContaining({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining('"title":"1주차 기본"'),
        }),
      ),
    );
    const patchCall = (global.fetch as jest.Mock).mock.calls.find(
      ([, init]) => init?.method === "PATCH",
    );
    expect(patchCall).toBeDefined();

    const body = JSON.parse(
      String(patchCall?.[1]?.body),
    ) as AdminWeekUpdateInput;
    expect(body.sections).toHaveLength(2);
    expect(body.sections[0].sectionKey).toBe("mother_change");
    expect(body.sections[0].dayNumber).toBe(1);
    expect(body.sections.map((section) => section.displayOrder)).toEqual([
      1, 2,
    ]);
    expect(body.assets).toHaveLength(2);
    expect(body.assets[0].assetType).toBe("illustration");
    expect(body.assets[0].dayNumber).toBe(1);
    expect(body.assets.map((asset) => asset.displayOrder)).toEqual([1, 2]);
    expect(body.days).toHaveLength(1);
    expect(body.media).toHaveLength(1);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "주차 저장" })).not.toBeDisabled(),
    );
  });

  it.skip("keeps week saving separate from account and rag actions", async () => {
    let resolvePatch: ((response: Response) => void) | null = null;
    patchWeekDetail = () =>
      new Promise<Response>((resolve) => {
        resolvePatch = resolve;
      });

    render(
      <AdminDashboard dashboard={dashboard} adminDisplayName="운영자 김" />,
    );

    await openWeekOverlay();

    fireEvent.click(screen.getByRole("button", { name: "주차 저장" }));

    expect(screen.getByRole("button", { name: "주차 저장" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "전화번호 갱신" }),
    ).not.toBeDisabled();
    expect(
      screen.getByRole("button", { name: "문서 반영" }),
    ).not.toBeDisabled();

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

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "주차 저장" })).not.toBeDisabled(),
    );
  });

  it.skip("allows deleting persisted week sections and assets before saving", async () => {
    render(
      <AdminDashboard dashboard={dashboard} adminDisplayName="운영자 김" />,
    );

    await openWeekOverlay();

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
    fireEvent.click(screen.getByRole("button", { name: "주차 저장" }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/content/weeks/1",
        expect.objectContaining({
          method: "PATCH",
        }),
      ),
    );

    const patchCall = (global.fetch as jest.Mock).mock.calls.find(
      ([, init]) => init?.method === "PATCH",
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
