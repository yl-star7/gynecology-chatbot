import assert from "node:assert/strict";
import test from "node:test";
import { buildPatientTodayViewModel } from "./buildPatientTodayViewModel.ts";

test("today view model exposes the three top segments used by the screen", () => {
  const viewModel = buildPatientTodayViewModel({
    today: null,
  });

  assert.deepEqual(viewModel.sections, [
    { id: "info", label: "아기와 엄마" },
    { id: "checklist", label: "체크리스트" },
    { id: "conversation", label: "아기와 대화" },
  ]);
});
