function toLocalDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function isPastConversationSession(
  lastMessageAtIso: string | null | undefined,
  now: Date = new Date(),
) {
  if (!lastMessageAtIso) {
    return false;
  }

  const lastDate = new Date(lastMessageAtIso);
  if (Number.isNaN(lastDate.getTime())) {
    return false;
  }

  return toLocalDateKey(lastDate) !== toLocalDateKey(now);
}
