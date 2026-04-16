import assert from "node:assert/strict";
import test from "node:test";
import type { ChatSession } from "@gynecology-chatbot/app-core";
import {
  prefetchConversationSession,
  warmConversationSessions,
} from "./patientConversationNavigation.model.ts";

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

test("warmConversationSessions prefetches only uncached recent sessions up to the limit", async () => {
  const calls: string[] = [];

  await warmConversationSessions({
    sessionIds: ["session-1", "session-2", "session-1", "session-3"],
    limit: 2,
    hasFreshSession(sessionId) {
      return sessionId === "session-2";
    },
    async getSession(sessionId) {
      calls.push(`fetch:${sessionId}`);
      return {
        id: sessionId,
        title: "아기와 대화",
        messages: [],
      };
    },
    replaceSession(sessionId, nextSession) {
      calls.push(`store:${sessionId}:${nextSession.id}`);
    },
  });

  assert.deepEqual(calls, [
    "fetch:session-1",
    "fetch:session-3",
    "store:session-1:session-1",
    "store:session-3:session-3",
  ]);
});
