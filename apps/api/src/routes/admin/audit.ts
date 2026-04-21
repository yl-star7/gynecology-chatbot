import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";

function toAuditPayload(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export async function createAdminAuditLog(input: {
  adminUserId: string;
  targetUserId: string | null;
  actionType: string;
  entityType: string;
  entityId: string | null;
  reason: string;
  beforePayload: Record<string, unknown>;
  afterPayload: Record<string, unknown>;
}) {
  await prisma.admin_audit_logs.create({
    data: {
      admin_user_id: input.adminUserId,
      target_user_id: input.targetUserId,
      action_type: input.actionType,
      entity_type: input.entityType,
      entity_id: input.entityId,
      reason: input.reason,
      before_payload: toAuditPayload(input.beforePayload),
      after_payload: toAuditPayload(input.afterPayload),
    },
  });
}
