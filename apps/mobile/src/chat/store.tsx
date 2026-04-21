import type { ChatMessage, ChatSession } from "@gynecology-chatbot/app-core";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

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
}: {
  children: React.ReactNode;
  userId?: string | null;
}) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  const getSession = useCallback(
    (sessionId: string) => {
      const inMemorySession =
        sessions.find((session) => session.id === sessionId) ?? null;

      return (
        inMemorySession ?? {
          id: sessionId,
          title: "새 상담",
          messages: [],
        }
      );
    },
    [sessions],
  );

  const replaceSession = useCallback(
    (_sessionId: string, session: ChatSession) => {
      setSessions((current) => [
        session,
        ...current.filter((item) => item.id !== session.id),
      ]);
    },
    [],
  );

  const appendMessage = useCallback(
    (sessionId: string, title: string, message: ChatMessage) => {
      setSessions((current) => {
        const existing = current.find((session) => session.id === sessionId);
        const nextSession = existing
          ? { ...existing, title, messages: [...existing.messages, message] }
          : { id: sessionId, title, messages: [message] };

        return [
          nextSession,
          ...current.filter((session) => session.id !== sessionId),
        ];
      });
    },
    [],
  );

  const value = useMemo<ChatSessionsContextValue>(
    () => ({
      sessions,
      getSession,
      replaceSession,
      appendMessage,
    }),
    [appendMessage, getSession, replaceSession, sessions],
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
