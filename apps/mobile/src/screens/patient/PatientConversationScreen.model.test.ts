import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveConversationDeepLinkAction,
  resolvePregnancyWeekFromDeepLink,
} from "./PatientConversationDeepLink.model.ts";
import { shouldKeepQuickReplyInComposer } from "./PatientConversationQuickReply.model.ts";

test("conversation deep links infer weekly encyclopedia targets from Korean week text", () => {
  assert.equal(
    resolvePregnancyWeekFromDeepLink({
      title: "27주차 아기 발달",
      description: "더 자세히 볼 수 있어요.",
    }),
    27,
  );
  assert.equal(
    resolvePregnancyWeekFromDeepLink({
      entityId: "week-25",
    }),
    25,
  );
});

test("knowledge deep links for a pregnancy week open the encyclopedia screen", () => {
  assert.deepEqual(
    resolveConversationDeepLinkAction({
      target: "knowledge",
      title: "27주차 아기 발달",
      description: "더 자세히 볼 수 있어요.",
    }),
    {
      type: "encyclopedia",
      href: "/encyclopedia?mode=browse&week=27",
    },
  );
});

test("non-week deep links keep the existing sheet behavior", () => {
  assert.deepEqual(
    resolveConversationDeepLinkAction({
      target: "knowledge",
      entityId: "550e8400-e29b-41d4-a716-446655440025",
      title: "두통 위험 신호",
    }),
    {
      type: "sheet",
      target: "knowledge",
      entityId: "550e8400-e29b-41d4-a716-446655440025",
    },
  );
});

test("quick replies send immediately except direct input", () => {
  assert.equal(
    shouldKeepQuickReplyInComposer({ choiceId: "initial-workflow-direct" }),
    true,
  );
  assert.equal(
    shouldKeepQuickReplyInComposer({ choiceId: "initial-workflow-good" }),
    false,
  );
  assert.equal(
    shouldKeepQuickReplyInComposer({
      choiceId: "550e8400-e29b-41d4-a716-446655440025",
    }),
    false,
  );
  assert.equal(shouldKeepQuickReplyInComposer({ choiceId: undefined }), false);
});
