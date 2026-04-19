import test from "node:test";
import assert from "node:assert/strict";
import { getTableName } from "drizzle-orm";

test("schema module loads without throwing for drizzle generation", async () => {
  await assert.doesNotReject(() => import("./schema.ts"));
});

test("schema exports the runtime tables required by the web app", async () => {
  const schema = await import("./schema.ts");

  assert.equal(getTableName(schema.authSessions), "auth_sessions");
  assert.equal(
    getTableName(schema.phoneVerificationRequests),
    "phone_verification_requests",
  );
  assert.equal(
    getTableName(schema.allowedPhoneNumbers),
    "allowed_phone_numbers",
  );
  assert.equal(
    getTableName(schema.pregnancyWeekData),
    "pregnancy_week_data",
  );
  assert.equal(getTableName(schema.weekChecklists), "week_checklists");
  assert.equal(getTableName(schema.weekQuestions), "week_questions");
  assert.equal(
    getTableName(schema.userChecklistEvents),
    "user_checklist_events",
  );
  assert.equal(
    getTableName(schema.userQuestionEvents),
    "user_question_events",
  );
  assert.equal(
    getTableName(schema.userPersonaSignals),
    "user_persona_signals",
  );
  assert.equal(
    getTableName(schema.pregnancyDayContents),
    "pregnancy_day_contents",
  );
  assert.equal(getTableName(schema.pregnancyWeekMedia), "pregnancy_week_media");
  assert.equal(getTableName(schema.calendarLogs), "calendar_logs");
  assert.equal(getTableName(schema.knowledgeItems), "knowledge_items");
  assert.equal(getTableName(schema.messageLinks), "message_links");
  assert.equal(getTableName(schema.pregnancyDocuments), "pregnancy_documents");
  assert.equal(
    getTableName(schema.contentParaphraseRuns),
    "content_paraphrase_runs",
  );
  assert.equal(
    getTableName(schema.contentParaphrasedItems),
    "content_paraphrased_items",
  );
});
