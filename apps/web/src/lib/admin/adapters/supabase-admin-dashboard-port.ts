import type {
  AdminDashboardData,
  AdminDashboardPort,
  AdminUserAction,
  AdminUserPort,
  UserActionType,
} from "@gynecology-chatbot/app-core";

import {
  hasDockerConfig,
  hasSupabaseConfig,
  resolveServerDataProvider,
} from "@/lib/server-data-provider";
import {
  supabaseInsert,
  supabaseSelect,
  supabaseUpdate,
} from "@/lib/mobile/supabase-rest";

import { MockAdminDashboardPortAdapter } from "./mock-admin-dashboard-port";

function hasBackendAdminConfig() {
  const provider = resolveServerDataProvider();
  return provider === "docker" ? hasDockerConfig() : hasSupabaseConfig();
}

function getAdminActorId() {
  const actorId = process.env.ADMIN_ACTOR_USER_ID;
  if (!actorId) {
    throw new Error(
      "ADMIN_ACTOR_USER_ID is required for admin write operations",
    );
  }

  return actorId;
}

function toManagedUserStatus(
  accountStatus: string,
): "active" | "attention" | "paused" {
  if (accountStatus === "active") {
    return "active";
  }

  if (accountStatus === "paused") {
    return "paused";
  }

  return "attention";
}

function toPregnancyWeekLabel(week: number | null, dayInWeek: number | null) {
  if (!week) {
    return "정보 없음";
  }

  return `${week}주 ${dayInWeek ?? 0}일`;
}

function formatUserActionLabel(
  actionType: UserActionType,
  payload: Record<string, unknown> | null,
) {
  if (actionType === "login_succeeded") {
    return {
      actionLabel: "로그인 완료",
      detail: "기존 비밀번호로 로그인했습니다.",
    };
  }

  if (actionType === "phone_verification_started") {
    if (payload?.flow === "signup") {
      return {
        actionLabel: "초기 계정 인증 요청",
        detail: "초기 계정 설정 절차에서 인증 코드를 발송했습니다.",
      };
    }

    const flow = payload?.flow === "recovery" ? "복구" : "계정";
    return {
      actionLabel: `${flow} 인증 요청`,
      detail: `${flow} 확인 절차에서 인증 코드를 발송했습니다.`,
    };
  }

  if (actionType === "phone_verified") {
    return {
      actionLabel: "문자 인증 확인",
      detail: "문자 인증 코드를 확인했습니다.",
    };
  }

  if (actionType === "password_set") {
    const flow = payload?.flow === "recovery" ? "recovery" : "signup";
    return {
      actionLabel:
        flow === "recovery"
          ? "비밀번호 재설정 완료"
          : "초기 비밀번호 설정 완료",
      detail:
        flow === "recovery"
          ? "재설정 플로우에서 새 비밀번호를 저장했습니다."
          : "초기 계정 설정 절차에서 비밀번호를 저장했습니다.",
    };
  }

  if (actionType === "password_reset_requested") {
    return {
      actionLabel: "비밀번호 재설정 요청",
      detail: "재설정용 문자 인증을 요청했습니다.",
    };
  }

  if (actionType === "onboarding_completed") {
    return {
      actionLabel: "초기 프로필 등록 완료",
      detail: "기본 채팅 톤과 임신 정보를 저장했습니다.",
    };
  }

  if (actionType === "profile_updated") {
    return {
      actionLabel: "프로필 업데이트",
      detail: "프로필 정보와 알림 설정을 수정했습니다.",
    };
  }

  const textPreview =
    typeof payload?.textPreview === "string" ? payload.textPreview.trim() : "";
  const imageCount =
    typeof payload?.imageCount === "number" ? payload.imageCount : 0;

  return {
    actionLabel: "채팅 메시지 전송",
    detail:
      textPreview ||
      (imageCount > 0
        ? `이미지 ${imageCount}장을 첨부해 채팅을 시작했습니다.`
        : "새 채팅 메시지를 전송했습니다."),
  };
}

export class SupabaseAdminDashboardPortAdapter implements AdminDashboardPort {
  private readonly fallback = new MockAdminDashboardPortAdapter();

