import type { UserActionType } from "@gynecology-chatbot/app-core";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";

export interface RecordUserActionInput {
  userId: string;
  actionType: UserActionType;
  sessionId?: string | null;
  messageId?: string | null;
  payload?: Record<string, unknown>;
}

export async function recordUserAction(input: RecordUserActionInput) {
  if (!input.userId) {
    return;
  }

  try {
    await prisma.user_action_logs.create({
      data: {
        user_id: input.userId,
        session_id: input.sessionId ?? null,
        message_id: input.messageId ?? null,
        action_type: input.actionType,
        payload: (input.payload ?? {}) as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    console.warn("failed to record user action", error);
  }
}
