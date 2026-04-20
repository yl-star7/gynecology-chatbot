jest.mock("@/lib/server-data-provider", () => ({
  hasDockerConfig: jest.fn(() => true),
  hasSupabaseConfig: jest.fn(() => true),
  resolveServerDataProvider: jest.fn(() => "backend"),
}));

jest.mock("@gynecology-chatbot/db/prisma", () => {
  const mockPrisma = {
    users: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    pregnancy_profiles: {
      findMany: jest.fn(),
    },
    chat_sessions: {
      findMany: jest.fn(),
    },
    chat_messages: {
      findMany: jest.fn(),
    },
    admin_audit_logs: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    content_pregnancy_documents: {
      findMany: jest.fn(),
    },
    workflow_definitions: {
      findMany: jest.fn(),
    },
    user_action_logs: {
      findMany: jest.fn(),
    },
    blocked_phone_numbers: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  return { prisma: mockPrisma };
});

jest.mock("@/lib/mobile/schift-client", () => ({
  getSchiftClient: jest.fn(),
}));

jest.mock("@/lib/mobile/schift-workflows-api", () => ({
  listSchiftWorkflows: jest.fn(),
}));

jest.mock("@/lib/privacy/phone-crypto", () => ({
  createPhoneNumberStorage: jest.fn((phoneNumber: string) => ({
    phoneNumberEncrypted: `enc:${phoneNumber}`,
    phoneNumberBlindIndex: `idx:${phoneNumber}`,
    phoneNumberLast4: phoneNumber.slice(-4),
  })),
  decryptPhoneNumber: jest.fn((value: string) => value.replace(/^enc:/, "")),
  redactPhoneNumber: jest.fn(
    (phoneNumber: string) => `redacted:${phoneNumber}`,
  ),
}));

import { prisma } from "@gynecology-chatbot/db/prisma";
import { getSchiftClient } from "@/lib/mobile/schift-client";
import { listSchiftWorkflows } from "@/lib/mobile/schift-workflows-api";

import {
  SupabaseAdminDashboardPortAdapter,
  SupabaseAdminUserPortAdapter,
} from "./supabase-admin-dashboard-port";

const mockedPrisma = prisma as any;
const mockedGetSchiftClient = getSchiftClient as jest.MockedFunction<
  typeof getSchiftClient
>;
const mockedListSchiftWorkflows = listSchiftWorkflows as jest.MockedFunction<
  typeof listSchiftWorkflows
>;

function resetPrismaMocks() {
  mockedPrisma.users.findMany.mockReset();
  mockedPrisma.users.findUnique.mockReset();
  mockedPrisma.users.update.mockReset();
  mockedPrisma.pregnancy_profiles.findMany.mockReset();
  mockedPrisma.chat_sessions.findMany.mockReset();
  mockedPrisma.chat_messages.findMany.mockReset();
  mockedPrisma.admin_audit_logs.findMany.mockReset();
  mockedPrisma.admin_audit_logs.create.mockReset();
  mockedPrisma.content_pregnancy_documents.findMany.mockReset();
  mockedPrisma.workflow_definitions.findMany.mockReset();
  mockedPrisma.user_action_logs.findMany.mockReset();
  mockedPrisma.blocked_phone_numbers.findMany.mockReset();
  mockedPrisma.blocked_phone_numbers.findUnique.mockReset();
  mockedPrisma.blocked_phone_numbers.create.mockReset();
  mockedPrisma.blocked_phone_numbers.update.mockReset();
  mockedPrisma.blocked_phone_numbers.delete.mockReset();
}

function seedEmptyDashboardQueries() {
  mockedPrisma.users.findMany.mockResolvedValue([] as never);
  mockedPrisma.pregnancy_profiles.findMany.mockResolvedValue([] as never);
  mockedPrisma.chat_sessions.findMany.mockResolvedValue([] as never);
  mockedPrisma.chat_messages.findMany.mockResolvedValue([] as never);
  mockedPrisma.admin_audit_logs.findMany.mockResolvedValue([] as never);
  mockedPrisma.content_pregnancy_documents.findMany.mockResolvedValue(
    [] as never,
  );
  mockedPrisma.workflow_definitions.findMany.mockResolvedValue([] as never);
  mockedPrisma.user_action_logs.findMany.mockResolvedValue([] as never);
}

describe("SupabaseAdminDashboardPortAdapter", () => {
  const adapter = new SupabaseAdminDashboardPortAdapter();

  afterEach(() => {
    resetPrismaMocks();
    mockedGetSchiftClient.mockReset();
    mockedListSchiftWorkflows.mockReset();
  });

  it("includes mapped user action feed data in the dashboard", async () => {
    mockedPrisma.users.findMany.mockResolvedValue([
      {
        id: "user-1",
        phone_number_encrypted: "enc:01012345678",
        account_status: "active",
        last_login_at: new Date("2026-03-17T10:00:00.000Z"),
      },
    ] as never);
    mockedPrisma.pregnancy_profiles.findMany.mockResolvedValue([
      {
        user_id: "user-1",
        display_name: "김수연",
        pregnancy_week: 18,
        pregnancy_day_in_week: 2,
      },
    ] as never);
    mockedPrisma.chat_sessions.findMany.mockResolvedValue([
      {
        id: "session-1",
        user_id: "user-1",
        title: "두통 채팅",
        last_message_at: new Date("2026-03-17T10:10:00.000Z"),
      },
    ] as never);
    mockedPrisma.chat_messages.findMany.mockResolvedValue([
      {
        id: "message-1",
        session_id: "session-1",
        role: "user",
        plain_text: "두통이 있어요",
        parts: [],
        created_at: new Date("2026-03-17T10:09:00.000Z"),
      },
    ] as never);
    mockedPrisma.admin_audit_logs.findMany.mockResolvedValue([] as never);
    mockedPrisma.content_pregnancy_documents.findMany.mockResolvedValue(
      [] as never,
    );
    mockedPrisma.workflow_definitions.findMany.mockResolvedValue([] as never);
    mockedPrisma.user_action_logs.findMany.mockResolvedValue([
      {
        id: "action-1",
        user_id: "user-1",
        session_id: "session-1",
        message_id: "message-1",
        action_type: "chat_message_sent",
        payload: { textPreview: "두통이 있어요", imageCount: 0 },
        occurred_at: new Date("2026-03-17T10:09:00.000Z"),
      },
      {
        id: "action-2",
        user_id: "user-1",
        session_id: null,
        message_id: null,
        action_type: "phone_verified",
        payload: {},
        occurred_at: new Date("2026-03-17T09:00:00.000Z"),
      },
    ] as never);
    mockedGetSchiftClient.mockReturnValue(null);

    const dashboard = await adapter.getDashboard();

    expect(dashboard.userActions).toHaveLength(2);
    expect(dashboard.userActions[0]).toMatchObject({
      id: "action-1",
      userId: "user-1",
      userName: "김수연",
      actionType: "chat_message_sent",
      actionLabel: "채팅 메시지 전송",
      detail: "두통이 있어요",
      sessionId: "session-1",
      sessionTitle: "두통 채팅",
    });
    expect(dashboard.userActions[1]).toMatchObject({
      id: "action-2",
      actionLabel: "문자 인증 확인",
      detail: "문자 인증 코드를 확인했습니다.",
    });
  });

  it("relabels initial account setup actions without signup wording", async () => {
    mockedPrisma.users.findMany.mockResolvedValue([
      {
        id: "user-1",
        phone_number_encrypted: "enc:01012345678",
        account_status: "active",
        last_login_at: new Date("2026-03-17T10:00:00.000Z"),
      },
    ] as never);
    mockedPrisma.pregnancy_profiles.findMany.mockResolvedValue([] as never);
    mockedPrisma.chat_sessions.findMany.mockResolvedValue([] as never);
    mockedPrisma.chat_messages.findMany.mockResolvedValue([] as never);
    mockedPrisma.admin_audit_logs.findMany.mockResolvedValue([] as never);
    mockedPrisma.content_pregnancy_documents.findMany.mockResolvedValue(
      [] as never,
    );
    mockedPrisma.workflow_definitions.findMany.mockResolvedValue([] as never);
    mockedPrisma.user_action_logs.findMany.mockResolvedValue([
      {
        id: "action-1",
        user_id: "user-1",
        session_id: null,
        message_id: null,
        action_type: "phone_verification_started",
        payload: { flow: "signup" },
        occurred_at: new Date("2026-03-17T08:50:00.000Z"),
      },
      {
        id: "action-2",
        user_id: "user-1",
        session_id: null,
        message_id: null,
        action_type: "phone_verified",
        payload: {},
        occurred_at: new Date("2026-03-17T09:00:00.000Z"),
      },
    ] as never);
    mockedGetSchiftClient.mockReturnValue(null);

    const dashboard = await adapter.getDashboard();

    expect(dashboard.userActions).toHaveLength(2);
    expect(dashboard.userActions[0]).toMatchObject({
      actionLabel: "초기 계정 인증 요청",
      detail: "초기 계정 설정 절차에서 인증 코드를 발송했습니다.",
    });
    expect(dashboard.userActions[1]).toMatchObject({
      actionLabel: "문자 인증 확인",
      detail: "문자 인증 코드를 확인했습니다.",
    });
  });

  it("does not fall back to mock document and workflow ids when backend queries are empty", async () => {
    seedEmptyDashboardQueries();
    mockedGetSchiftClient.mockReturnValue(null);

    const dashboard = await adapter.getDashboard();

    expect(dashboard.ragDocuments).toEqual([]);
    expect(dashboard.workflowRules).toEqual([]);
  });

  it("includes Schift workflows in the dashboard when configured", async () => {
    seedEmptyDashboardQueries();
    mockedGetSchiftClient.mockReturnValue({ workflows: {} } as never);
    mockedListSchiftWorkflows.mockResolvedValue([
      {
        id: "schift-wf-1",
        name: "Schift 기본 플로우",
        description:
          '<!-- si-admin-workflow:{"trigger":"복통","retrievalScope":"응급 문서","modelName":"gpt-4.1"}-->\n기본 설명',
        status: "active",
        graph: { blocks: [], edges: [] },
        created_at: "2026-03-23T10:00:00.000Z",
        updated_at: "2026-03-23T10:00:00.000Z",
      },
    ] as never);

    const dashboard = await adapter.getDashboard();

    expect(dashboard.workflowRules).toContainEqual(
      expect.objectContaining({
        id: "schift-wf-1",
        name: "Schift 기본 플로우",
        trigger: "복통",
        retrievalScope: "응급 문서",
        modelName: "gpt-4.1",
        status: "active",
      }),
    );
  });

  it("dedupes Schift workflows when definition and workflow identity match", async () => {
    seedEmptyDashboardQueries();
    mockedPrisma.workflow_definitions.findMany.mockResolvedValue([
      {
        id: "definition-1",
        name: "모성간호 상담 응답",
        provider: "schift",
        is_active: false,
        config: {
          trigger: "내부 데이터만 답변",
          modelName: "gemini-2.5-flash-lite",
        },
        metadata: {
          trigger: "내부 데이터만 답변",
          retrievalScope: "pregnancy-knowledge 내부 자료",
          modelName: "gemini-2.5-flash-lite",
        },
      },
    ] as never);
    mockedGetSchiftClient.mockReturnValue({ workflows: {} } as never);
    mockedListSchiftWorkflows.mockResolvedValue([
      {
        id: "schift-wf-2",
        name: "모성간호 상담 응답",
        description:
          '<!-- si-admin-workflow:{"trigger":"내부 데이터만 답변","retrievalScope":"pregnancy-knowledge 내부 자료","modelName":"gemini-2.5-flash-lite"}-->\n기본 설명',
        status: "active",
        graph: { blocks: [], edges: [] },
        created_at: "2026-03-23T10:00:00.000Z",
        updated_at: "2026-03-23T10:00:00.000Z",
      },
    ] as never);

    const dashboard = await adapter.getDashboard();

    expect(dashboard.workflowRules).toHaveLength(1);
    expect(dashboard.workflowRules[0]).toMatchObject({
      id: "schift-wf-2",
      name: "모성간호 상담 응답",
      trigger: "내부 데이터만 답변",
      modelName: "gemini-2.5-flash-lite",
    });
  });

  it("shows only the canonical mobile chat workflow in the dashboard", async () => {
    seedEmptyDashboardQueries();
    mockedPrisma.workflow_definitions.findMany.mockResolvedValue([
      {
        id: "workflow-chat-default",
        name: "기본 채팅 응답",
        provider: "flowise",
        is_active: true,
        config: {
          modelName: "gemini-2.5-flash-lite",
          retrievalScope: "현재 주차 ±1주 + 공통 문서",
        },
        metadata: {
          trigger: "일반 채팅",
          retrievalScope: "현재 주차 ±1주 + 공통 문서",
          modelName: "gemini-2.5-flash-lite",
        },
      },
      {
        id: "definition-1",
        name: "모성간호 상담 응답",
        provider: "schift",
        is_active: true,
        config: {
          trigger: "내부 데이터만 답변",
          modelName: "gemini-2.5-flash-lite",
        },
        metadata: {
          trigger: "내부 데이터만 답변",
          retrievalScope: "pregnancy-knowledge 내부 자료",
          modelName: "gemini-2.5-flash-lite",
        },
      },
    ] as never);
    mockedGetSchiftClient.mockReturnValue({ workflows: {} } as never);
    mockedListSchiftWorkflows.mockResolvedValue([
      {
        id: "schift-wf-2",
        name: "모성간호 상담 응답",
        description:
          '<!-- si-admin-workflow:{"trigger":"내부 데이터만 답변","retrievalScope":"pregnancy-knowledge 내부 자료","modelName":"gemini-2.5-flash-lite"}-->\n기본 설명',
        status: "active",
        graph: { blocks: [{ id: "start" }], edges: [] },
        created_at: "2026-03-23T10:00:00.000Z",
        updated_at: "2026-03-23T10:00:00.000Z",
      },
      {
        id: "schift-wf-3",
        name: "내부 데이터 응답",
        description:
          '<!-- si-admin-workflow:{"trigger":"일반 채팅","retrievalScope":"pregnancy-knowledge 내부 자료","modelName":"gemini-2.5-flash-lite"}-->\n기본 설명',
        status: "active",
        graph: { blocks: [{ id: "start" }], edges: [] },
        created_at: "2026-03-23T10:00:00.000Z",
        updated_at: "2026-03-23T10:00:00.000Z",
      },
    ] as never);

    const dashboard = await adapter.getDashboard();

    expect(dashboard.workflowRules).toHaveLength(1);
    expect(dashboard.workflowRules[0]).toMatchObject({
      id: "schift-wf-2",
      name: "모성간호 상담 응답",
      trigger: "내부 데이터만 답변",
    });
  });

  it("uses prisma-backed queries for dashboard data", async () => {
    seedEmptyDashboardQueries();
    mockedGetSchiftClient.mockReturnValue(null);

    const dashboard = await adapter.getDashboard();

    expect(dashboard.ragDocuments).toEqual([]);
    expect(mockedPrisma.users.findMany).toHaveBeenCalled();
  });

  it("stores allowed phone numbers as encrypted payloads and redacts audit values", async () => {
    const userAdapter = new SupabaseAdminUserPortAdapter();
    mockedPrisma.blocked_phone_numbers.findUnique.mockResolvedValue(
      null as never,
    );
    mockedPrisma.blocked_phone_numbers.create.mockResolvedValue({
      id: "allow-1",
      phone_number_encrypted: "enc:+821012345678",
      phone_number_last4: "5678",
      display_name: "김수연",
      note: "seed",
      created_at: new Date("2026-03-20T00:00:00.000Z"),
      updated_at: new Date("2026-03-20T00:00:00.000Z"),
    } as never);
    mockedPrisma.admin_audit_logs.create.mockResolvedValue({} as never);

    const created = await userAdapter.createAllowedPhoneNumber({
      actorId: "admin-1",
      phoneNumber: "01012345678",
      displayName: "김수연",
      note: "seed",
    });

    expect(mockedPrisma.blocked_phone_numbers.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          phone_number_encrypted: "enc:+821012345678",
          phone_number_blind_index: "idx:+821012345678",
          phone_number_last4: "5678",
        }),
      }),
    );
    expect(mockedPrisma.admin_audit_logs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          after_payload: expect.objectContaining({
            phone_number: "redacted:+821012345678",
          }),
        }),
      }),
    );
    expect(created.phoneNumber).toBe("+821012345678");
  });
});
