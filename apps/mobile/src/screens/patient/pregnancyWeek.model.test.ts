import assert from "node:assert/strict";
import test from "node:test";
import {
  createPregnancyWeekState,
  getPregnancyWeekImageLabel,
  getPregnancyWeekDisplayLabel,
} from "./pregnancyWeek.model.ts";

test("pregnancy week state keeps image label while showing post-due copy", () => {
  const state = createPregnancyWeekState({
    homePregnancyWeekLabel: "40주 1일",
    profilePregnancyWeekLabel: "40주 1일",
    dueDate: "2026-04-03T00:00:00+09:00",
    now: new Date("2026-04-04T09:00:00+09:00"),
  });

  assert.equal(getPregnancyWeekDisplayLabel(state), "출산 예정일이 지났어요");
  assert.equal(getPregnancyWeekImageLabel(state), "40주 1일");
});

test("pregnancy week state computes a typed week label from due date when raw labels are missing", () => {
  const state = createPregnancyWeekState({
    homePregnancyWeekLabel: null,
    profilePregnancyWeekLabel: null,
    dueDate: "2026-08-01T00:00:00+09:00",
    now: new Date("2026-03-30T09:00:00+09:00"),
  });

  assert.equal(state.kind, "week");
  if (state.kind !== "week") {
    throw new Error("expected a week state");
  }
  assert.equal(state.week, 22);
  assert.equal(state.day, 2);
  assert.equal(getPregnancyWeekDisplayLabel(state), "22주 2일");
  assert.equal(getPregnancyWeekImageLabel(state), "22주 2일");
});

test("pregnancy week state rejects malformed visible labels instead of treating them as image labels", () => {
  const state = createPregnancyWeekState({
    homePregnancyWeekLabel: "출산 예정일이 지났어요",
    profilePregnancyWeekLabel: "주차 정보를 준비 중이에요",
    dueDate: null,
    now: new Date("2026-03-30T09:00:00+09:00"),
  });

  assert.equal(state.kind, "unknown");
  assert.equal(getPregnancyWeekDisplayLabel(state), "주차 정보를 준비 중이에요");
  assert.equal(getPregnancyWeekImageLabel(state), null);
});

test("pregnancy week state clamps computed image week to supported range without losing typed week", () => {
  const state = createPregnancyWeekState({
    homePregnancyWeekLabel: "42주 0일",
    profilePregnancyWeekLabel: null,
    dueDate: null,
    now: new Date("2026-03-30T09:00:00+09:00"),
  });

  assert.equal(state.kind, "week");
  if (state.kind !== "week") {
    throw new Error("expected a week state");
  }
  assert.equal(state.week, 42);
  assert.equal(getPregnancyWeekImageLabel(state), "40주 0일");
  assert.equal(getPregnancyWeekDisplayLabel(state), "42주 0일");
});
