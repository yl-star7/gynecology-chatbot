import assert from "node:assert/strict";
import test from "node:test";
import type { ChatMessage } from "@gynecology-chatbot/app-core";
import { appendAssistantMessages } from "./PatientTodayScreen.model.ts";

test("appendAssistantMessages appends every assistant follow-up in order", () => {
  const initialMessages: ChatMessage[] = [
    {
      id: "user-1",
      role: "user",
      createdAtLabel: "방금 전",
      parts: [{ type: "text", id: "text-1", text: "안녕하세요" }],
    },
  ];

  const assistantMessages: ChatMessage[] = [
    {
      id: "assistant-1",
      role: "assistant",
      createdAtLabel: "방금 전",
      parts: [{ type: "text", id: "a-1", text: "첫 답변" }],
    },
    {
      id: "assistant-2",
      role: "assistant",
      createdAtLabel: "방금 전",
      parts: [{ type: "text", id: "a-2", text: "오늘의 질문" }],
    },
  ];

  const result = appendAssistantMessages(initialMessages, assistantMessages);

  assert.deepEqual(
    result.map((message) => message.id),
    ["user-1", "assistant-1", "assistant-2"],
  );
});
