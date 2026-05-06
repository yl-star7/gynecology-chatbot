import type {
  AdminDashboardData,
  AdminDashboardPort,
  AdminWorkflowRule,
  AdminUserAction,
  AdminUserPort,
  UserAccountStatus,
  UserActionType,
} from "@gynecology-chatbot/app-core";
import { buildAdminWorkflowYamlCatalog } from "@gynecology-chatbot/app-core";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";

import { hasDockerConfig } from "@/lib/server-data-provider";
import { getSchiftClient } from "@/lib/mobile/schift-client";
import { listSchiftWorkflows } from "@/lib/mobile/schift-workflows-api";
import { normalizePhoneNumberToE164 } from "@/lib/mobile/solapi-sms";
import {
  createPhoneNumberStorage,
  decryptPhoneNumber,
  redactPhoneNumber,
} from "@/lib/privacy/phone-crypto";
import { recordUserAction } from "@/lib/mobile/user-action-log";
import { createAdminAuditLogSafe } from "@/lib/admin/admin-actor";

import { MockAdminDashboardPortAdapter } from "./mock-admin-dashboard-port";
import { mapSchiftWorkflowRule } from "./schift-workflow";

function hasBackendAdminConfig() {
  return hasDockerConfig();
}

type JsonValue = Prisma.JsonValue;
type RagSource = {
  fileId: string;
  filename: string;
  similarity: number;
};
type MessagePart = {
  type: string;
  sources?: RagSource[];
};
type WorkflowPayload = Record<string, unknown> | null;
type DashboardUserRow = {
  id: string;
  phone_number_encrypted: string;
  account_status: string;
  last_login_at: string | null;
};
type DashboardProfileRow = {
  user_id: string;
  display_name: string | null;
  pregnancy_week: number | null;
  pregnancy_day_in_week: number | null;
};
type DashboardSessionRow = {
  id: string;
  user_id: string;
  title: string;
  last_message_at: string | null;
};
type DashboardMessageRow = {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  plain_text: string;
  parts: MessagePart[] | null;
  created_at: string;
};
type DashboardAuditLogRow = {
  id: string;
  target_user_id: string | null;
  action_type: string;
  created_at: string;
};
type DashboardRagDocumentRow = {
  id: string;
  title: string;
  pregnancy_week: number | null;
  category: string;
  metadata: RagDocumentMetadata | null;
  created_at: string;
  updated_at?: string | null;
};
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
type DashboardWorkflowDefinitionRow = {
  id: string;
  name: string;
  slug: string | null;
  provider: string;
  is_active: boolean;
  config: WorkflowPayload;
  metadata: WorkflowPayload;
};
type DashboardUserActionRow = {
  id: string;
  user_id: string;
  session_id: string | null;
  message_id: string | null;
  action_type: UserActionType;
  payload: Record<string, unknown> | null;
  occurred_at: string;
};
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
  if (actionType === "account_paused") {
    return {
      actionLabel: "사용 중단",
      detail: "운영자가 이 사용자의 채팅과 로그인을 잠시 멈췄습니다.",
    };
  }

  if (actionType === "account_resumed") {
    return {
      actionLabel: "사용 재개",
      detail: "운영자가 이 사용자의 이용을 다시 열었습니다.",
    };
  }

  if (actionType === "account_approved") {
    return {
      actionLabel: "사용 승인",
      detail: "운영자가 이 사용자의 앱 이용을 승인했습니다.",
    };
  }

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

function formatAdminEventLabel(value: string | null | undefined) {
  if (!value) {
    return "최근 이슈 없음";
  }

  const labels: Record<string, string> = {
    active: "정상 이용 중",
    paused: "사용 중단 상태",
    deleted: "삭제된 계정",
    pending_recovery: "접근 복구 대기",
    pending_approval: "사용 승인 대기",
    content_update: "콘텐츠 설정 변경",
    phone_change: "전화번호 변경",
    session_reset: "세션 초기화",
    account_pause: "사용 중단",
    account_resume: "사용 재개",
    account_approve: "사용 승인",
    blocked_phone_number_create: "중지 번호 추가",
    blocked_phone_number_update: "중지 번호 수정",
    blocked_phone_number_delete: "중지 번호 삭제",
  };

  return labels[value] ?? value;
}

