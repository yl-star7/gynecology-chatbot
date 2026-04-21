import assert from "node:assert/strict";
import test from "node:test";
import {
  isRenderableConversationPart,
  resolveAssistantMessageIdsWithLaterUserMessage,
  resolveConversationMessageListState,
  resolveLatestVisibleQuickRepliesMessageId,
  resolveShouldShowTypingIndicator,
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

test("conversation message list shows typing indicator while a message is waiting for a reply", () => {
  assert.equal(
    resolveShouldShowTypingIndicator({
      listState: "messages",
      isSending: true,
    }),
    true,
  );
});

test("conversation message list hides typing indicator outside active message sends", () => {
  assert.equal(
    resolveShouldShowTypingIndicator({
      listState: "empty",
      isSending: true,
    }),
    true,
  );
  assert.equal(
    resolveShouldShowTypingIndicator({
      listState: "messages",
      isSending: false,
    }),
    false,
  );
});

test("conversation message list shows typing indicator while first message is being appended", () => {
  assert.equal(
    resolveShouldShowTypingIndicator({
      listState: "empty",
      isSending: true,
    }),
    true,
  );
});

test("conversation message list hides placeholder-only assistant text bubbles", () => {
  const hiddenTexts = [
    "",
    "   ",
    "...",
    "…",
    "⋯",
    " · · · ",
    "\u200B...\u200B",
  ];

  for (const text of hiddenTexts) {
    assert.equal(
      isRenderableConversationPart({
        part: { id: `text-${text}`, type: "text", text },
        messageId: "assistant-1",
        assistantMessageIdsWithLaterUserMessage: new Set(),
      }),
      false,
    );
  }
});

test("conversation message list renders text with real content", () => {
  assert.equal(
    isRenderableConversationPart({
      part: { id: "text-1", type: "text", text: "확인해볼까요?" },
      messageId: "assistant-1",
      assistantMessageIdsWithLaterUserMessage: new Set(),
    }),
    true,
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
