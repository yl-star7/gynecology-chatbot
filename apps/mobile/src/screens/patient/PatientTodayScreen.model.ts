import type { ChatMessage } from "@gynecology-chatbot/app-core";

export function appendAssistantMessages(
  currentMessages: ChatMessage[],
  assistantMessages: ChatMessage[],
) {
  return [...currentMessages, ...assistantMessages];
}
