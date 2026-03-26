import assert from "node:assert/strict";
import test from "node:test";
import {
  PATIENT_TABS,
  openPatientTab,
} from "./PatientTabBar.model.ts";

test("today tab opens the today route instead of pushing directly into a chat screen", () => {
  const todayTab = PATIENT_TABS.find((tab) => tab.key === "today");

  assert.equal(todayTab?.href, "/today");
});

test("openPatientTab dismisses to an existing route so reverse navigation keeps the back direction", () => {
  const calls: { method: string; href: string }[] = [];

  openPatientTab(
    {
      dismissTo(href) {
        calls.push({ method: "dismissTo", href });
      },
    },
    "/home",
  );

  assert.deepEqual(calls, [{ method: "dismissTo", href: "/home" }]);
});
