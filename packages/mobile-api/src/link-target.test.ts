import {
  buildPregnancyDocumentLinkContent,
  isUuidEntityId,
} from "./link-target";

describe("link target fallback helpers", () => {
  it("keeps synthetic week entity ids away from UUID lookups", () => {
    expect(isUuidEntityId("week-25")).toBe(false);
    expect(isUuidEntityId("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("maps pregnancy documents into mobile link content", () => {
    expect(
      buildPregnancyDocumentLinkContent({
        title: null,
        content: "아기와 엄마에게 필요한 내용을 읽어봐요.",
        category: "warning-signs",
        pregnancy_week: 25,
      }),
    ).toEqual({
      title: "임신 정보",
      section: "25주 정보",
      body: "아기와 엄마에게 필요한 내용을 읽어봐요.",
    });
  });
});
