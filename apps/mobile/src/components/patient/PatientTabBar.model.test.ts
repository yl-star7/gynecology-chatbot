import assert from "node:assert/strict";
import test from "node:test";
import {
  PATIENT_TABS,
  openPatientTab,
} from "./PatientTabBar.model.ts";

test("today tab opens the today route instead of pushing directly into a chat screen", () => {
  const todayTab = PATIENT_TABS.find((tab) => tab.key === "today");

  assert.equal(todayTab?.href, "/(tabs)/today");
});

test("openPatientTab navigates between tabs without dismissing the current stack", () => {
  const calls: { method: string; href: string }[] = [];

  openPatientTab(
    {
      navigate(href) {
        calls.push({ method: "navigate", href });
      },
    },
    "/(tabs)/home",
  );

  assert.deepEqual(calls, [{ method: "navigate", href: "/(tabs)/home" }]);
});
