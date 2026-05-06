import type { Prisma } from "@gynecology-chatbot/db/prisma";
import { prisma } from "@gynecology-chatbot/db/prisma";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export async function resolveAdminActorId(actorId?: string | null) {
  if (!isUuid(actorId)) return null;

  const user = await prisma.users.findUnique({
    where: { id: actorId },
    select: { id: true },
  });

  return user?.id ?? null;
}

function normalizeNullableUuid(value: string | null, label: string) {
  if (!value) return null;
  if (isUuid(value)) return value;

  console.warn(`Skipping invalid UUID value in admin audit log: ${label}`, {
    value,
  });
  return null;
}

function toAuditPayload(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export async function createAdminAuditLogSafe(input: {
  adminUserId?: string | null;
  targetUserId?: string | null;
  actionType: string;
  entityType: string;
  entityId?: string | null;
  reason: string;
  beforePayload: Record<string, unknown>;
  afterPayload: Record<string, unknown>;
}) {
  const adminUserId = await resolveAdminActorId(input.adminUserId);
  if (!adminUserId) {
    console.warn("Skipping admin audit log for non-DB admin user id", {
      actionType: input.actionType,
      entityType: input.entityType,
      entityId: input.entityId,
    });
    return;
  }

  try {
    await prisma.admin_audit_logs.create({
      data: {
        admin_user_id: adminUserId,
        target_user_id: normalizeNullableUuid(
          input.targetUserId ?? null,
          "target_user_id",
        ),
        action_type: input.actionType,
        entity_type: input.entityType,
        entity_id: normalizeNullableUuid(input.entityId ?? null, "entity_id"),
        reason: input.reason,
        before_payload: toAuditPayload(input.beforePayload),
        after_payload: toAuditPayload(input.afterPayload),
      },
    });
  } catch (error) {
    console.warn("Skipping admin audit log after write failure", error);
  }
}
