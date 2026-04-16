import assert from "node:assert/strict";
import test from "node:test";
import { resolveConversationMessageListState } from "./PatientConversationMessageList.model.ts";

test("conversation message list keeps existing empty sessions out of the new conversation empty state while loading", () => {
  assert.equal(
    resolveConversationMessageListState({
      messagesLength: 0,
      isLoadingSessionDetail: true,
      sessionLoadErrorMessage: null,
    }),
    "loading",
  );
});

test("conversation message list shows a load error instead of the new conversation empty state", () => {
  assert.equal(
    resolveConversationMessageListState({
      messagesLength: 0,
      isLoadingSessionDetail: false,
      sessionLoadErrorMessage: "대화를 불러오지 못했어요.",
    }),
    "error",
  );
});

test("conversation message list shows the new conversation empty state only when nothing is loading or failed", () => {
  assert.equal(
    resolveConversationMessageListState({
      messagesLength: 0,
      isLoadingSessionDetail: false,
      sessionLoadErrorMessage: null,
    }),
    "empty",
  );
});

test("conversation message list shows messages whenever messages exist", () => {
  assert.equal(
    resolveConversationMessageListState({
      messagesLength: 1,
      isLoadingSessionDetail: true,
      sessionLoadErrorMessage: "대화를 불러오지 못했어요.",
    }),
    "messages",
  );
});
