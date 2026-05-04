export function shouldKeepQuickReplyInComposer({
  choiceId,
}: {
  choiceId?: string | null;
}) {
  return choiceId === "initial-workflow-direct";
}
