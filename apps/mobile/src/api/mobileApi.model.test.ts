import assert from "node:assert/strict";
import test from "node:test";
import type { ChatMessage, ChatSession } from "@gynecology-chatbot/app-core";
import { sanitizeChatMessage, sanitizeChatSession } from "./mobileApi.model.ts";

test("sanitizeChatMessage drops internal context parts before app state sees them", () => {
  const message: ChatMessage = {
    id: "assistant-1",
    role: "assistant",
    createdAtLabel: "방금 전",
    parts: [
      { type: "text", id: "part-1", text: "안녕하세요" },
      {
        type: "_rag_sources",
        id: "internal-context",
        sources: [{ title: "내부 문서" }],
      } as never,
    ],
  };

  assert.deepEqual(sanitizeChatMessage(message).parts, [
    { type: "text", id: "part-1", text: "안녕하세요" },
  ]);
});

test("sanitizeChatSession drops internal context parts from cached messages", () => {
  const session: ChatSession = {
    id: "session-1",
    title: "대화",
    messages: [
      {
        id: "assistant-1",
        role: "assistant",
        createdAtLabel: "방금 전",
        parts: [
          {
            type: "_rag_sources",
            id: "internal-context",
            sources: [{ title: "내부 문서" }],
          } as never,
          { type: "text", id: "part-1", text: "안녕하세요" },
        ],
      },
    ],
  };

  assert.deepEqual(sanitizeChatSession(session).messages[0]?.parts, [
    { type: "text", id: "part-1", text: "안녕하세요" },
  ]);
});
