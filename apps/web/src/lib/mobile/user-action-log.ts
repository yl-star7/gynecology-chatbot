import type { UserActionType } from "@gynecology-chatbot/app-core";
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client";

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
    const client = getSupabaseAdminClient();
    const { error } = await client.from("user_action_logs").insert({
      user_id: input.userId,
      session_id: input.sessionId ?? null,
      message_id: input.messageId ?? null,
      action_type: input.actionType,
      payload: input.payload ?? {},
    });
    if (error) {
      throw error;
    }
  } catch (error) {
    console.warn("failed to record user action", error);
  }
}
