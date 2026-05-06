import { prisma } from "@gynecology-chatbot/db/prisma";

import type { AdminOpsAuditLogRow } from "@/components/admin/AdminOpsAuditSection";

const MAX_PAYLOAD_PREVIEW = 160;

function summarizePayload(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  try {
    const json = typeof raw === "string" ? raw : JSON.stringify(raw);
    if (!json || json === "{}" || json === "null") return "";
    return json.length > MAX_PAYLOAD_PREVIEW
      ? `${json.slice(0, MAX_PAYLOAD_PREVIEW)}…`
      : json;
  } catch {
    return "";
  }
}

export async function loadAdminOpsAuditLogs(): Promise<AdminOpsAuditLogRow[]> {
  const rows = await prisma.admin_audit_logs.findMany({
    select: {
      id: true,
      admin_user_id: true,
      action_type: true,
      entity_type: true,
      entity_id: true,
      reason: true,
      before_payload: true,
      after_payload: true,
      created_at: true,
    },
    orderBy: { created_at: "desc" },
    take: 200,
  });

  const uniqueActorIds = Array.from(
    new Set(rows.map((row) => row.admin_user_id)),
  );
  const profiles =
    uniqueActorIds.length > 0
      ? await prisma.pregnancy_profiles.findMany({
          where: { user_id: { in: uniqueActorIds } },
          select: { user_id: true, display_name: true },
        })
      : [];
  const actorDisplayNames = new Map<string, string>();
  for (const profile of profiles) {
    const name = profile.display_name?.trim();
    if (name) {
      actorDisplayNames.set(profile.user_id, name);
    }
  }

  return rows.map<AdminOpsAuditLogRow>((row) => ({
    id: row.id,
    actorDisplayName: actorDisplayNames.get(row.admin_user_id) ?? "운영자",
    actionType: row.action_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    reason: row.reason,
    beforeSummary: summarizePayload(row.before_payload),
    afterSummary: summarizePayload(row.after_payload),
    createdAt: row.created_at.toISOString(),
  }));
}
