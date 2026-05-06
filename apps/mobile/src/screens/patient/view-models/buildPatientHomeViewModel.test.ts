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
  assert.equal(
    viewModel.babyMessage,
    "우리 아기는 지금 20주 1일이에요. 오늘도 엄마와 연결된 시간을 기다리고 있어요.",
  );
  assert.equal(viewModel.noteTitle, "오늘의 한마디");
  assert.ok(viewModel.noteBody.length > 0);
});

test("home view model keeps full pregnancy label in baby bubble", () => {
  const viewModel = buildPatientHomeViewModel({
    home: null,
    profile: {
      userId: "u14",
      displayName: "테스터14",
      phoneNumber: "01014141414",
      babyNickname: "아기",
      pregnancyWeekLabel: "14주 4일",
      pregnancyDayCount: 102,
      accountStatus: "active",
      hasCompletedOnboarding: true,
      tonePreference: "다정하게",
    },
    now: new Date("2026-03-30T09:00:00+09:00"),
  });

  assert.equal(viewModel.pregnancyWeekLabel, "14주 4일");
  assert.equal(viewModel.pregnancyDayText, "임신 102일째");
  assert.equal(
    viewModel.babyMessage,
    "아기는 지금 14주 4일이에요. 오늘도 엄마와 연결된 시간을 기다리고 있어요.",
  );
});

test("home view model clamps due-date based label to minimum 1주 for pregnancy day 1", () => {
  const now = new Date("2026-03-30T09:00:00+09:00");
  const dueDate = new Date(
    now.getTime() + 279 * 24 * 60 * 60 * 1000,
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

test("home view model keeps image week label even when post due copy is shown", () => {
  const now = new Date("2026-04-04T09:00:00+09:00");
  const dueDate = new Date("2026-04-03T00:00:00+09:00").toISOString();

  const viewModel = buildPatientHomeViewModel({
    home: {
      userId: "u3",
      displayName: "테스터3",
      pregnancyWeekLabel: "40주 1일",
      pregnancyDayCount: 281,
      currentMonthLabel: "2026년 4월",
      calendarDays: [],
      babyNickname: null,
      babyMessage: null,
      supportMessage: null,
      postDue: true,
    },
    profile: {
      userId: "u3",
      displayName: "테스터3",
      phoneNumber: "01011112222",
      pregnancyWeekLabel: "40주 1일",
      pregnancyDayCount: 281,
      dueDate,
      accountStatus: "active",
      hasCompletedOnboarding: true,
      tonePreference: "다정하게",
    },
    now,
  });

  assert.equal(viewModel.pregnancyWeekLabel, "출산 예정일이 지났어요");
  assert.equal(viewModel.imageWeekLabel, "40주 1일");
  assert.equal(viewModel.pregnancyDayText, "임신 280일째");
});
