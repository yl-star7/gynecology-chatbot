import type { MobileHomePort, TodayPort } from "@gynecology-chatbot/app-core";

export function createRecordDayActions(deps: {
  homePort: Pick<MobileHomePort, "getRecordDay">;
  todayPort: Pick<TodayPort, "setChecklistItemCompleted">;
}) {
  return {
    loadRecordDay(isoDate: string) {
      return deps.homePort.getRecordDay(isoDate);
    },
    setChecklistItemCompleted(input: {
      checklistId: string;
      completed: boolean;
    }) {
      return deps.todayPort.setChecklistItemCompleted(input);
    },
  };
}
