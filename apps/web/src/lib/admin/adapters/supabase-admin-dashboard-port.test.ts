jest.mock("@/lib/server-data-provider", () => ({
  hasDockerConfig: jest.fn(() => true),
  hasSupabaseConfig: jest.fn(() => true),
  resolveServerDataProvider: jest.fn(() => "backend"),
}));

jest.mock("@/lib/mobile/supabase-rest", () => ({
  supabaseInsert: jest.fn(),
  supabaseSelect: jest.fn(),
  supabaseUpdate: jest.fn(),
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
  supabaseInsert,
  supabaseSelect,
  supabaseUpdate,
} from "@/lib/mobile/supabase-rest";
import { getSchiftClient } from "@/lib/mobile/schift-client";
import { listSchiftWorkflows } from "@/lib/mobile/schift-workflows-api";

import {
  SupabaseAdminDashboardPortAdapter,
  SupabaseAdminUserPortAdapter,
} from "./supabase-admin-dashboard-port";

const mockedSelect = supabaseSelect as jest.MockedFunction<
  typeof supabaseSelect
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
    mockedSelect.mockReset();
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

    expect(dashboard.workflowRules).toContainEqual({
      id: "schift-wf-1",
      name: "Schift 기본 플로우",
      trigger: "복통",
      retrievalScope: "응급 문서",
      modelName: "gpt-4.1",
      status: "active",
    });
  });

  it("stores allowed phone numbers as encrypted payloads and redacts audit values", async () => {
    const userAdapter = new SupabaseAdminUserPortAdapter();
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
      "allowed_phone_numbers",
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
