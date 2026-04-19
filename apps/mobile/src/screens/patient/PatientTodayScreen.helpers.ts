import type { ChatMessage, RecordDayView } from "@gynecology-chatbot/app-core";

export function appendAssistantMessages(
  currentMessages: ChatMessage[],
  assistantMessages: ChatMessage[],
) {
  return [...currentMessages, ...assistantMessages];
}

export function updateRecordDayChecklistItems(
  recordDay: RecordDayView,
  checklistId: string,
  completed: boolean,
) {
  let didUpdate = false;
  const checklistItems = recordDay.checklistItems.map((item) => {
    if (item.id !== checklistId) {
      return item;
    }

    didUpdate = true;
    return { ...item, completed };
  });

  if (!didUpdate) {
    return null;
  }

  return {
    ...recordDay,
    checklistItems,
  };
}
