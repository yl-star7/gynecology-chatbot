import { render, screen } from "@testing-library/react";

import type { AdminDashboardData } from "@gynecology-chatbot/app-core";

import AdminDashboard from "./AdminDashboard";

const dashboard: AdminDashboardData = {
  metrics: [
    {
      id: "active-users",
      label: "활성 사용자",
      value: "128",
      changeLabel: "전체 등록",
    },
  ],
  managedUsers: [
    {
      id: "user-active",
      name: "정상 사용자",
      phoneNumber: "01011112222",
      status: "active",
      accountStatus: "active",
      latestIssue: "정상 이용 중",
    },
    {
      id: "user-pending",
      name: "승인 대기자",
      phoneNumber: "01099998888",
      status: "attention",
      accountStatus: "pending_approval",
      latestIssue: "사용 승인 대기",
    },
    {
      id: "user-recovery",
      name: "복구 대기자",
      phoneNumber: "01088887777",
      status: "attention",
      accountStatus: "pending_recovery",
      latestIssue: "접근 복구 대기",
    },
  ],
  recoveryActions: [],
  ragDocuments: [
    {
      id: "rag-1",
      title: "임신 18주 복통 가이드",
      pregnancyWeekLabel: "18주차",
      category: "symptom",
      chunkCount: 4,
      updatedAt: "2026-03-17T10:00:00.000Z",
      status: "ready",
    },
    {
      id: "rag-2",
      title: "작성 중 문서",
      pregnancyWeekLabel: "공통",
      category: "draft",
      chunkCount: 0,
      updatedAt: "2026-03-17T10:00:00.000Z",
      status: "draft",
    },
  ],
  workflowRules: [
    {
      id: "workflow-active",
      name: "모성간호 router",
      trigger: "stage 분기",
      retrievalScope: "router",
      modelName: "gemini",
      status: "active",
    },
    {
      id: "workflow-review",
      name: "이미지 동반 채팅",
      trigger: "이미지 + 텍스트 입력",
      retrievalScope: "vision",
      modelName: "gemini",
      status: "review",
    },
  ],
  historyUsers: [],
  userActions: [
    {
      id: "action-1",
      userId: "user-pending",
      userName: "승인 대기자",
      actionType: "phone_verification_started",
      actionLabel: "인증 요청",
      detail: "전화번호 인증 코드를 발송했습니다.",
      occurredAtLabel: "2026-03-17T11:00:00.000Z",
      sessionId: null,
      sessionTitle: null,
    },
  ],
};

describe("AdminDashboard", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "/api/admin/analytics") {
        return new Response(
          JSON.stringify({
            totalUsers: 128,
            onboardedUsers: 102,
            todaySessions: 48,
            weekMessages: 342,
            todayLogins: 19,
            weekLogins: 77,
            todayEmotions: 12,
            pushEnabled: 86,
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

  it("renders dashboard summaries without embedding operation forms", async () => {
    render(
      <AdminDashboard dashboard={dashboard} adminDisplayName="운영자 김" />,
    );

    expect(
      screen.getByRole("heading", { name: "대시보드" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("오늘 상담")).toBeInTheDocument();
    expect(screen.getByText("사용자 처리")).toBeInTheDocument();
    expect(screen.getByText("RAG 자료")).toBeInTheDocument();
    expect(screen.getByText("응답 워크플로우")).toBeInTheDocument();
    expect(screen.getByText("최근 사용자 이벤트")).toBeInTheDocument();

    expect(screen.getAllByText("승인 대기자").length).toBeGreaterThan(0);
    expect(
      screen.getByText("전화번호 인증 코드를 발송했습니다."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "사전 관리로 이동" }),
    ).toHaveAttribute("href", "/admin/lexicon");

    expect(screen.queryByText("앱 사용 승인 정책")).not.toBeInTheDocument();
    expect(screen.queryByText("FAB 마스코트")).not.toBeInTheDocument();
    expect(screen.queryByText("사용자 관리")).not.toBeInTheDocument();
    expect(screen.queryByText("주차별 아기는요?")).not.toBeInTheDocument();
  });
});
