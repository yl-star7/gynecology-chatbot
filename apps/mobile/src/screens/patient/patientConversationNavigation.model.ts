import type { ChatSession } from "@gynecology-chatbot/app-core";

export async function prefetchConversationSession({
  sessionId,
  getSession,
  replaceSession,
}: {
  sessionId: string;
  getSession: (sessionId: string) => Promise<ChatSession>;
  replaceSession: (sessionId: string, session: ChatSession) => void;
}) {
  const session = await getSession(sessionId);
  replaceSession(sessionId, session);
  return session;
}
