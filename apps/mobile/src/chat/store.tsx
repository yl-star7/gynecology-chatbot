import type { ChatMessage, ChatSession } from "@gynecology-chatbot/app-core";
import { createContext, useContext, useMemo, useState } from "react";

interface ChatSessionsContextValue {
  sessions: ChatSession[];
  getSession(sessionId: string): ChatSession;
  replaceSession(session: ChatSession): void;
  appendMessage(sessionId: string, title: string, message: ChatMessage): void;
}

const ChatSessionsContext = createContext<ChatSessionsContextValue | null>(null);

export function ChatSessionsProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  const value = useMemo<ChatSessionsContextValue>(
    () => ({
      sessions,
      getSession(sessionId) {
        return sessions.find((session) => session.id === sessionId) ?? { id: sessionId, title: "새 대화", messages: [] };
      },
      replaceSession(session) {
        setSessions((current) => [session, ...current.filter((item) => item.id !== session.id)]);
      },
      appendMessage(sessionId, title, message) {
        setSessions((current) => {
          const existing = current.find((session) => session.id === sessionId);
          if (!existing) {
            return [{ id: sessionId, title, messages: [message] }, ...current];
          }

          return [
            { ...existing, title, messages: [...existing.messages, message] },
            ...current.filter((session) => session.id !== sessionId),
          ];
        });
      },
    }),
    [sessions],
  );

  return <ChatSessionsContext.Provider value={value}>{children}</ChatSessionsContext.Provider>;
}

export function useChatSessions() {
  const value = useContext(ChatSessionsContext);
  if (!value) {
    throw new Error("useChatSessions must be used within ChatSessionsProvider");
  }

  return value;
}
