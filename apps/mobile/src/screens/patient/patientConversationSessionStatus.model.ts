import { createKoreanDateKey } from "@gynecology-chatbot/app-core";

export function isPastConversationSession(
  lastMessageAtIso: string | null | undefined,
  now: Date = new Date(),
) {
  if (!lastMessageAtIso) {
    return false;
  }

  const lastDate = new Date(lastMessageAtIso);
  if (Number.isNaN(lastDate.getTime())) {
    return false;
  }

  return createKoreanDateKey(lastDate) !== createKoreanDateKey(now);
}
