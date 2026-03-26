import assert from "node:assert/strict";
import test from "node:test";
import { buildPatientTodayViewModel } from "./buildPatientTodayViewModel.ts";

test("today view model exposes the three top segments used by the screen", () => {
  const viewModel = buildPatientTodayViewModel({
    today: null,
  });

  assert.deepEqual(viewModel.sections, [
    { id: "info", label: "정보" },
    { id: "checklist", label: "체크" },
    { id: "conversation", label: "대화" },
  ]);
});
