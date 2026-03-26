import { buildWebPatientTodayViewModel } from "./mobile-patient-view-models";

describe("buildWebPatientTodayViewModel", () => {
  it("returns the three top segments used by the mobile today view", () => {
    const viewModel = buildWebPatientTodayViewModel({
      today: null,
    });

    expect(viewModel.sections).toEqual([
      { id: "info", label: "정보" },
      { id: "checklist", label: "체크" },
      { id: "conversation", label: "대화" },
    ]);
  });
});
