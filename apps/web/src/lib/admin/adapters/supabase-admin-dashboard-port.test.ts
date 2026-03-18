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

import { supabaseSelect } from "@/lib/mobile/supabase-rest";

import { SupabaseAdminDashboardPortAdapter } from "./supabase-admin-dashboard-port";

const mockedSelect = supabaseSelect as jest.MockedFunction<
  typeof supabaseSelect
>;

describe("SupabaseAdminDashboardPortAdapter", () => {
  const adapter = new SupabaseAdminDashboardPortAdapter();

  afterEach(() => {
    mockedSelect.mockReset();
  });

  it("includes mapped user action feed data in the dashboard", async () => {
    mockedSelect.mockImplementation((path: string) => {
      if (path.startsWith("users?")) {
        return Promise.resolve([
          {
            id: "user-1",
            display_name: "김수연",
            phone_number: "01012345678",
            account_status: "active",
            last_login_at: "2026-03-17T10:00:00.000Z",
          },
        ]);
      }

      if (path.startsWith("pregnancy_profiles?")) {
        return Promise.resolve([
          {
            user_id: "user-1",
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

      if (path.startsWith("pregnancy_documents?")) {
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
            action_type: "password_set",
            payload: {
              flow: "recovery",
            },
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
      actionLabel: "비밀번호 재설정 완료",
      detail: "재설정 플로우에서 새 비밀번호를 저장했습니다.",
    });
  });
});
