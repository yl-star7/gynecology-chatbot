import type { ChatMessage, ChatSession } from "@gynecology-chatbot/app-core";
import { createContext, useContext, useMemo, useState } from "react";
import {
  cacheChatSession,
  readCachedChatSession,
} from "../core/patientViewCache";

interface ChatSessionsContextValue {
  sessions: ChatSession[];
  getSession(sessionId: string): ChatSession;
  replaceSession(sessionId: string, session: ChatSession): void;
  appendMessage(sessionId: string, title: string, message: ChatMessage): void;
}

const ChatSessionsContext = createContext<ChatSessionsContextValue | null>(
  null,
);

export function ChatSessionsProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId?: string | null;
}) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  const value = useMemo<ChatSessionsContextValue>(
    () => ({
      sessions,
      getSession(sessionId) {
        const inMemorySession =
          sessions.find((session) => session.id === sessionId) ?? null;
        const cachedSession = userId
          ? readCachedChatSession(userId, sessionId)
          : null;

        return (
          inMemorySession ??
          cachedSession ?? {
            id: sessionId,
            title: "새 상담",
            messages: [],
          }
        );
      },
      replaceSession(sessionId, session) {
        if (userId) {
          cacheChatSession(userId, sessionId, session);
        }

        setSessions((current) => [
          session,
          ...current.filter((item) => item.id !== session.id),
        ]);
      },
      appendMessage(sessionId, title, message) {
        setSessions((current) => {
          const existing =
            current.find((session) => session.id === sessionId) ??
            (userId ? readCachedChatSession(userId, sessionId) : null);
          const nextSession = existing
            ? { ...existing, title, messages: [...existing.messages, message] }
            : { id: sessionId, title, messages: [message] };

          if (userId) {
            cacheChatSession(userId, sessionId, nextSession);
          }

          return [
            nextSession,
            ...current.filter((session) => session.id !== sessionId),
          ];
        });
      },
    }),
    [sessions, userId],
  );

  return (
    <ChatSessionsContext.Provider value={value}>
      {children}
    </ChatSessionsContext.Provider>
  );
}

export function useChatSessions() {
  const value = useContext(ChatSessionsContext);
  if (!value) {
    throw new Error("useChatSessions must be used within ChatSessionsProvider");
  }

  return value;
}
