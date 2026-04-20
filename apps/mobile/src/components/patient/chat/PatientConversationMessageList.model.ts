import type { ChatMessage } from "@gynecology-chatbot/app-core";

export type ConversationMessageListState =
  | "messages"
  | "loading"
  | "error"
  | "empty";

export function resolveConversationMessageListState({
  messagesLength,
  isLoadingSessionDetail,
  sessionLoadErrorMessage,
}: {
  messagesLength: number;
  isLoadingSessionDetail: boolean;
  sessionLoadErrorMessage: string | null;
}): ConversationMessageListState {
  if (messagesLength > 0) {
    return "messages";
  }

  if (isLoadingSessionDetail) {
    return "loading";
  }

  if (sessionLoadErrorMessage) {
    return "error";
  }

  return "empty";
}

export function resolveAssistantMessageIdsWithLaterUserMessage(
  messages: Pick<ChatMessage, "id" | "role">[],
): Set<string> {
  const result = new Set<string>();
  let hasSeenUserMessage = false;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!message) {
      continue;
    }

    if (message.role === "user") {
      hasSeenUserMessage = true;
      continue;
    }

    if (hasSeenUserMessage) {
      result.add(message.id);
    }
  }

  return result;
}

export function resolveLatestVisibleQuickRepliesMessageId({
  messages,
  assistantMessageIdsWithLaterUserMessage,
}: {
  messages: Pick<ChatMessage, "id" | "role" | "parts">[];
  assistantMessageIdsWithLaterUserMessage: Set<string>;
}): string | undefined {
  return [...messages]
    .reverse()
    .find(
      (message) =>
        message.role === "assistant" &&
        !assistantMessageIdsWithLaterUserMessage.has(message.id) &&
        message.parts.some((part) => part.type === "quickReplies"),
    )?.id;
}
