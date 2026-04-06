jest.mock("@/lib/server-data-provider", () => ({
  hasDockerConfig: jest.fn(() => true),
  hasSupabaseConfig: jest.fn(() => true),
  resolveServerDataProvider: jest.fn(() => "backend"),
}));

jest.mock("@/lib/supabase/admin-client", () => ({
  supabaseDelete: jest.fn(),
  supabaseInsert: jest.fn(),
  supabaseSelect: jest.fn(),
  supabaseUpdate: jest.fn(),
  getSupabaseAdminClient: jest.fn(() => {
    const mockResult = { data: [], error: null };
    const createMockBuilder = (): Record<string, unknown> => ({
      select: createMockBuilder,
      insert: jest.fn(() => {
        const builder = createMockBuilder();
        return { ...builder, ...mockResult };
      }),
      update: jest.fn(() => {
        const builder = createMockBuilder();
        return { ...builder, ...mockResult };
      }),
      delete: jest.fn(() => mockResult),
      eq: createMockBuilder,
      neq: createMockBuilder,
      gt: createMockBuilder,
      gte: createMockBuilder,
      lt: createMockBuilder,
      lte: createMockBuilder,
      in: createMockBuilder,
      is: createMockBuilder,
      not: createMockBuilder,
      like: createMockBuilder,
      ilike: createMockBuilder,
      order: createMockBuilder,
      limit: createMockBuilder,
      range: createMockBuilder,
      single: () => mockResult,
      maybeSingle: () => mockResult,
    });
    return {
      from: () => createMockBuilder(),
    };
  }),
}));

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

import {
  getSupabaseAdminClient,
  supabaseDelete,
  supabaseInsert,
  supabaseSelect,
  supabaseUpdate,
} from "@/lib/supabase/admin-client";
import { getSchiftClient } from "@/lib/mobile/schift-client";
import { listSchiftWorkflows } from "@/lib/mobile/schift-workflows-api";

import {
  SupabaseAdminDashboardPortAdapter,
  SupabaseAdminUserPortAdapter,
} from "./supabase-admin-dashboard-port";

const mockedGetSupabaseAdminClient = getSupabaseAdminClient as jest.MockedFunction<
  typeof getSupabaseAdminClient
>;
const mockedSelect = supabaseSelect as jest.MockedFunction<
  typeof supabaseSelect
>;
const mockedDelete = supabaseDelete as jest.MockedFunction<
  typeof supabaseDelete
>;
const mockedInsert = supabaseInsert as jest.MockedFunction<
  typeof supabaseInsert
>;
const mockedUpdate = supabaseUpdate as jest.MockedFunction<
  typeof supabaseUpdate
>;
const mockedGetSchiftClient = getSchiftClient as jest.MockedFunction<
  typeof getSchiftClient
>;
const mockedListSchiftWorkflows = listSchiftWorkflows as jest.MockedFunction<
  typeof listSchiftWorkflows
>;

