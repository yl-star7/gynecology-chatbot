function isUuid(value: string | null | undefined) {
  return Boolean(
    value?.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    ),
  );
}

export function resolvePendingQuickReplyQuestionIdForSend({
  currentText,
  pendingChoiceId,
  pendingChoiceText,
}: {
  currentText: string;
  pendingChoiceId: string | null;
  pendingChoiceText: string | null;
}): string | undefined {
  if (!isUuid(pendingChoiceId)) {
    return undefined;
  }

  if (!pendingChoiceText || currentText.trim() !== pendingChoiceText.trim()) {
    return undefined;
  }

  return pendingChoiceId ?? undefined;
}

export function resolveQuickReplyComposerText({
  choiceId,
  label,
  message,
}: {
  choiceId?: string | null;
  label: string;
  message: string;
}) {
  if (!isUuid(choiceId)) {
    return message;
  }

  return label;
}
