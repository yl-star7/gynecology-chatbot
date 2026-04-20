import type {
  ChatMessage,
  RecordDayView,
  TodayViewData,
} from "@gynecology-chatbot/app-core";

export type ChecklistSyncTracker = {
  confirmedById: Record<string, boolean>;
  desiredById: Record<string, boolean>;
};

export function appendAssistantMessages(
  currentMessages: ChatMessage[],
  assistantMessages: ChatMessage[],
) {
  return [...currentMessages, ...assistantMessages];
}

export function buildChecklistCompletionMap(
  items: Array<{ id: string; completed: boolean }>,
) {
  return items.reduce<Record<string, boolean>>((map, item) => {
    map[item.id] = item.completed;
    return map;
  }, {});
}

export function createChecklistSyncTracker(
  items: Array<{ id: string; completed: boolean }>,
): ChecklistSyncTracker {
  const completionMap = buildChecklistCompletionMap(items);
  return {
    confirmedById: { ...completionMap },
    desiredById: { ...completionMap },
  };
}

export function hydrateChecklistSyncTracker(
  tracker: ChecklistSyncTracker,
  items: Array<{ id: string; completed: boolean }>,
) {
  const completionMap = buildChecklistCompletionMap(items);
  tracker.confirmedById = { ...completionMap };
  tracker.desiredById = { ...completionMap };
}

export function rememberChecklistDesiredState(
  tracker: ChecklistSyncTracker,
  checklistId: string,
  completed: boolean,
) {
  tracker.desiredById[checklistId] = completed;
}

export function resolveChecklistRequest(
  tracker: ChecklistSyncTracker,
  checklistId: string,
) {
  const desired = tracker.desiredById[checklistId];
  const confirmed = tracker.confirmedById[checklistId];

  if (typeof desired !== "boolean" || desired === confirmed) {
    return null;
  }

  return { checklistId, completed: desired };
}

export function confirmChecklistRequest(
  tracker: ChecklistSyncTracker,
  checklistId: string,
  completed: boolean,
) {
  tracker.confirmedById[checklistId] = completed;
}

export function rollbackChecklistRequest(
  tracker: ChecklistSyncTracker,
  checklistId: string,
) {
  const confirmed = tracker.confirmedById[checklistId] ?? false;
  tracker.desiredById[checklistId] = confirmed;
  return confirmed;
}

export function updateTodayChecklistItems(
  today: TodayViewData,
  checklistId: string,
  completed: boolean,
) {
  let didUpdate = false;
  const checklistItems = today.checklistItems.map((item) => {
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
    ...today,
    checklistItems,
  };
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
