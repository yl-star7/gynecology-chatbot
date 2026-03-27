import { buildWebPatientTodayViewModel } from "./mobile-patient-view-models";

describe("buildWebPatientTodayViewModel", () => {
  it("returns the three top segments used by the mobile today view", () => {
    const viewModel = buildWebPatientTodayViewModel({
      today: null,
    });

    expect(viewModel.sections).toEqual([
      { id: "info", label: "아기와 엄마" },
      { id: "checklist", label: "체크리스트" },
      { id: "conversation", label: "아기와 대화" },
    ]);
  });
});
