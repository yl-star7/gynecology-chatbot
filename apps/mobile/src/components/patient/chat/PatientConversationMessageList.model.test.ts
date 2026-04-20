import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveAssistantMessageIdsWithLaterUserMessage,
  resolveConversationMessageListState,
  resolveLatestVisibleQuickRepliesMessageId,
} from "./PatientConversationMessageList.model.ts";

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

test("assistant message id is marked when a later user message exists", () => {
  const result = resolveAssistantMessageIdsWithLaterUserMessage([
    { id: "a1", role: "assistant" },
    { id: "u1", role: "user" },
    { id: "a2", role: "assistant" },
  ]);

  assert.deepEqual([...result].sort(), ["a1"]);
});

test("latest quick replies message excludes assistant messages hidden by later user reply", () => {
  const messages = [
    {
      id: "a1",
      role: "assistant",
      parts: [
        {
          id: "q1",
          type: "quickReplies",
          title: "추천 질문",
          choices: [{ id: "c1", label: "질문", message: "질문" }],
        },
      ],
    },
    {
      id: "u1",
      role: "user",
      parts: [{ id: "t1", type: "text", text: "네" }],
    },
    {
      id: "a2",
      role: "assistant",
      parts: [
        {
          id: "q2",
          type: "quickReplies",
          title: "다음 질문",
          choices: [{ id: "c2", label: "질문2", message: "질문2" }],
        },
      ],
    },
  ] as const;

  const assistantMessageIdsWithLaterUserMessage =
    resolveAssistantMessageIdsWithLaterUserMessage(messages);

  assert.equal(
    resolveLatestVisibleQuickRepliesMessageId({
      messages,
      assistantMessageIdsWithLaterUserMessage,
    }),
    "a2",
  );
});
