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
  supabaseDelete,
  supabaseInsert,
  supabaseSelect,
  supabaseUpdate,
} from "@/lib/mobile/supabase-rest";
import {
  createPhoneNumberStorage,
  decryptPhoneNumber,
  redactPhoneNumber,
} from "@/lib/privacy/phone-crypto";
import { normalizePhoneNumberToE164 } from "@/lib/mobile/twilio-verify";

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

function normalizeManagedPhoneNumber(phoneNumber: string) {
  const trimmed = phoneNumber.trim();
  if (!trimmed) {
    return trimmed;
  }

  try {
    return normalizePhoneNumberToE164(trimmed);
  } catch {
    return trimmed;
  }
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
      detail: "문자 인증 후 세션을 발급했습니다.",
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

function mapWorkflowRule(row: {
  id: string;
  name: string;
  provider: string;
  is_active: boolean;
  config: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
}) {
  const status: "active" | "review" = row.is_active ? "active" : "review";
  return {
    id: row.id,
    name: row.name,
    trigger:
      typeof row.metadata?.trigger === "string"
        ? row.metadata.trigger
        : typeof row.config?.trigger === "string"
          ? row.config.trigger
          : row.provider,
    retrievalScope:
      typeof row.metadata?.retrievalScope === "string"
        ? row.metadata.retrievalScope
        : typeof row.config?.retrievalScope === "string"
          ? row.config.retrievalScope
          : "기본 범위",
    modelName:
      typeof row.metadata?.modelName === "string"
        ? row.metadata.modelName
        : typeof row.config?.modelName === "string"
          ? row.config.modelName
          : "미설정",
    status,
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
      workflowDefinitions,
      userActions,
    ] = await Promise.all([
      supabaseSelect<
        Array<{
          id: string;
          phone_number_encrypted: string;
          account_status: string;
          last_login_at: string | null;
        }>
      >(
        "users?select=id,phone_number_encrypted,account_status,last_login_at",
      ),
      supabaseSelect<
        Array<{
          user_id: string;
          display_name: string | null;
          pregnancy_week: number | null;
          pregnancy_day_in_week: number | null;
        }>
      >(
        "pregnancy_profiles?select=user_id,display_name,pregnancy_week,pregnancy_day_in_week",
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
        "content.pregnancy_documents?select=id,title,pregnancy_week,category,metadata,created_at&order=created_at.desc",
      ),
      supabaseSelect<
        Array<{
          id: string;
          name: string;
          provider: string;
          is_active: boolean;
          config: Record<string, unknown> | null;
          metadata: Record<string, unknown> | null;
        }>
      >(
        "workflow_definitions?select=id,name,provider,is_active,config,metadata&order=updated_at.desc",
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

    const resolveDisplayName = (userId: string) =>
      profilesByUser.get(userId)?.display_name?.trim() || "알 수 없는 사용자";

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
        userName: user ? resolveDisplayName(user.id) : "알 수 없는 사용자",
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
                ["phone_change", "login_id_change", "session_reset"].includes(
                  log.action_type,
                )
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
          name: resolveDisplayName(user.id),
          phoneNumber: decryptPhoneNumber(user.phone_number_encrypted),
          status: toManagedUserStatus(user.account_status),
          latestIssue: latestAudit?.action_type ?? user.account_status,
        };
      }),
      recoveryActions: auditLogs
        .filter((log) =>
          ["phone_change", "login_id_change", "session_reset"].includes(
            log.action_type,
          ),
        )
        .slice(0, 8)
        .map((log) => ({
          id: log.id,
          userName: log.target_user_id
            ? resolveDisplayName(log.target_user_id)
            : "알 수 없는 사용자",
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
                name: resolveDisplayName(user.id),
                phoneNumber: decryptPhoneNumber(user.phone_number_encrypted),
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
      workflowRules:
        workflowDefinitions.length > 0
          ? workflowDefinitions.map(mapWorkflowRule)
          : dashboard.workflowRules,
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
        phone_number_encrypted: string;
        account_status: string;
      }>
    >("users?select=id,phone_number_encrypted,account_status");
    const profiles = await supabaseSelect<
      Array<{ user_id: string; display_name: string | null }>
    >("pregnancy_profiles?select=user_id,display_name");
    const profilesByUser = new Map(
      profiles.map((profile) => [profile.user_id, profile.display_name]),
    );

    return users.map((user) => ({
      id: user.id,
      name: profilesByUser.get(user.id)?.trim() || "알 수 없는 사용자",
      phoneNumber: decryptPhoneNumber(user.phone_number_encrypted),
      status: toManagedUserStatus(user.account_status),
      latestIssue: user.account_status,
    }));
  }

  async listAllowedPhoneNumbers() {
    if (!hasBackendAdminConfig()) {
      return [];
    }

    const rows = await supabaseSelect<
      Array<{
        id: string;
        phone_number_encrypted: string;
        display_name: string | null;
        note: string | null;
        created_at: string;
        updated_at: string;
      }>
    >(
      "allowed_phone_numbers?select=id,phone_number_encrypted,display_name,note,created_at,updated_at&order=updated_at.desc",
    );

    return rows.map((row) => ({
      id: row.id,
      phoneNumber: decryptPhoneNumber(row.phone_number_encrypted),
      displayName: row.display_name,
      note: row.note,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async createAllowedPhoneNumber(input: {
    actorId?: string;
    phoneNumber: string;
    displayName?: string | null;
    note?: string | null;
  }) {
    if (!hasBackendAdminConfig()) {
      throw new Error("backend admin configuration is required");
    }

    const normalizedPhoneNumber = normalizeManagedPhoneNumber(input.phoneNumber);
    const storage = createPhoneNumberStorage(normalizedPhoneNumber);
    const inserted = await supabaseInsert<
      Array<{
        id: string;
        phone_number_encrypted: string;
        display_name: string | null;
        note: string | null;
        created_at: string;
        updated_at: string;
      }>
    >("allowed_phone_numbers", {
      phone_number_encrypted: storage.phoneNumberEncrypted,
      phone_number_blind_index: storage.phoneNumberBlindIndex,
      phone_number_last4: storage.phoneNumberLast4,
      display_name: input.displayName ?? null,
      note: input.note ?? null,
      updated_at: new Date().toISOString(),
    });

    const createdEntry = {
      id: inserted[0]?.id ?? "",
      phoneNumber:
        inserted[0]?.phone_number_encrypted
          ? decryptPhoneNumber(inserted[0].phone_number_encrypted)
          : normalizedPhoneNumber,
      displayName: inserted[0]?.display_name ?? input.displayName ?? null,
      note: inserted[0]?.note ?? input.note ?? null,
      createdAt: inserted[0]?.created_at ?? new Date().toISOString(),
      updatedAt: inserted[0]?.updated_at ?? new Date().toISOString(),
    };

    await supabaseInsert("admin_audit_logs", {
      admin_user_id: input.actorId ?? getAdminActorId(),
      target_user_id: null,
      action_type: "content_update",
      entity_type: "allowed_phone_number",
      entity_id: createdEntry.id || null,
      reason: "allowed_phone_number_create",
      before_payload: {},
      after_payload: {
        phone_number: redactPhoneNumber(createdEntry.phoneNumber),
        display_name: createdEntry.displayName,
        note: createdEntry.note,
      },
    });

    return createdEntry;
  }

  async updateAllowedPhoneNumber(input: {
    actorId?: string;
    id: string;
    phoneNumber: string;
    displayName?: string | null;
    note?: string | null;
  }) {
    if (!hasBackendAdminConfig()) {
      throw new Error("backend admin configuration is required");
    }

    const normalizedPhoneNumber = normalizeManagedPhoneNumber(input.phoneNumber);
    const storage = createPhoneNumberStorage(normalizedPhoneNumber);
    const beforeRows = await supabaseSelect<
      Array<{
        id: string;
        phone_number_encrypted: string;
        display_name: string | null;
        note: string | null;
      }>
    >(`allowed_phone_numbers?select=id,phone_number_encrypted,display_name,note&id=eq.${input.id}&limit=1`);

    const updated = await supabaseUpdate<
      Array<{
        id: string;
        phone_number_encrypted: string;
        display_name: string | null;
        note: string | null;
        created_at: string;
        updated_at: string;
      }>
    >(`allowed_phone_numbers?id=eq.${input.id}`, {
      phone_number_encrypted: storage.phoneNumberEncrypted,
      phone_number_blind_index: storage.phoneNumberBlindIndex,
      phone_number_last4: storage.phoneNumberLast4,
      display_name: input.displayName ?? null,
      note: input.note ?? null,
      updated_at: new Date().toISOString(),
    });

    const updatedEntry = {
      id: updated[0]?.id ?? input.id,
      phoneNumber:
        updated[0]?.phone_number_encrypted
          ? decryptPhoneNumber(updated[0].phone_number_encrypted)
          : normalizedPhoneNumber,
      displayName: updated[0]?.display_name ?? input.displayName ?? null,
      note: updated[0]?.note ?? input.note ?? null,
      createdAt: updated[0]?.created_at ?? new Date().toISOString(),
      updatedAt: updated[0]?.updated_at ?? new Date().toISOString(),
    };

    await supabaseInsert("admin_audit_logs", {
      admin_user_id: input.actorId ?? getAdminActorId(),
      target_user_id: null,
      action_type: "content_update",
      entity_type: "allowed_phone_number",
      entity_id: updatedEntry.id,
      reason: "allowed_phone_number_update",
      before_payload: beforeRows[0]
        ? {
            ...beforeRows[0],
            phone_number: redactPhoneNumber(
              decryptPhoneNumber(beforeRows[0].phone_number_encrypted),
            ),
          }
        : {},
      after_payload: {
        phone_number: redactPhoneNumber(updatedEntry.phoneNumber),
        display_name: updatedEntry.displayName,
        note: updatedEntry.note,
      },
    });

    return updatedEntry;
  }

  async deleteAllowedPhoneNumber(input: { actorId?: string; id: string }) {
    if (!hasBackendAdminConfig()) {
      return;
    }

    const beforeRows = await supabaseSelect<
      Array<{
        id: string;
        phone_number_encrypted: string;
        display_name: string | null;
        note: string | null;
      }>
    >(`allowed_phone_numbers?select=id,phone_number_encrypted,display_name,note&id=eq.${input.id}&limit=1`);

    await supabaseDelete(`allowed_phone_numbers?id=eq.${input.id}`);

    await supabaseInsert("admin_audit_logs", {
      admin_user_id: input.actorId ?? getAdminActorId(),
      target_user_id: null,
      action_type: "content_update",
      entity_type: "allowed_phone_number",
      entity_id: input.id,
      reason: "allowed_phone_number_delete",
      before_payload: beforeRows[0]
        ? {
            ...beforeRows[0],
            phone_number: redactPhoneNumber(
              decryptPhoneNumber(beforeRows[0].phone_number_encrypted),
            ),
          }
        : {},
      after_payload: {},
    });
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

    const existingUsers = await supabaseSelect<
      Array<{ phone_number_encrypted: string }>
    >(
      `users?select=phone_number_encrypted&id=eq.${input.userId}&limit=1`,
    );
    const beforePhoneNumber = existingUsers[0]?.phone_number_encrypted
      ? decryptPhoneNumber(existingUsers[0].phone_number_encrypted)
      : null;
    const normalizedPhoneNumber = normalizeManagedPhoneNumber(input.phoneNumber);
    const storage = createPhoneNumberStorage(normalizedPhoneNumber);

    await supabaseUpdate(`users?id=eq.${input.userId}`, {
      phone_number_encrypted: storage.phoneNumberEncrypted,
      phone_number_blind_index: storage.phoneNumberBlindIndex,
      phone_number_last4: storage.phoneNumberLast4,
      updated_at: new Date().toISOString(),
    });

    await supabaseInsert("admin_audit_logs", {
      admin_user_id: input.actorId ?? getAdminActorId(),
      target_user_id: input.userId,
      action_type: "phone_change",
      entity_type: "user",
      entity_id: input.userId,
      reason: input.reason,
      before_payload: {
        phone_number: beforePhoneNumber
          ? redactPhoneNumber(beforePhoneNumber)
          : null,
      },
      after_payload: { phone_number: redactPhoneNumber(normalizedPhoneNumber) },
    });
  }

  async resetSession(input: {
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
      action_type: "session_reset",
      entity_type: "user",
      entity_id: input.userId,
      reason: input.reason,
      before_payload: {},
      after_payload: { account_status: "pending_recovery" },
    });
  }
}
