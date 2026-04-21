import type { RecentChatSummary } from "@gynecology-chatbot/app-core";
import { createPatientCacheDateKey } from "../../core/patientViewCacheFreshness.model";

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
