import type {
  RecentChatSummary,
  RecordDayView,
} from "@gynecology-chatbot/app-core";
import { createPatientCacheDateKey } from "../../core/patientViewCacheFreshness.model.ts";

export function filterTodayConversationSessions({
  sessions,
  todayIsoDate,
}: {
  sessions: RecentChatSummary[];
  todayIsoDate: string;
}) {
  return sessions.filter((session) => {
    if (!session.updatedAtIso) {
      return false;
    }

    const timestampMs = Date.parse(session.updatedAtIso);
    if (Number.isNaN(timestampMs)) {
      return false;
    }

    return createPatientCacheDateKey(timestampMs) === todayIsoDate;
  });
}

export function buildTodayConversationSessionsState({
  recordDay,
  todayIsoDate,
  isLoadingRecordDay,
}: {
  recordDay: Pick<RecordDayView, "relatedSessions"> | null;
  todayIsoDate: string;
  isLoadingRecordDay: boolean;
}) {
  const recentSessions = recordDay
    ? filterTodayConversationSessions({
        sessions: recordDay.relatedSessions,
        todayIsoDate,
      })
    : [];

  return {
    recentSessions,
    isLoadingRecentSessions: isLoadingRecordDay && recentSessions.length === 0,
  };
}
