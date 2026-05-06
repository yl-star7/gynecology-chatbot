import { computeWorkflowDrift } from "./workflow-drift";

describe("computeWorkflowDrift", () => {
  const baseInput = {
    yamlSha: "abcdef1234567890",
    dbVersion: "abcdef1234567890",
    schiftStatus: "active",
    schiftAvailable: true,
  };

  it("returns drift=false and no reasons when all three layers align", () => {
    const result = computeWorkflowDrift(baseInput);
    expect(result.drift).toBe(false);
    expect(result.reasons).toEqual([]);
  });

  it("flags drift when YAML SHA differs from DB version", () => {
    const result = computeWorkflowDrift({
      ...baseInput,
      yamlSha: "aaaaaaaa11111111",
      dbVersion: "bbbbbbbb22222222",
    });

    expect(result.drift).toBe(true);
    expect(result.reasons).toHaveLength(1);
    expect(result.reasons[0]).toContain("일치하지 않습니다");
  });

  it("reports missing YAML SHA as a reason", () => {
    const result = computeWorkflowDrift({
      ...baseInput,
      yamlSha: null,
    });

    expect(result.drift).toBe(true);
    expect(result.reasons).toContain("YAML 소스 SHA 를 읽을 수 없습니다.");
  });

  it("reports missing DB version as a reason", () => {
    const result = computeWorkflowDrift({
      ...baseInput,
      dbVersion: null,
    });

    expect(result.drift).toBe(true);
    expect(result.reasons).toContain(
      "workflow_definitions 에 최신 버전이 없습니다.",
    );
  });

  it("reports Schift unavailable as a reason and skips SHA comparison", () => {
    const result = computeWorkflowDrift({
      yamlSha: "aaaaaaaa11111111",
      dbVersion: "bbbbbbbb22222222",
      schiftStatus: null,
      schiftAvailable: false,
    });

    expect(result.drift).toBe(true);
    // Schift 런타임 확인 불가 이유가 있어야 합니다.
    expect(result.reasons).toContain(
      "Schift 런타임 상태를 확인할 수 없습니다.",
    );
    // Schift 가 unavailable 이면 yaml/db 비교는 수행하지 않아야 합니다.
    expect(
      result.reasons.some((reason) => reason.includes("일치하지 않습니다")),
    ).toBe(false);
  });

  it("reports Schift runtime missing workflow when available but status null", () => {
    const result = computeWorkflowDrift({
      yamlSha: "abcdef1234567890",
      dbVersion: "abcdef1234567890",
      schiftStatus: null,
      schiftAvailable: true,
    });

    expect(result.drift).toBe(true);
    expect(result.reasons).toContain(
      "Schift 런타임에 등록된 워크플로우가 없습니다.",
    );
  });
});
