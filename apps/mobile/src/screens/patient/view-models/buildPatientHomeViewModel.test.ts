import assert from "node:assert/strict";
import test from "node:test";
import { buildPatientHomeViewModel } from "./buildPatientHomeViewModel.ts";

test("home view model uses only today's message card", () => {
  const viewModel = buildPatientHomeViewModel({
    home: null,
    profile: {
      userId: "u1",
      displayName: "테스터",
      phoneNumber: "01012345678",
      pregnancyWeekLabel: "20주 1일",
      pregnancyDayCount: 141,
      accountStatus: "active",
      hasCompletedOnboarding: true,
      tonePreference: "차분하게",
    },
    now: new Date("2026-03-30T09:00:00+09:00"),
  });

  assert.ok(viewModel.quote === null || viewModel.quote.length > 0);
  assert.equal(viewModel.noteTitle, "오늘의 한마디");
  assert.ok(viewModel.noteBody.length > 0);
});

test("home view model clamps due-date based label to minimum 1주 for pregnancy day 1", () => {
  const now = new Date("2026-03-30T09:00:00+09:00");
  const dueDate = new Date(
    now.getTime() + 293 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const viewModel = buildPatientHomeViewModel({
    home: null,
    profile: {
      userId: "u2",
      displayName: "테스터2",
      phoneNumber: "01099998888",
      pregnancyWeekLabel: null,
      pregnancyDayCount: null,
      dueDate,
      accountStatus: "active",
      hasCompletedOnboarding: true,
      tonePreference: "차분하게",
    },
    now,
  });

  assert.equal(viewModel.pregnancyDayCount, 1);
  assert.equal(viewModel.pregnancyWeekLabel, "1주 1일");
});
