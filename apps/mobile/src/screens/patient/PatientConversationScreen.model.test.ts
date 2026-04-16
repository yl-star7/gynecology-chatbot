import assert from "node:assert/strict";
import test from "node:test";
import { isPastConversationSession } from "./PatientConversationScreen.model.ts";

const now = new Date("2026-04-17T10:00:00+09:00");

test("isPastConversationSession treats missing timestamp as not past", () => {
  assert.equal(isPastConversationSession(null, now), false);
  assert.equal(isPastConversationSession(undefined, now), false);
});

test("isPastConversationSession keeps today's session editable", () => {
  assert.equal(
    isPastConversationSession("2026-04-17T00:05:00+09:00", now),
    false,
  );
  assert.equal(
    isPastConversationSession("2026-04-17T23:55:00+09:00", now),
    false,
  );
});

test("isPastConversationSession marks yesterday or earlier as past", () => {
  assert.equal(
    isPastConversationSession("2026-04-16T23:59:00+09:00", now),
    true,
  );
  assert.equal(
    isPastConversationSession("2026-01-01T10:00:00+09:00", now),
    true,
  );
});

test("isPastConversationSession ignores unparseable values", () => {
  assert.equal(isPastConversationSession("not-a-date", now), false);
});