  async getDashboard(): Promise<AdminDashboardData> {
    if (!hasBackendAdminConfig()) {
      return this.fallback.getDashboard();
    }

    const [
      users,
      profiles,
      sessions,
      messages,
      auditLogs,
      ragDocuments,
      userActions,
    ] = await Promise.all([
      supabaseSelect<
        Array<{
          id: string;
          display_name: string;
          phone_number: string;
          account_status: string;
          last_login_at: string | null;
        }>
      >(
        "users?select=id,display_name,phone_number,account_status,last_login_at",
      ),
      supabaseSelect<
        Array<{
          user_id: string;
          pregnancy_week: number | null;
          pregnancy_day_in_week: number | null;
        }>
      >(
        "pregnancy_profiles?select=user_id,pregnancy_week,pregnancy_day_in_week",
      ),
      supabaseSelect<
        Array<{
          id: string;
          user_id: string;
          title: string;
          last_message_at: string | null;
        }>
      >(
        "chat_sessions?select=id,user_id,title,last_message_at&order=last_message_at.desc.nullslast",
      ),
      supabaseSelect<
        Array<{
          id: string;
          session_id: string;
          role: "user" | "assistant" | "system";
          plain_text: string;
          created_at: string;
        }>
      >(
        "chat_messages?select=id,session_id,role,plain_text,created_at&order=created_at.desc",
      ),
      supabaseSelect<
        Array<{
          id: string;
          target_user_id: string | null;
          action_type: string;
          created_at: string;
        }>
      >(
        "admin_audit_logs?select=id,target_user_id,action_type,created_at&order=created_at.desc",
      ),
      supabaseSelect<
        Array<{
          id: string;
          title: string;
          pregnancy_week: number | null;
          category: string;
          metadata: { chunk_count?: number } | null;
          created_at: string;
        }>
      >(
        "pregnancy_documents?select=id,title,pregnancy_week,category,metadata,created_at&order=created_at.desc",
      ),
      supabaseSelect<
        Array<{
          id: string;
          user_id: string;
          session_id: string | null;
          message_id: string | null;
          action_type: UserActionType;
          payload: Record<string, unknown> | null;
          occurred_at: string;
        }>
      >(
        "user_action_logs?select=id,user_id,session_id,message_id,action_type,payload,occurred_at&order=occurred_at.desc&limit=60",
      ),
    ]);

    const dashboard = await this.fallback.getDashboard();
    const profilesByUser = new Map(
      profiles.map((profile) => [profile.user_id, profile]),
    );
    const messagesBySession = new Map<
      string,
      Array<(typeof messages)[number]>
    >();

    for (const message of messages) {
      const current = messagesBySession.get(message.session_id) ?? [];
      current.push(message);
      messagesBySession.set(message.session_id, current);
    }

    const sessionsByUser = new Map<string, Array<(typeof sessions)[number]>>();
    for (const session of sessions) {
      const current = sessionsByUser.get(session.user_id) ?? [];
      current.push(session);
      sessionsByUser.set(session.user_id, current);
    }

    const latestAuditByUser = new Map(
      auditLogs
        .filter((log) => log.target_user_id)
        .map((log) => [log.target_user_id as string, log]),
    );

    const usersById = new Map(users.map((user) => [user.id, user]));
    const sessionsById = new Map(
      sessions.map((session) => [session.id, session]),
    );
    const mappedUserActions: AdminUserAction[] = userActions.map((action) => {
      const user = usersById.get(action.user_id);
      const session = action.session_id
        ? sessionsById.get(action.session_id)
        : null;
      const description = formatUserActionLabel(
        action.action_type,
        action.payload,
      );

      return {
        id: action.id,
        userId: action.user_id,
        userName: user?.display_name ?? "알 수 없는 사용자",
        actionType: action.action_type,
        actionLabel: description.actionLabel,
        detail: description.detail,
        occurredAtLabel: new Date(action.occurred_at).toLocaleString("ko-KR"),
        sessionId: action.session_id,
        sessionTitle: session?.title ?? null,
      };
    });

    return {
      ...dashboard,
      metrics: dashboard.metrics.map((metric) => {
        if (metric.id === "active-users") {
          return { ...metric, value: String(users.length) };
        }

        if (metric.id === "daily-chats") {
          return { ...metric, value: sessions.length.toLocaleString("ko-KR") };
        }

        if (metric.id === "recovery") {
          return {
            ...metric,
            value: String(
              auditLogs.filter((log) =>
                ["phone_change", "login_id_change", "password_reset"].includes(
                  log.action_type,
                ),
              ).length,
            ),
          };
        }

        return metric;
      }),
      managedUsers: users.map((user) => {
        const latestAudit = latestAuditByUser.get(user.id);
        return {
          id: user.id,
          name: user.display_name,
          phoneNumber: user.phone_number,
          status: toManagedUserStatus(user.account_status),
          latestIssue: latestAudit?.action_type ?? user.account_status,
        };
      }),
      recoveryActions: auditLogs
        .filter((log) =>
          ["phone_change", "login_id_change", "password_reset"].includes(
            log.action_type,
          ),
        )
        .slice(0, 8)
        .map((log) => ({
          id: log.id,
          userName:
            users.find((user) => user.id === log.target_user_id)
              ?.display_name ?? "알 수 없는 사용자",
          action: log.action_type,
          requestedAt: new Date(log.created_at).toLocaleString("ko-KR"),
          status: "completed" as const,
        })),
      ragDocuments:
        ragDocuments.length > 0
          ? ragDocuments.map((document) => ({
              id: document.id,
              title: document.title,
              pregnancyWeekLabel: document.pregnancy_week
                ? `${document.pregnancy_week}주차`
                : "공통",
              category: document.category,
              chunkCount: document.metadata?.chunk_count ?? 1,
              updatedAt: new Date(document.created_at).toLocaleString("ko-KR"),
              status: "ready" as const,
            }))
          : dashboard.ragDocuments,
      historyUsers:
        users.length > 0
          ? users.slice(0, 6).map((user) => {
              const profile = profilesByUser.get(user.id);
              const userSessions = (sessionsByUser.get(user.id) ?? []).slice(
                0,
                3,
              );

              return {
                id: user.id,
                name: user.display_name,
                phoneNumber: user.phone_number,
                pregnancyWeekLabel: toPregnancyWeekLabel(
                  profile?.pregnancy_week ?? null,
                  profile?.pregnancy_day_in_week ?? null,
                ),
                latestSessionLabel: userSessions[0]?.last_message_at
                  ? new Date(userSessions[0].last_message_at).toLocaleString(
                      "ko-KR",
                    )
                  : "기록 없음",
                sessions: userSessions.map((session) => ({
                  id: session.id,
                  title: session.title,
                  updatedAtLabel: session.last_message_at
                    ? new Date(session.last_message_at).toLocaleString("ko-KR")
                    : "기록 없음",
                  pregnancyWeekLabel: toPregnancyWeekLabel(
                    profile?.pregnancy_week ?? null,
                    profile?.pregnancy_day_in_week ?? null,
                  ),
                  messages: (messagesBySession.get(session.id) ?? [])
                    .slice(0, 5)
                    .map((message) => ({
                      id: message.id,
                      role:
                        message.role === "system" ? "assistant" : message.role,
                      createdAtLabel: new Date(
                        message.created_at,
                      ).toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                      summary: message.plain_text || "요약 없음",
                    })),
                })),
              };
            })
          : dashboard.historyUsers,
      userActions:
        mappedUserActions.length > 0
          ? mappedUserActions
          : dashboard.userActions,
    };
  }
}

