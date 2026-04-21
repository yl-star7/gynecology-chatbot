import assert from "node:assert/strict";
import test from "node:test";
import { isPastConversationSession } from "./patientConversationSessionStatus.model.ts";

test("isPastConversationSession uses Korean calendar days", () => {
  const previousTimeZone = process.env.TZ;
  process.env.TZ = "UTC";

  try {
    const afterKoreanMidnight = new Date("2026-04-20T15:30:00.000Z");

    assert.equal(
      isPastConversationSession(
        "2026-04-20T14:50:00.000Z",
        afterKoreanMidnight,
      ),
      true,
    );
    assert.equal(
      isPastConversationSession(
        "2026-04-20T15:05:00.000Z",
        afterKoreanMidnight,
      ),
      false,
    );
  } finally {
    if (previousTimeZone === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = previousTimeZone;
    }
  }
});
