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

  assert.equal(viewModel.quote, null);
  assert.equal(viewModel.noteTitle, "오늘의 한마디");
  assert.ok(viewModel.noteBody.length > 0);
});