function toIsoStringOrNull(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}

function toJsonRecord(value: JsonValue): Record<string, unknown> | null {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}

function toWorkflowPayload(value: JsonValue): WorkflowPayload {
  return toJsonRecord(value);
}

function toMessageParts(value: JsonValue): MessagePart[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  return value as unknown as MessagePart[];
}

async function createAdminAuditLog(input: {
  adminUserId: string;
  targetUserId: string | null;
  actionType: string;
  entityType: string;
  entityId: string | null;
  reason: string;
  beforePayload: Record<string, unknown>;
  afterPayload: Record<string, unknown>;
}) {
  await createAdminAuditLogSafe(input);
}

function mapWorkflowRule(row: {
  id: string;
  name: string;
  slug?: string | null;
  provider: string;
  is_active: boolean;
  config: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
}): AdminWorkflowRule {
  const status: "active" | "review" = row.is_active ? "active" : "review";
  const readString = (...keys: string[]) => {
    for (const key of keys) {
      const value = row.metadata?.[key] ?? row.config?.[key];
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
  workflowDefinitions: DashboardWorkflowDefinitionRow[],
  schiftWorkflowRules: AdminWorkflowRule[],
) {
  const mappedRules = workflowDefinitions.map(mapWorkflowRule);
  const identityOf = (rule: AdminWorkflowRule) =>
    buildWorkflowIdentity({
      name: rule.name,
      trigger: rule.trigger,
      modelName: rule.modelName,
    });
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
  const sqlAndCatalogRules = [...orderedCatalogRules, ...extraSqlRules];
  const seenWorkflowIds = new Set(sqlAndCatalogRules.map((def) => def.id));
  const seenWorkflowIdentities = new Set(
    sqlAndCatalogRules.map((workflow) =>
      buildWorkflowIdentity({
        name: workflow.name,
        trigger: workflow.trigger,
        modelName: workflow.modelName,
      }),
    ),
  );
  const dedupedSchiftWorkflows = schiftWorkflowRules.filter((workflow) => {
    if (!isRuntimeRoutedWorkflow(workflow)) return false;
    if (seenWorkflowIds.has(workflow.id)) return false;

    const identity = buildWorkflowIdentity({
      name: workflow.name,
      trigger: workflow.trigger,
      modelName: workflow.modelName,
    });
    if (seenWorkflowIdentities.has(identity)) return false;

    seenWorkflowIdentities.add(identity);
    return true;
  });

  return [...sqlAndCatalogRules, ...dedupedSchiftWorkflows];
}

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

function normalizeWorkflowKeyPart(value: string) {
  return value.trim().toLowerCase();
}

function buildWorkflowIdentity(input: {
  name: string;
  trigger: string;
  modelName: string;
}) {
  return [input.name, input.trigger, input.modelName]
    .map(normalizeWorkflowKeyPart)
    .join("::");
}

export class CloudSqlAdminDashboardPortAdapter implements AdminDashboardPort {
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
      ragDocumentsResult,
      workflowDefinitionsResult,
      userActions,
      schiftWorkflowRules,
    ] = await Promise.all([
      prisma.users
        .findMany({
          select: {
            id: true,
            phone_number_encrypted: true,
            account_status: true,
            last_login_at: true,
          },
        })
        .then((rows) =>
          rows
            .filter(
              (row): row is typeof row & { phone_number_encrypted: string } =>
                typeof row.phone_number_encrypted === "string",
            )
            .map<DashboardUserRow>((row) => ({
              id: row.id,
              phone_number_encrypted: row.phone_number_encrypted,
              account_status: row.account_status,
              last_login_at: toIsoStringOrNull(row.last_login_at),
            })),
        ),
      prisma.pregnancy_profiles
        .findMany({
          select: {
            user_id: true,
            display_name: true,
            pregnancy_week: true,
            pregnancy_day_in_week: true,
          },
        })
        .then((rows) =>
          rows.map<DashboardProfileRow>((row) => ({
            user_id: row.user_id,
            display_name: row.display_name,
            pregnancy_week: row.pregnancy_week,
            pregnancy_day_in_week: row.pregnancy_day_in_week,
          })),
        ),
      prisma.chat_sessions
        .findMany({
          select: {
            id: true,
            user_id: true,
            title: true,
            last_message_at: true,
          },
          orderBy: { last_message_at: { sort: "desc", nulls: "last" } },
          take: 10000,
        })
        .then((rows) =>
          rows.map<DashboardSessionRow>((row) => ({
            id: row.id,
            user_id: row.user_id,
            title: row.title,
            last_message_at: toIsoStringOrNull(row.last_message_at),
          })),
        ),
      prisma.chat_messages
        .findMany({
          select: {
            id: true,
            session_id: true,
            role: true,
            plain_text: true,
            parts: true,
            created_at: true,
          },
          orderBy: { created_at: "desc" },
          take: 50000,
        })
        .then((rows) =>
          rows
            .filter(
              (
                row,
              ): row is typeof row & {
                role: "user" | "assistant" | "system";
              } =>
                row.role === "user" ||
                row.role === "assistant" ||
                row.role === "system",
            )
            .map<DashboardMessageRow>((row) => ({
              id: row.id,
              session_id: row.session_id,
              role: row.role,
              plain_text: row.plain_text,
              parts: toMessageParts(row.parts),
              created_at: row.created_at.toISOString(),
            })),
        ),
      prisma.admin_audit_logs
        .findMany({
          select: {
            id: true,
            target_user_id: true,
            action_type: true,
            created_at: true,
          },
          orderBy: { created_at: "desc" },
        })
        .then((rows) =>
          rows.map<DashboardAuditLogRow>((row) => ({
            id: row.id,
            target_user_id: row.target_user_id,
            action_type: row.action_type,
            created_at: row.created_at.toISOString(),
          })),
        ),
      (async () => {
        try {
          return await prisma.content_pregnancy_documents
            .findMany({
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
            })
            .then((rows) =>
              rows.map<DashboardRagDocumentRow>((row) => ({
                id: row.id,
                title: row.title ?? "제목 없음",
                pregnancy_week: row.pregnancy_week,
                category: row.category,
                metadata: toJsonRecord(
                  row.metadata,
                ) as RagDocumentMetadata | null,
                created_at: row.created_at.toISOString(),
                updated_at: row.updated_at?.toISOString() ?? null,
              })),
            );
        } catch (error) {
          console.error("admin dashboard rag documents unavailable", error);
          return null;
        }
      })(),
      (async () => {
        try {
          return await prisma.workflow_definitions
            .findMany({
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
            })
            .then((rows) =>
              rows.map<DashboardWorkflowDefinitionRow>((row) => ({
                id: row.id,
                name: row.name,
                slug: row.slug,
                provider: row.provider,
                is_active: row.is_active,
                config: toWorkflowPayload(row.config),
                metadata: toWorkflowPayload(row.metadata),
              })),
            );
        } catch (error) {
          console.error(
            "admin dashboard workflow definitions unavailable",
            error,
          );
          return null;
        }
      })(),
      prisma.user_action_logs
        .findMany({
          select: {
            id: true,
            user_id: true,
            session_id: true,
            message_id: true,
            action_type: true,
            payload: true,
            occurred_at: true,
          },
          orderBy: { occurred_at: "desc" },
          take: 60,
        })
        .then((rows) =>
          rows.map<DashboardUserActionRow>((row) => ({
            id: row.id,
            user_id: row.user_id,
            session_id: row.session_id,
            message_id: row.message_id,
            action_type: row.action_type as UserActionType,
            payload: toJsonRecord(row.payload),
            occurred_at: row.occurred_at.toISOString(),
          })),
        ),
      (async () => {
        const schift = getSchiftClient();
        if (!schift) {
          return [];
        }

        try {
          const workflows = await listSchiftWorkflows();
          return workflows.map(mapSchiftWorkflowRule);
        } catch (error) {
          console.error("admin dashboard schift workflows unavailable", error);
          return [];
        }
      })(),
    ]);

    const ragDocuments = ragDocumentsResult ?? [];
    const workflowDefinitions = workflowDefinitionsResult ?? [];

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
        occurredAtLabel: new Date(action.occurred_at).toLocaleString("ko-KR", {
          timeZone: "Asia/Seoul",
        }),
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
          name: resolveDisplayName(user.id),
          phoneNumber: decryptPhoneNumber(user.phone_number_encrypted),
          status: toManagedUserStatus(user.account_status),
          accountStatus: user.account_status as UserAccountStatus,
          latestIssue: formatAdminEventLabel(
            latestAudit?.action_type ?? user.account_status,
          ),
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
          requestedAt: new Date(log.created_at).toLocaleString("ko-KR", {
            timeZone: "Asia/Seoul",
          }),
          status: "completed" as const,
        })),
      ragDocuments: ragDocuments.map((document) => ({
        id: document.id,
        title: document.title,
        pregnancyWeekLabel: document.pregnancy_week
          ? `${document.pregnancy_week}주차`
          : "공통",
        category: document.category,
        chunkCount: document.metadata?.chunk_count ?? 1,
        updatedAt: new Date(
          document.updated_at ?? document.created_at,
        ).toLocaleString("ko-KR", {
          timeZone: "Asia/Seoul",
        }),
        status: "ready" as const,
        sourceFileId: extractSourceFileId(document.metadata),
        sourceFilename: extractSourceFilename(document.metadata),
      })),
      historyUsers:
        users.length > 0
          ? users.map((user) => {
              const profile = profilesByUser.get(user.id);
              const userSessions = sessionsByUser.get(user.id) ?? [];

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
                      { timeZone: "Asia/Seoul" },
                    )
                  : "기록 없음",
                sessions: userSessions.map((session) => ({
                  id: session.id,
                  title: session.title,
                  updatedAtLabel: session.last_message_at
                    ? new Date(session.last_message_at).toLocaleString(
                        "ko-KR",
                        {
                          timeZone: "Asia/Seoul",
                        },
                      )
                    : "기록 없음",
                  pregnancyWeekLabel: toPregnancyWeekLabel(
                    profile?.pregnancy_week ?? null,
                    profile?.pregnancy_day_in_week ?? null,
                  ),
                  messages: (messagesBySession.get(session.id) ?? []).map(
                    (message) => {
                      const ragSourcePart = (message.parts ?? []).find(
                        (p) => p.type === "_rag_sources",
                      );
                      return {
                        id: message.id,
                        role:
                          message.role === "system"
                            ? ("assistant" as const)
                            : message.role,
                        createdAtLabel: new Date(
                          message.created_at,
                        ).toLocaleTimeString("ko-KR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Seoul",
                        }),
                        summary: message.plain_text || "요약 없음",
                        ...(ragSourcePart?.sources?.length
                          ? { ragSources: ragSourcePart.sources }
                          : {}),
                      };
                    },
                  ),
                })),
              };
            })
          : dashboard.historyUsers,
      userActions:
        mappedUserActions.length > 0
          ? mappedUserActions
          : dashboard.userActions,
      workflowRules: mergeWorkflowRulesWithYamlCatalog(
        workflowDefinitions,
        schiftWorkflowRules,
      ),
    };
  }
}

