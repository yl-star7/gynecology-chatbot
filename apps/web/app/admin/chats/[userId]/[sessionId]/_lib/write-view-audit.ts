import { createAdminAuditLogSafe } from "@/lib/admin/admin-actor";

export interface RecordViewChatMessagesAuditInput {
  actorUserId: string;
  targetUserId: string;
  sessionId: string;
}

export async function recordViewChatMessagesAudit(
  input: RecordViewChatMessagesAuditInput,
) {
  await createAdminAuditLogSafe({
    adminUserId: input.actorUserId,
    targetUserId: input.targetUserId,
    actionType: "view_chat_messages",
    entityType: "chat_session",
    entityId: input.sessionId,
    reason: "admin console session view",
    beforePayload: {},
    afterPayload: {},
  });
}
