import type { ChatMessage, ChatSession } from "@gynecology-chatbot/app-core";

const ALLOWED_CHAT_PART_TYPES = new Set([
  "text",
  "quickReplies",
  "survey",
  "carousel",
  "image",
  "deepLink",
]);

export function sanitizeChatMessage(message: ChatMessage): ChatMessage {
  return {
    ...message,
    parts: message.parts.filter((part) => ALLOWED_CHAT_PART_TYPES.has(part.type)),
  };
}

export function sanitizeChatSession(session: ChatSession): ChatSession {
  return {
    ...session,
    messages: session.messages.map(sanitizeChatMessage),
  };
}