export class CloudSqlAdminUserPortAdapter implements AdminUserPort {
  async listUsers(): Promise<AdminDashboardData["managedUsers"]> {
    if (!hasBackendAdminConfig()) {
      const fallback = new MockAdminDashboardPortAdapter();
      const dashboard = await fallback.getDashboard();
      return dashboard.managedUsers;
    }

    const [users, profiles] = await Promise.all([
      prisma.users
        .findMany({
          select: {
            id: true,
            phone_number_encrypted: true,
            account_status: true,
          },
        })
        .then((rows) =>
          rows.filter(
            (row): row is typeof row & { phone_number_encrypted: string } =>
              typeof row.phone_number_encrypted === "string",
          ),
        ),
      prisma.pregnancy_profiles.findMany({
        select: { user_id: true, display_name: true },
      }),
    ]);
    const profilesByUser = new Map(
      profiles.map((profile) => [profile.user_id, profile.display_name]),
    );

    return users.map((user) => ({
      id: user.id,
      name: profilesByUser.get(user.id)?.trim() || "알 수 없는 사용자",
      phoneNumber: decryptPhoneNumber(user.phone_number_encrypted),
      status: toManagedUserStatus(user.account_status),
      accountStatus: user.account_status as UserAccountStatus,
      latestIssue: formatAdminEventLabel(user.account_status),
    }));
  }