export class SupabaseAdminUserPortAdapter implements AdminUserPort {
  async listUsers(): Promise<AdminDashboardData["managedUsers"]> {
    if (!hasBackendAdminConfig()) {
      const fallback = new MockAdminDashboardPortAdapter();
      const dashboard = await fallback.getDashboard();
      return dashboard.managedUsers;
    }

    const users = await supabaseSelect<
      Array<{
        id: string;
        display_name: string;
        phone_number: string;
        account_status: string;
      }>
    >("users?select=id,display_name,phone_number,account_status");

    return users.map((user) => ({
      id: user.id,
      name: user.display_name,
      phoneNumber: user.phone_number,
      status: toManagedUserStatus(user.account_status),
      latestIssue: user.account_status,
    }));
  }

  async updatePhoneNumber(input: {
    actorId?: string;
    userId: string;
    phoneNumber: string;
    reason: string;
  }): Promise<void> {
    if (!hasBackendAdminConfig()) {
      return;
    }

    const existingUsers = await supabaseSelect<Array<{ phone_number: string }>>(
      `users?select=phone_number&id=eq.${input.userId}&limit=1`,
    );
    const beforePhoneNumber = existingUsers[0]?.phone_number ?? null;

    await supabaseUpdate(`users?id=eq.${input.userId}`, {
      phone_number: input.phoneNumber,
      updated_at: new Date().toISOString(),
    });

    await supabaseInsert("admin_audit_logs", {
      admin_user_id: input.actorId ?? getAdminActorId(),
      target_user_id: input.userId,
      action_type: "phone_change",
      entity_type: "user",
      entity_id: input.userId,
      reason: input.reason,
      before_payload: { phone_number: beforePhoneNumber },
      after_payload: { phone_number: input.phoneNumber },
    });
  }

  async resetPassword(input: {
    actorId?: string;
    userId: string;
    reason: string;
  }): Promise<void> {
    if (!hasBackendAdminConfig()) {
      return;
    }

    await supabaseUpdate(`users?id=eq.${input.userId}`, {
      account_status: "pending_recovery",
      updated_at: new Date().toISOString(),
    });

    await supabaseInsert("admin_audit_logs", {
      admin_user_id: input.actorId ?? getAdminActorId(),
      target_user_id: input.userId,
      action_type: "password_reset",
      entity_type: "user",
      entity_id: input.userId,
      reason: input.reason,
      before_payload: {},
      after_payload: { account_status: "pending_recovery" },
    });
  }
}
