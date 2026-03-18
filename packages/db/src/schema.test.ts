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
  assert.equal(getTableName(schema.calendarLogs), "calendar_logs");
  assert.equal(getTableName(schema.knowledgeItems), "knowledge_items");
  assert.equal(getTableName(schema.messageLinks), "message_links");
  assert.equal(getTableName(schema.pregnancyDocuments), "pregnancy_documents");
});
