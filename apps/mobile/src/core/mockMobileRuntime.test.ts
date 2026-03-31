import assert from "node:assert/strict";
import test from "node:test";
import {
  clearMockMobileCurrentUser,
  completeMockOnboarding,
  readMockMobileProfile,
} from "./mockMobileRuntime.ts";

function addDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

test("completeMockOnboarding stores babyNickname and treats date input as dueDate", () => {
  clearMockMobileCurrentUser();
  const dueDate = addDaysIso(120);

  completeMockOnboarding({
    pregnancyWeekOrDueDate: `${dueDate}T12:00:00.000Z`,
    tonePreference: "친근하게",
    babyNickname: "  콩이  ",
  });

  const profile = readMockMobileProfile();
  assert.equal(profile.babyNickname, "콩이");
  assert.equal(profile.dueDate, dueDate);

  const pregnancyWeek = Number(
    profile.pregnancyWeekLabel.match(/^(\d+)/)?.[1] ?? "0",
  );
  assert.ok(
    pregnancyWeek >= 1 && pregnancyWeek <= 42,
    `pregnancyWeekLabel should be realistic, got: ${profile.pregnancyWeekLabel}`,
  );
});
