import type { ChatMessage } from "@gynecology-chatbot/app-core";
import { normalizeChatMarkdownLines } from "../../chat/ChatPartRenderer.model";

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

export function resolveShouldShowTypingIndicator({
  listState,
  isSending,
}: {
  listState: ConversationMessageListState;
  isSending: boolean;
}) {
  return isSending && (listState === "messages" || listState === "empty");
}

export function isRenderableConversationPart({
  part,
  messageId,
  assistantMessageIdsWithLaterUserMessage,
  latestQuickRepliesMessageId,
  isReadOnly = false,
}: {
  part: ChatMessage["parts"][number];
  messageId: string;
  assistantMessageIdsWithLaterUserMessage: Set<string>;
  latestQuickRepliesMessageId?: string;
  isReadOnly?: boolean;
}) {
  if (part.type === "text") {
    const visibleText = part.text
      .replace(/[\s\u200B-\u200D\uFEFF.·…⋯"'“”‘’,，\-*•·?!]+/g, "")
      .trim();
    if (visibleText.length === 0) return false;
    const normalized = normalizeChatMarkdownLines(part.text);
    return normalized.some((line) => line.trim().length > 0);
  }

  if (part.type === "image") {
    return part.imageUrl.trim().length > 0;
  }

  if (part.type === "deepLink") {
    return (
      part.target.trim().length > 0 &&
      (part.title.trim().length > 0 || part.description.trim().length > 0)
    );
  }

  if (part.type === "survey") {
    if (isReadOnly) {
      return false;
    }
    if (assistantMessageIdsWithLaterUserMessage.has(messageId)) {
      return false;
    }
    const hasContent =
      part.title.trim().length > 0 ||
      part.body.trim().length > 0 ||
      part.choices.length > 0;
    return hasContent;
  }

  if (part.type === "carousel") {
    return part.cards.length > 0;
  }

  if (part.type === "quickReplies") {
    if (isReadOnly) {
      return false;
    }
    if (messageId !== latestQuickRepliesMessageId) {
      return false;
    }
    return part.choices.length > 0;
  }

  return false;
}

export function resolveRenderableConversationMessages({
  messages,
  assistantMessageIdsWithLaterUserMessage,
  latestQuickRepliesMessageId,
  isReadOnly = false,
}: {
  messages: ChatMessage[];
  assistantMessageIdsWithLaterUserMessage: Set<string>;
  latestQuickRepliesMessageId?: string;
  isReadOnly?: boolean;
}) {
  return messages.filter((message) =>
    message.parts.some((part) =>
      isRenderableConversationPart({
        part,
        messageId: message.id,
        assistantMessageIdsWithLaterUserMessage,
        latestQuickRepliesMessageId,
        isReadOnly,
      }),
    ),
  );
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
}: {
  messages: Pick<ChatMessage, "id" | "role" | "parts">[];
  assistantMessageIdsWithLaterUserMessage: Set<string>;
}): string | undefined {
  return [...messages]
    .reverse()
    .find(
      (message) =>
        message.role === "assistant" &&
        message.parts.some((part) => part.type === "quickReplies"),
    )?.id;
}
