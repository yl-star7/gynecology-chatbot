import assert from "node:assert/strict";
import test from "node:test";
import type { ChatSession } from "@gynecology-chatbot/app-core";
import { prefetchConversationSession } from "./patientConversationNavigation.model.ts";

test("prefetchConversationSession stores the fetched conversation before navigation", async () => {
  const fetchedSession: ChatSession = {
    id: "session-1",
    title: "아기와 대화",
    messages: [],
  };
  const calls: string[] = [];

  const session = await prefetchConversationSession({
    sessionId: "session-1",
    async getSession(sessionId) {
      calls.push(`fetch:${sessionId}`);
      return fetchedSession;
    },
    replaceSession(sessionId, nextSession) {
      calls.push(`store:${sessionId}:${nextSession.id}`);
    },
  });

  assert.equal(session, fetchedSession);
  assert.deepEqual(calls, ["fetch:session-1", "store:session-1:session-1"]);
});