  async listAllowedPhoneNumbers() {
    if (!hasBackendAdminConfig()) {
      return [];
    }

    const rows = await prisma.blocked_phone_numbers.findMany({
      select: {
        id: true,
        phone_number_encrypted: true,
        display_name: true,
        note: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { updated_at: "desc" },
    });

    return rows.map((row) => ({
      id: row.id,
      phoneNumber: decryptPhoneNumber(row.phone_number_encrypted),
      displayName: row.display_name,
      note: row.note,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
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

    const normalizedPhoneNumber = normalizeManagedPhoneNumber(
      input.phoneNumber,
    );
    const storage = createPhoneNumberStorage(normalizedPhoneNumber);
    const existingRow = await prisma.blocked_phone_numbers.findUnique({
      where: { phone_number_blind_index: storage.phoneNumberBlindIndex },
      select: {
        id: true,
        phone_number_encrypted: true,
        display_name: true,
        note: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (existingRow) {
      return this.updateAllowedPhoneNumber({
        actorId: input.actorId,
        id: existingRow.id,
        phoneNumber: normalizedPhoneNumber,
        displayName: input.displayName ?? existingRow.display_name,
        note: input.note ?? existingRow.note,
      });
    }

    const inserted = await prisma.blocked_phone_numbers.create({
      data: {
        phone_number_encrypted: storage.phoneNumberEncrypted,
        phone_number_blind_index: storage.phoneNumberBlindIndex,
        phone_number_last4: storage.phoneNumberLast4,
        display_name: input.displayName ?? null,
        note: input.note ?? null,
        updated_at: new Date(),
      },
      select: {
        id: true,
        phone_number_encrypted: true,
        display_name: true,
        note: true,
        created_at: true,
        updated_at: true,
      },
    });

    const createdEntry = {
      id: inserted.id,
      phoneNumber: decryptPhoneNumber(inserted.phone_number_encrypted),
      displayName: inserted.display_name ?? input.displayName ?? null,
      note: inserted.note ?? input.note ?? null,
      createdAt: inserted.created_at.toISOString(),
      updatedAt: inserted.updated_at.toISOString(),
    };

    await createAdminAuditLog({
      adminUserId: input.actorId ?? getAdminActorId(),
      targetUserId: null,
      actionType: "content_update",
      entityType: "blocked_phone_number",
      entityId: createdEntry.id || null,
      reason: "blocked_phone_number_create",
      beforePayload: {},
      afterPayload: {
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

    const normalizedPhoneNumber = normalizeManagedPhoneNumber(
      input.phoneNumber,
    );
    const storage = createPhoneNumberStorage(normalizedPhoneNumber);
    const beforeRow = await prisma.blocked_phone_numbers.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        phone_number_encrypted: true,
        display_name: true,
        note: true,
      },
    });

    const updated = await prisma.blocked_phone_numbers.update({
      where: { id: input.id },
      data: {
        phone_number_encrypted: storage.phoneNumberEncrypted,
        phone_number_blind_index: storage.phoneNumberBlindIndex,
        phone_number_last4: storage.phoneNumberLast4,
        display_name: input.displayName ?? null,
        note: input.note ?? null,
        updated_at: new Date(),
      },
      select: {
        id: true,
        phone_number_encrypted: true,
        display_name: true,
        note: true,
        created_at: true,
        updated_at: true,
      },
    });

    const updatedEntry = {
      id: updated.id,
      phoneNumber: decryptPhoneNumber(updated.phone_number_encrypted),
      displayName: updated.display_name ?? input.displayName ?? null,
      note: updated.note ?? input.note ?? null,
      createdAt: updated.created_at.toISOString(),
      updatedAt: updated.updated_at.toISOString(),
    };

    await createAdminAuditLog({
      adminUserId: input.actorId ?? getAdminActorId(),
      targetUserId: null,
      actionType: "content_update",
      entityType: "blocked_phone_number",
      entityId: updatedEntry.id,
      reason: "blocked_phone_number_update",
      beforePayload: beforeRow
        ? {
            ...beforeRow,
            phone_number: redactPhoneNumber(
              decryptPhoneNumber(beforeRow.phone_number_encrypted),
            ),
          }
        : {},
      afterPayload: {
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

    const beforeRow = await prisma.blocked_phone_numbers.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        phone_number_encrypted: true,
        display_name: true,
        note: true,
      },
    });

    await prisma.blocked_phone_numbers.delete({ where: { id: input.id } });

    await createAdminAuditLog({
      adminUserId: input.actorId ?? getAdminActorId(),
      targetUserId: null,
      actionType: "content_update",
      entityType: "blocked_phone_number",
      entityId: input.id,
      reason: "blocked_phone_number_delete",
      beforePayload: beforeRow
        ? {
            ...beforeRow,
            phone_number: redactPhoneNumber(
              decryptPhoneNumber(beforeRow.phone_number_encrypted),
            ),
          }
        : {},
      afterPayload: {},
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

    const existingUser = await prisma.users.findUnique({
      where: { id: input.userId },
      select: { phone_number_encrypted: true },
    });
    const beforePhoneNumber = existingUser?.phone_number_encrypted
      ? decryptPhoneNumber(existingUser.phone_number_encrypted)
      : null;
    const normalizedPhoneNumber = normalizeManagedPhoneNumber(
      input.phoneNumber,
    );
    const storage = createPhoneNumberStorage(normalizedPhoneNumber);

    await prisma.users.update({
      where: { id: input.userId },
      data: {
        phone_number_encrypted: storage.phoneNumberEncrypted,
        phone_number_blind_index: storage.phoneNumberBlindIndex,
        phone_number_last4: storage.phoneNumberLast4,
        updated_at: new Date(),
      },
    });

    await createAdminAuditLog({
      adminUserId: input.actorId ?? getAdminActorId(),
      targetUserId: input.userId,
      actionType: "phone_change",
      entityType: "user",
      entityId: input.userId,
      reason: input.reason,
      beforePayload: {
        phone_number: beforePhoneNumber
          ? redactPhoneNumber(beforePhoneNumber)
          : null,
      },
      afterPayload: {
        phone_number: redactPhoneNumber(normalizedPhoneNumber),
      },
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

    await prisma.users.update({
      where: { id: input.userId },
      data: {
        account_status: "pending_recovery",
        updated_at: new Date(),
      },
    });

    await createAdminAuditLog({
      adminUserId: input.actorId ?? getAdminActorId(),
      targetUserId: input.userId,
      actionType: "session_reset",
      entityType: "user",
      entityId: input.userId,
      reason: input.reason,
      beforePayload: {},
      afterPayload: { account_status: "pending_recovery" },
    });
  }

  async updateUserStatus(input: {
    actorId?: string;
    userId: string;
    status: "active" | "paused";
    reason: string;
  }): Promise<void> {
    if (!hasBackendAdminConfig()) {
      return;
    }

    const beforeUser = await prisma.users.findUnique({
      where: { id: input.userId },
      select: { account_status: true },
    });
    const isApproval =
      beforeUser?.account_status === "pending_approval" &&
      input.status === "active";

    await prisma.users.update({
      where: { id: input.userId },
      data: {
        account_status: input.status,
        updated_at: new Date(),
      },
    });

    await createAdminAuditLog({
      adminUserId: input.actorId ?? getAdminActorId(),
      targetUserId: input.userId,
      actionType:
        input.status === "paused"
          ? "account_pause"
          : isApproval
            ? "account_approve"
            : "account_resume",
      entityType: "user",
      entityId: input.userId,
      reason: input.reason,
      beforePayload: { account_status: beforeUser?.account_status ?? null },
      afterPayload: { account_status: input.status },
    });

    await recordUserAction({
      userId: input.userId,
      actionType:
        input.status === "paused"
          ? "account_paused"
          : isApproval
            ? "account_approved"
            : "account_resumed",
      payload: { reason: input.reason },
    });
  }
}
