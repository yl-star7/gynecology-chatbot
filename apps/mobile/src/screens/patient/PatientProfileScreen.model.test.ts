import assert from "node:assert/strict";
import test from "node:test";
import {
  buildProfileInfoCards,
  buildProfileDayState,
  resolveProfileBabyImageWeekLabel,
} from "./PatientProfileScreen.model.ts";

test("profile baby image uses normalized week label even when visible copy is post-due", () => {
  const weekLabel = resolveProfileBabyImageWeekLabel({
    homePregnancyWeekLabel: "40주 1일",
    profilePregnancyWeekLabel: "출산 예정일이 지났어요",
    dueDate: "2026-04-03T00:00:00+09:00",
    now: new Date("2026-04-04T09:00:00+09:00"),
  });

  assert.equal(weekLabel, "40주 1일");
});

test("profile modal info cards use the selected record day instead of always reusing today's copy", () => {
  const cards = buildProfileInfoCards({
    today: {
      babyBody: "오늘 아기는요",
      momBody: "오늘 엄마는요",
    },
    recordDay: {
      infoCards: [
        { id: "baby", title: "이 날 아기는요", body: "선택한 날 아기 정보" },
        { id: "mom", title: "이 날 엄마는요", body: "선택한 날 엄마 정보" },
      ],
    },
  });

  assert.deepEqual(cards, [
    { id: "baby", title: "이 날 아기는요", body: "선택한 날 아기 정보" },
    { id: "mom", title: "이 날 엄마는요", body: "선택한 날 엄마 정보" },
  ]);
});

test("profile modal info cards do not fall back to today's copy when a selected record day has no info cards", () => {
  const cards = buildProfileInfoCards({
    today: {
      babyBody: "오늘 아기는요",
      momBody: "오늘 엄마는요",
    },
    recordDay: {
      infoCards: [],
    },
  });

  assert.deepEqual(cards, [
    {
      id: "baby",
      title: "이 날 아기는요",
      body: "이 날짜의 아기 정보를 아직 준비하지 못했어요.",
    },
    {
      id: "mom",
      title: "이 날 엄마는요",
      body: "이 날짜의 엄마 정보를 아직 준비하지 못했어요.",
    },
  ]);
});

test("profile day state derives modal statuses from selected day and injected now", () => {
  const state = buildProfileDayState({
    selectedIsoDate: "2026-04-06",
    selectedDay: {
      isoDate: "2026-04-06",
      dayLabel: "6",
      hasChat: false,
      hasInfo: false,
      emotionTone: null,
    },
    selectedRecordDay: {
      isoDate: "2026-04-06",
      dateLabel: "4월 6일",
      infoViewed: true,
      emotionTone: null,
      checklistItems: [
        { id: "1", label: "물 마시기", completed: true },
        { id: "2", label: "산책", completed: false },
      ],
      conversationSummary: undefined,
      dailyQuestion: null,
      records: [],
      relatedSessions: [{ id: "s1", title: "아기와 대화", preview: "안녕", updatedAtLabel: "방금" }],
    },
    now: new Date("2026-04-06T09:00:00+09:00"),
  });

  assert.equal(state.selectedIsToday, true);
  assert.deepEqual(state.infoStatus, { label: "확인함", tone: "success" });
  assert.deepEqual(state.checklistStatus, { label: "미완", tone: "muted" });
  assert.deepEqual(state.conversationStatus, { label: "했음", tone: "active" });
  assert.equal(state.conversationSummary, "1개의 대화가 있었어요. 다음 날 정리되는 하루 요약이 준비되면 여기에서 함께 보여드릴게요.");
  assert.deepEqual(state.heartShareItems, [
    {
      id: "question",
      question: "하루 질문",
      answer: "이날의 질문 기록을 준비 중이에요.",
      summary: "안녕",
    },
  ]);
});

test("profile day state does not pretend success when record day failed to load", () => {
  const state = buildProfileDayState({
    selectedIsoDate: "2026-04-06",
    selectedDay: {
      isoDate: "2026-04-06",
      dayLabel: "6",
      hasChat: false,
      hasInfo: false,
      emotionTone: null,
    },
    selectedRecordDay: null,
    now: new Date("2026-04-06T09:00:00+09:00"),
    hasRecordDayError: true,
  });

  assert.deepEqual(state.infoStatus, { label: "불러오는 중", tone: "idle" });
  assert.deepEqual(state.checklistStatus, { label: "불러오는 중", tone: "idle" });
  assert.deepEqual(state.conversationStatus, { label: "불러오는 중", tone: "idle" });
  assert.equal(state.conversationSummary, "이 날짜 기록을 다시 불러오는 중이에요.");
  assert.deepEqual(state.heartShareItems, []);
});
