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

export function warmConversationSessions({
  sessionIds,
  getSession,
  replaceSession,
  hasFreshSession,
  limit = 3,
}: {
  sessionIds: string[];
  getSession: (sessionId: string) => Promise<ChatSession>;
  replaceSession: (sessionId: string, session: ChatSession) => void;
  hasFreshSession: (sessionId: string) => boolean;
  limit?: number;
}) {
  const uniqueSessionIds = [...new Set(sessionIds)]
    .filter((sessionId) => !hasFreshSession(sessionId))
    .slice(0, limit);

  return Promise.allSettled(
    uniqueSessionIds.map((sessionId) =>
      prefetchConversationSession({
        sessionId,
        getSession,
        replaceSession,
      }),
    ),
  );
}
