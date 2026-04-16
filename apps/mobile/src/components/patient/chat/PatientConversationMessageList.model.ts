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
