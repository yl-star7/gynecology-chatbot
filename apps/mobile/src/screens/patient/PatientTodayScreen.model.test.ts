import assert from "node:assert/strict";
import test from "node:test";
import type { ChatMessage, RecordDayView } from "@gynecology-chatbot/app-core";
import {
  appendAssistantMessages,
  confirmChecklistRequest,
  createChecklistSyncTracker,
  resolveChecklistRequest,
  rememberChecklistDesiredState,
  rollbackChecklistRequest,
  updateRecordDayChecklistItems,
} from "./PatientTodayScreen.helpers.ts";

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

const recordDay: RecordDayView = {
  isoDate: "2026-04-18",
  dateLabel: "2026년 4월 18일 토요일",
  infoViewed: true,
  emotionTone: null,
  checklistItems: [
    { id: "check-1", label: "물 마시기", completed: false },
    { id: "check-2", label: "산책하기", completed: false },
  ],
  dailyQuestion: null,
  records: [],
  relatedSessions: [],
};

test("updateRecordDayChecklistItems updates a matching cached record day item", () => {
  const result = updateRecordDayChecklistItems(recordDay, "check-1", true);

  assert.equal(result?.checklistItems[0]?.completed, true);
  assert.equal(result?.checklistItems[1]?.completed, false);
});

test("updateRecordDayChecklistItems returns null when cached record day uses stale checklist ids", () => {
  const result = updateRecordDayChecklistItems(recordDay, "today-check", true);

  assert.equal(result, null);
});

test("checklist sync tracker keeps the latest desired state while a request is in flight", () => {
  const tracker = createChecklistSyncTracker(recordDay.checklistItems);

  rememberChecklistDesiredState(tracker, "check-1", true);
  assert.deepEqual(resolveChecklistRequest(tracker, "check-1"), {
    checklistId: "check-1",
    completed: true,
  });

  rememberChecklistDesiredState(tracker, "check-1", false);
  assert.equal(resolveChecklistRequest(tracker, "check-1"), null);

  confirmChecklistRequest(tracker, "check-1", true);
  assert.deepEqual(resolveChecklistRequest(tracker, "check-1"), {
    checklistId: "check-1",
    completed: false,
  });
});

test("rollbackChecklistRequest restores the last confirmed checklist state", () => {
  const tracker = createChecklistSyncTracker(recordDay.checklistItems);

  rememberChecklistDesiredState(tracker, "check-1", true);
  assert.equal(rollbackChecklistRequest(tracker, "check-1"), false);
  assert.equal(resolveChecklistRequest(tracker, "check-1"), null);
});
