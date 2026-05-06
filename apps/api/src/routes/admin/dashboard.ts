import { Hono } from "hono";
import type {
  AdminDashboardData,
  AdminWorkflowRule,
  UserAccountStatus,
  UserActionType,
} from "@gynecology-chatbot/app-core";
import { buildAdminWorkflowYamlCatalog } from "@gynecology-chatbot/app-core";
import { prisma } from "@gynecology-chatbot/db/prisma";
import { decryptPhoneNumber } from "@gynecology-chatbot/mobile-api/privacy/phone-crypto";

import { requireAdminProxy, type AdminProxyVariables } from "./auth.js";

const app = new Hono<{ Variables: AdminProxyVariables }>();

app.use("*", requireAdminProxy);

function toIsoStringOrNull(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function toPregnancyWeekLabel(week: number | null, dayInWeek: number | null) {
  if (!week) return "정보 없음";
  return `${week}주 ${dayInWeek ?? 0}일`;
}

function toManagedUserStatus(
  accountStatus: string,
): "active" | "attention" | "paused" {
  if (accountStatus === "active") return "active";
  if (accountStatus === "paused") return "paused";
  return "attention";
}

function formatAdminEventLabel(value: string | null | undefined) {
  if (!value) return "최근 이슈 없음";
  const labels: Record<string, string> = {
    active: "정상 이용 중",
    paused: "사용 중단 상태",
    pending_recovery: "접근 복구 대기",
    pending_approval: "사용 승인 대기",
    phone_change: "전화번호 변경",
    session_reset: "세션 초기화",
    content_update: "콘텐츠 설정 변경",
    account_pause: "사용 중단",
    account_resume: "사용 재개",
    account_approve: "사용 승인",
  };
  return labels[value] ?? value;
}

type RagDocumentMetadata = {
  chunk_count?: number;
  draft?: boolean;
  fileId?: unknown;
  sourceFileId?: unknown;
  source_file_id?: unknown;
  filename?: unknown;
  file_name?: unknown;
  sourceFilename?: unknown;
  source_filename?: unknown;
  source?: unknown;
};

function getMetadataString(
  metadata: RagDocumentMetadata | null | undefined,
  keys: Array<keyof RagDocumentMetadata>,
) {
  for (const key of keys) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function extractSourceFileId(metadata: RagDocumentMetadata | null | undefined) {
  const explicit = getMetadataString(metadata, [
    "fileId",
    "sourceFileId",
    "source_file_id",
  ]);
  if (explicit) return explicit;

  const sourceName = getMetadataString(metadata, [
    "filename",
    "file_name",
    "sourceFilename",
    "source_filename",
    "source",
  ]);
  const uuidPrefix = sourceName?.match(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
  );
  return uuidPrefix?.[0] ?? null;
}

function extractSourceFilename(
  metadata: RagDocumentMetadata | null | undefined,
) {
  return getMetadataString(metadata, [
    "filename",
    "file_name",
    "sourceFilename",
    "source_filename",
    "source",
  ]);
}

function mapWorkflowRule(row: {
  id: string;
  name: string;
  slug?: string | null;
  provider: string;
  is_active: boolean;
  config: unknown;
  metadata: unknown;
}): AdminWorkflowRule {
  const config =
    row.config && typeof row.config === "object" && !Array.isArray(row.config)
      ? (row.config as Record<string, unknown>)
      : {};
  const metadata =
    row.metadata &&
    typeof row.metadata === "object" &&
    !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {};
  const readString = (...keys: string[]) => {
    for (const key of keys) {
      const value = metadata[key] ?? config[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return null;
  };
  const workflowKind = readString("workflowKind", "kind", "workflow_kind");
  const gcsBucket = readString("gcsBucket", "gcs_bucket");
  const gcsObject = readString("gcsObject", "gcs_object", "yamlObject");
  const storagePath = readString(
    "storagePath",
    "storage_path",
    "yamlPath",
    "yaml_path",
    "gcsPath",
    "gcs_path",
  );
  return {
    id: row.id,
    name: row.name,
    trigger:
      typeof metadata.trigger === "string"
        ? metadata.trigger
        : typeof config.trigger === "string"
          ? config.trigger
          : row.provider,
    retrievalScope:
      typeof metadata.retrievalScope === "string"
        ? metadata.retrievalScope
        : typeof config.retrievalScope === "string"
          ? config.retrievalScope
          : "기본 범위",
    modelName:
      typeof metadata.modelName === "string"
        ? metadata.modelName
        : typeof config.modelName === "string"
          ? config.modelName
          : "미설정",
    status: row.is_active ? "active" : "review",
    source: "sql",
    workflowKind:
      workflowKind === "router" ||
      workflowKind === "subworkflow" ||
      workflowKind === "monolith" ||
      workflowKind === "managed"
        ? workflowKind
        : storagePath
          ? "managed"
          : undefined,
    storagePath,
    gcsBucket,
    gcsObject,
    sqlSlug: row.slug ?? null,
  };
}

function getWorkflowYamlBucket() {
  return process.env.GCS_WORKFLOW_BUCKET ?? "agaya-workflow-config";
}

function isRuntimeRoutedWorkflow(rule: AdminWorkflowRule) {
  return (
    rule.workflowKind === "router" || rule.workflowKind === "subworkflow"
  );
}

function mergeWorkflowRulesWithYamlCatalog(
  rows: Array<{
    id: string;
    name: string;
    slug: string | null;
    provider: string;
    is_active: boolean;
    config: unknown;
    metadata: unknown;
  }>,
): AdminWorkflowRule[] {
  const mappedRules = rows.map(mapWorkflowRule);
  const identityOf = (rule: AdminWorkflowRule) =>
    [rule.name, rule.trigger, rule.modelName]
      .map((part) => part.trim().toLowerCase())
      .join("::");
  const mappedBySlug = new Map(
    mappedRules
      .filter((rule) => rule.sqlSlug)
      .map((rule) => [rule.sqlSlug as string, rule]),
  );
  const mappedByIdentity = new Map(
    mappedRules.map((rule) => [identityOf(rule), rule]),
  );
  const catalogRules = buildAdminWorkflowYamlCatalog(getWorkflowYamlBucket());
  const orderedCatalogRules = catalogRules.map((catalogRule) => {
    const sqlRule =
      mappedBySlug.get(catalogRule.sqlSlug ?? "") ??
      mappedByIdentity.get(identityOf(catalogRule));
    if (!sqlRule) return catalogRule;
    return {
      ...catalogRule,
      ...sqlRule,
      workflowKind: sqlRule.workflowKind ?? catalogRule.workflowKind,
      storagePath: sqlRule.storagePath ?? catalogRule.storagePath,
      gcsBucket: sqlRule.gcsBucket ?? catalogRule.gcsBucket,
      gcsObject: sqlRule.gcsObject ?? catalogRule.gcsObject,
      source: "sql" as const,
    };
  });
  const catalogSlugs = new Set(
    catalogRules.map((rule) => rule.sqlSlug).filter(Boolean),
  );
  const catalogIdentities = new Set(catalogRules.map(identityOf));
  const catalogNames = new Set(catalogRules.map((rule) => rule.name));
  const extraSqlRules = mappedRules.filter(
    (rule) =>
      isRuntimeRoutedWorkflow(rule) &&
      (!rule.sqlSlug || !catalogSlugs.has(rule.sqlSlug)) &&
      !catalogIdentities.has(identityOf(rule)) &&
      !(catalogNames.has(rule.name) && !rule.storagePath),
  );

  return [...orderedCatalogRules, ...extraSqlRules];
}

function formatUserActionLabel(actionType: UserActionType) {
  const labels: Record<
    UserActionType,
    { actionLabel: string; detail: string }
  > = {
    account_paused: {
      actionLabel: "사용 중단",
      detail: "운영자가 이 사용자의 이용을 잠시 멈췄습니다.",
    },
    account_resumed: {
      actionLabel: "사용 재개",
      detail: "운영자가 이 사용자의 이용을 다시 열었습니다.",
    },
    account_approved: {
      actionLabel: "사용 승인",
      detail: "운영자가 이 사용자의 앱 이용을 승인했습니다.",
    },
    login_succeeded: {
      actionLabel: "로그인 완료",
      detail: "문자 인증 후 세션을 발급했습니다.",
    },
    phone_verification_started: {
      actionLabel: "인증 요청",
      detail: "전화번호 인증 코드를 발송했습니다.",
    },
    phone_verified: {
      actionLabel: "문자 인증 확인",
      detail: "문자 인증 코드를 확인했습니다.",
    },
    onboarding_completed: {
      actionLabel: "초기 프로필 등록 완료",
      detail: "기본 채팅 톤과 임신 정보를 저장했습니다.",
    },
    profile_updated: {
      actionLabel: "프로필 업데이트",
      detail: "프로필 정보와 알림 설정을 수정했습니다.",
    },
    chat_message_sent: {
      actionLabel: "채팅 메시지 전송",
      detail: "새 채팅 메시지를 전송했습니다.",
    },
  };
  return labels[actionType] ?? labels.chat_message_sent;
}

app.get("/dashboard", async (c) => {
  try {
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
      prisma.users.findMany({
        select: {
          id: true,
          phone_number_encrypted: true,
          account_status: true,
        },
      }),
      prisma.pregnancy_profiles.findMany({
        select: {
          user_id: true,
          display_name: true,
          pregnancy_week: true,
          pregnancy_day_in_week: true,
        },
      }),
      prisma.chat_sessions.findMany({
        select: {
          id: true,
          user_id: true,
          title: true,
          last_message_at: true,
        },
        orderBy: { last_message_at: { sort: "desc", nulls: "last" } },
        take: 500,
      }),
      prisma.chat_messages.findMany({
        select: {
          id: true,
          session_id: true,
          role: true,
          plain_text: true,
          created_at: true,
        },
        orderBy: { created_at: "desc" },
        take: 2000,
      }),
      prisma.admin_audit_logs.findMany({
        select: {
          id: true,
          target_user_id: true,
          action_type: true,
          created_at: true,
        },
        orderBy: { created_at: "desc" },
        take: 500,
      }),
      prisma.content_pregnancy_documents.findMany({
        select: {
          id: true,
          title: true,
          pregnancy_week: true,
          category: true,
          metadata: true,
          created_at: true,
          updated_at: true,
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.workflow_definitions.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          provider: true,
          is_active: true,
          config: true,
          metadata: true,
        },
        orderBy: { updated_at: "desc" },
      }),
      prisma.user_action_logs.findMany({
        select: {
          id: true,
          user_id: true,
          session_id: true,
          action_type: true,
          payload: true,
          occurred_at: true,
        },
        orderBy: { occurred_at: "desc" },
        take: 60,
      }),
    ]);

    const profilesByUser = new Map(
      profiles.map((profile) => [profile.user_id, profile]),
    );
    const sessionsByUser = new Map<string, typeof sessions>();
    for (const session of sessions) {
      const current = sessionsByUser.get(session.user_id) ?? [];
      current.push(session);
      sessionsByUser.set(session.user_id, current);
    }
    const messagesBySession = new Map<string, typeof messages>();
    for (const message of messages) {
      const current = messagesBySession.get(message.session_id) ?? [];
      current.push(message);
      messagesBySession.set(message.session_id, current);
    }
    const latestAuditByUser = new Map(
      auditLogs
        .filter((log) => log.target_user_id)
        .map((log) => [log.target_user_id as string, log.action_type]),
    );

    const managedUsers = users
      .filter((user) => typeof user.phone_number_encrypted === "string")
      .map((user) => ({
        id: user.id,
        name:
          profilesByUser.get(user.id)?.display_name?.trim() ||
          "알 수 없는 사용자",
        phoneNumber: decryptPhoneNumber(user.phone_number_encrypted as string),
        status: toManagedUserStatus(user.account_status),
        accountStatus: user.account_status as UserAccountStatus,
        latestIssue: formatAdminEventLabel(
          latestAuditByUser.get(user.id) ?? user.account_status,
        ),
      }));

    const historyUsers = managedUsers.map((user) => {
      const profile = profilesByUser.get(user.id);
      const userSessions = sessionsByUser.get(user.id) ?? [];
      return {
        id: user.id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        pregnancyWeekLabel: toPregnancyWeekLabel(
          profile?.pregnancy_week ?? null,
          profile?.pregnancy_day_in_week ?? null,
        ),
        latestSessionLabel: userSessions[0]?.last_message_at
          ? (toIsoStringOrNull(userSessions[0].last_message_at) ?? "기록 없음")
          : "기록 없음",
        sessions: userSessions.slice(0, 8).map((session) => ({
          id: session.id,
          title: session.title,
          updatedAtLabel:
            toIsoStringOrNull(session.last_message_at) ?? "기록 없음",
          pregnancyWeekLabel: toPregnancyWeekLabel(
            profile?.pregnancy_week ?? null,
            profile?.pregnancy_day_in_week ?? null,
          ),
          messages: (messagesBySession.get(session.id) ?? [])
            .slice(0, 20)
            .map((message) => ({
              id: message.id,
              role:
                message.role === "assistant" || message.role === "user"
                  ? (message.role as "assistant" | "user")
                  : ("assistant" as const),
              createdAtLabel: message.created_at.toISOString(),
              summary: message.plain_text || "(본문 없음)",
            })),
        })),
      };
    });

    const actions = userActions.map((action) => {
      const label = formatUserActionLabel(action.action_type as UserActionType);
      const sessionTitle =
        sessions.find((session) => session.id === action.session_id)?.title ??
        null;
      return {
        id: action.id,
        userId: action.user_id,
        userName:
          profilesByUser.get(action.user_id)?.display_name?.trim() ||
          "알 수 없는 사용자",
        actionType: action.action_type as UserActionType,
        actionLabel: label.actionLabel,
        detail: label.detail,
        occurredAtLabel: action.occurred_at.toISOString(),
        sessionId: action.session_id,
        sessionTitle,
      };
    });

    const dashboard: AdminDashboardData = {
      metrics: [
        {
          id: "active-users",
          label: "활성 사용자",
          value: String(users.length),
          changeLabel: "전체 등록",
        },
        {
          id: "daily-chats",
          label: "최근 대화",
          value: String(sessions.length),
          changeLabel: "최근 세션",
        },
        {
          id: "recovery",
          label: "계정 복구 요청",
          value: String(
            users.filter((user) => user.account_status === "pending_recovery")
              .length,
          ),
          changeLabel: "처리 대기",
        },
      ],
      managedUsers,
      recoveryActions: auditLogs.slice(0, 20).map((log) => ({
        id: log.id,
        userName:
          (log.target_user_id
            ? profilesByUser.get(log.target_user_id)?.display_name?.trim()
            : null) || "알 수 없는 사용자",
        action: formatAdminEventLabel(log.action_type),
        requestedAt: log.created_at.toISOString(),
        status: "completed",
      })),
      ragDocuments: ragDocuments.map((document) => {
        const metadata =
          document.metadata &&
          typeof document.metadata === "object" &&
          !Array.isArray(document.metadata)
            ? (document.metadata as RagDocumentMetadata)
            : null;
        return {
          id: document.id,
          title: document.title ?? "제목 없음",
          pregnancyWeekLabel: document.pregnancy_week
            ? `${document.pregnancy_week}주차`
            : "공통",
          category: document.category,
          chunkCount: metadata?.chunk_count ?? 1,
          updatedAt: (document.updated_at ?? document.created_at).toISOString(),
          status:
            metadata?.draft || metadata?.chunk_count === 0 ? "draft" : "ready",
          sourceFileId: extractSourceFileId(metadata),
          sourceFilename: extractSourceFilename(metadata),
        };
      }),
      workflowRules: mergeWorkflowRulesWithYamlCatalog(workflowDefinitions),
      historyUsers,
      userActions: actions,
    };

    return c.json({ dashboard });
  } catch (error) {
    console.error("admin api dashboard error", error);
    return c.json(
      {
        error:
          error instanceof Error ? error.message : "failed to load dashboard",
      },
      500,
    );
  }
});

export default app;