describe("SupabaseAdminDashboardPortAdapter", () => {
  const adapter = new SupabaseAdminDashboardPortAdapter();
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    delete process.env.DATABASE_URL;
  });

  afterEach(() => {
    mockedGetSupabaseAdminClient.mockReset();
    mockedSelect.mockReset();
    mockedDelete.mockReset();
    mockedInsert.mockReset();
    mockedUpdate.mockReset();
    mockedGetSchiftClient.mockReset();
    mockedListSchiftWorkflows.mockReset();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it("includes mapped user action feed data in the dashboard", async () => {
    mockedSelect.mockImplementation((path: string) => {
      if (path.startsWith("users?")) {
        return Promise.resolve([
          {
            id: "user-1",
            phone_number_encrypted: "enc:01012345678",
            phone_number_last4: "5678",
            account_status: "active",
            last_login_at: "2026-03-17T10:00:00.000Z",
          },
        ]);
      }

      if (path.startsWith("pregnancy_profiles?")) {
        return Promise.resolve([
          {
            user_id: "user-1",
            display_name: "김수연",
            pregnancy_week: 18,
            pregnancy_day_in_week: 2,
          },
        ]);
      }

      if (path.startsWith("chat_sessions?")) {
        return Promise.resolve([
          {
            id: "session-1",
            user_id: "user-1",
            title: "두통 채팅",
            last_message_at: "2026-03-17T10:10:00.000Z",
          },
        ]);
      }

      if (path.startsWith("chat_messages?")) {
        return Promise.resolve([
          {
            id: "message-1",
            session_id: "session-1",
            role: "user",
            plain_text: "두통이 있어요",
            created_at: "2026-03-17T10:09:00.000Z",
          },
        ]);
      }

      if (path.startsWith("admin_audit_logs?")) {
        return Promise.resolve([]);
      }

      if (path.startsWith("content.pregnancy_documents?")) {
        return Promise.resolve([]);
      }

      if (path.startsWith("user_action_logs?")) {
        return Promise.resolve([
          {
            id: "action-1",
            user_id: "user-1",
            session_id: "session-1",
            message_id: "message-1",
            action_type: "chat_message_sent",
            payload: {
              textPreview: "두통이 있어요",
              imageCount: 0,
            },
            occurred_at: "2026-03-17T10:09:00.000Z",
          },
          {
            id: "action-2",
            user_id: "user-1",
            session_id: null,
            message_id: null,
            action_type: "phone_verified",
            payload: {},
            occurred_at: "2026-03-17T09:00:00.000Z",
          },
        ]);
      }

      return Promise.resolve([]);
    });

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
    mockedSelect.mockImplementation((path: string) => {
      if (path.startsWith("users?")) {
        return Promise.resolve([
          {
            id: "user-1",
            phone_number_encrypted: "enc:01012345678",
            phone_number_last4: "5678",
            account_status: "active",
            last_login_at: "2026-03-17T10:00:00.000Z",
          },
        ]);
      }

      if (path.startsWith("pregnancy_profiles?")) {
        return Promise.resolve([]);
      }

      if (path.startsWith("chat_sessions?")) {
        return Promise.resolve([]);
      }

      if (path.startsWith("chat_messages?")) {
        return Promise.resolve([]);
      }

      if (path.startsWith("admin_audit_logs?")) {
        return Promise.resolve([]);
      }

      if (path.startsWith("content.pregnancy_documents?")) {
        return Promise.resolve([]);
      }

      if (path.startsWith("user_action_logs?")) {
        return Promise.resolve([
          {
            id: "action-1",
            user_id: "user-1",
            session_id: null,
            message_id: null,
            action_type: "phone_verification_started",
            payload: {
              flow: "signup",
            },
            occurred_at: "2026-03-17T08:50:00.000Z",
          },
          {
            id: "action-2",
            user_id: "user-1",
            session_id: null,
            message_id: null,
            action_type: "phone_verified",
            payload: {},
            occurred_at: "2026-03-17T09:00:00.000Z",
          },
        ]);
      }

      return Promise.resolve([]);
    });

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
    mockedSelect.mockResolvedValue([]);
    mockedGetSchiftClient.mockReturnValue(null);

    const dashboard = await adapter.getDashboard();

    expect(dashboard.ragDocuments).toEqual([]);
    expect(dashboard.workflowRules).toEqual([]);
  });

  it("keeps rag documents empty when backend returns no documents", async () => {
    mockedGetSchiftClient.mockReturnValue(null);
    mockedSelect.mockImplementation((path: string) => {
      if (path.startsWith("users?")) {
        return Promise.resolve([]);
      }

      if (path.startsWith("pregnancy_profiles?")) {
        return Promise.resolve([]);
      }

      if (path.startsWith("chat_sessions?")) {
        return Promise.resolve([]);
      }

      if (path.startsWith("chat_messages?")) {
        return Promise.resolve([]);
      }

      if (path.startsWith("admin_audit_logs?")) {
        return Promise.resolve([]);
      }

      if (path.startsWith("content.pregnancy_documents?")) {
        return Promise.resolve([]);
      }

      if (path.startsWith("workflow_definitions?")) {
        return Promise.resolve([]);
      }

      if (path.startsWith("user_action_logs?")) {
        return Promise.resolve([]);
      }

      return Promise.resolve([]);
    });

    const dashboard = await adapter.getDashboard();

    expect(dashboard.ragDocuments).toEqual([]);
  });

  it("includes Schift workflows in the dashboard when configured", async () => {
    mockedSelect.mockResolvedValue([]);
    mockedGetSchiftClient.mockReturnValue({
      workflows: {},
    } as never);
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
    mockedSelect.mockImplementation((path: string) => {
      if (path.startsWith("workflow_definitions?")) {
        return Promise.resolve([
          {
            id: "definition-1",
            name: "모성간호 상담 응답",
            slug: "internal-data-answer",
            provider: "schift",
            status: "published",
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
            updated_at: "2026-04-07T00:00:00.000Z",
          },
        ]);
      }

      return Promise.resolve([]);
    });
    mockedGetSchiftClient.mockReturnValue({
      workflows: {},
    } as never);
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
      id: "definition-1",
      name: "모성간호 상담 응답",
      trigger: "내부 데이터만 답변",
      modelName: "gemini-2.5-flash-lite",
    });
  });

  it("shows only the canonical mobile chat workflow in the dashboard", async () => {
    mockedSelect.mockImplementation((path: string) => {
      if (path.startsWith("workflow_definitions?")) {
        return Promise.resolve([
          {
            id: "workflow-chat-default",
            name: "기본 채팅 응답",
            slug: "default-chat",
            provider: "flowise",
            status: "published",
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
            updated_at: "2026-04-07T00:00:00.000Z",
          },
          {
            id: "definition-1",
            name: "모성간호 상담 응답",
            slug: "internal-data-answer",
            provider: "schift",
            status: "published",
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
            updated_at: "2026-04-07T00:00:00.000Z",
          },
        ]);
      }

      return Promise.resolve([]);
    });
    mockedGetSchiftClient.mockReturnValue({
      workflows: {},
    } as never);
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
      id: "definition-1",
      name: "모성간호 상담 응답",
      trigger: "내부 데이터만 답변",
    });
  });

  it("uses provider-aware wrappers instead of the direct admin client", async () => {
    mockedGetSupabaseAdminClient.mockImplementation(() => {
      throw new Error("direct admin client should not be used");
    });
    mockedGetSchiftClient.mockReturnValue(null);
    mockedSelect.mockResolvedValue([]);

    const dashboard = await adapter.getDashboard();

    expect(dashboard.ragDocuments).toEqual([]);
    expect(mockedSelect).toHaveBeenCalled();
  });

  it("stores allowed phone numbers as encrypted payloads and redacts audit values", async () => {
    const userAdapter = new SupabaseAdminUserPortAdapter();
    mockedSelect.mockResolvedValueOnce([]);
    mockedInsert
      .mockResolvedValueOnce([
        {
          id: "allow-1",
          phone_number_encrypted: "enc:+821012345678",
          phone_number_last4: "5678",
          display_name: "김수연",
          note: "seed",
          created_at: "2026-03-20T00:00:00.000Z",
          updated_at: "2026-03-20T00:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([]);

    const created = await userAdapter.createAllowedPhoneNumber({
      actorId: "admin-1",
      phoneNumber: "01012345678",
      displayName: "김수연",
      note: "seed",
    });

    expect(mockedInsert).toHaveBeenNthCalledWith(
      1,
      "blocked_phone_numbers",
      expect.objectContaining({
        phone_number_encrypted: "enc:+821012345678",
        phone_number_blind_index: "idx:+821012345678",
        phone_number_last4: "5678",
      }),
    );
    expect(mockedInsert).toHaveBeenNthCalledWith(
      2,
      "admin_audit_logs",
      expect.objectContaining({
        after_payload: expect.objectContaining({
          phone_number: "redacted:+821012345678",
        }),
      }),
    );
    expect(created.phoneNumber).toBe("+821012345678");
  });
});
