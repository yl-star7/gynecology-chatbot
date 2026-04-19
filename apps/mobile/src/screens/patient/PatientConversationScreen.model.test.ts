import assert from "node:assert/strict";
import test from "node:test";
import { createInitialConversationMessage } from "./PatientConversationInitialMessage.model.ts";

test("initial conversation message starts the workflow with emotion choices", () => {
  const message = createInitialConversationMessage();

  assert.equal(message.role, "assistant");
  assert.equal(message.characterTone, "calm");
  assert.deepEqual(
    message.parts.map((part) => part.type),
    ["text", "quickReplies"],
  );

  const quickReplies = message.parts.find(
    (part) => part.type === "quickReplies",
  );
  assert.deepEqual(
    quickReplies?.type === "quickReplies"
      ? quickReplies.choices.map((choice) => choice.label)
      : [],
    ["좋아요", "우울해요", "슬퍼요", "화나요", "직접 입력"],
  );
});
