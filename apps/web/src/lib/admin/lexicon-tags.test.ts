import {
  parseSurfaceFromFilename,
  parseWeekFromFilename,
  surfaceLabel,
} from "./lexicon-tags";

describe("parseWeekFromFilename", () => {
  it("week-NN-overview.txt 패턴을 인식합니다", () => {
    expect(parseWeekFromFilename("week-18-overview.txt")).toBe(18);
  });

  it("week-NN-day-N.txt 패턴을 인식합니다", () => {
    expect(parseWeekFromFilename("week-18-day-3.txt")).toBe(18);
  });

  it("NN주차.docx 패턴을 인식합니다", () => {
    expect(parseWeekFromFilename("18주차.docx")).toBe(18);
  });

  it("NN주차_안내.docx 같은 prefix 패턴도 인식합니다", () => {
    expect(parseWeekFromFilename("20주차_anything.docx")).toBe(20);
  });

  it("임신_NN주_... 패턴을 인식합니다", () => {
    expect(parseWeekFromFilename("임신_18주_발달정보.docx")).toBe(18);
  });

  it("아카이브 파일명에는 주차가 없으므로 null", () => {
    expect(parseWeekFromFilename("임신_주수별_발달정보.docx")).toBeNull();
  });

  it("매칭되지 않는 임의 파일명은 null", () => {
    expect(parseWeekFromFilename("random-document.pdf")).toBeNull();
  });

  it("week 0 같은 범위 밖 값은 null로 거릅니다", () => {
    expect(parseWeekFromFilename("week-0-overview.txt")).toBeNull();
  });

  it("week 99 같은 범위 밖 값은 null로 거릅니다", () => {
    expect(parseWeekFromFilename("week-99-overview.txt")).toBeNull();
  });

  it("undefined/empty 입력은 null", () => {
    expect(parseWeekFromFilename(undefined)).toBeNull();
    expect(parseWeekFromFilename(null)).toBeNull();
    expect(parseWeekFromFilename("")).toBeNull();
  });
});

describe("parseSurfaceFromFilename", () => {
  it("week-NN-overview.txt → week_overview", () => {
    expect(parseSurfaceFromFilename("week-18-overview.txt")).toBe(
      "week_overview",
    );
  });

  it("week-NN-day-N.txt → week_day", () => {
    expect(parseSurfaceFromFilename("week-18-day-3.txt")).toBe("week_day");
  });

  it("임신_주수별_발달정보.docx → archive", () => {
    expect(parseSurfaceFromFilename("임신_주수별_발달정보.docx")).toBe(
      "archive",
    );
  });

  it("일반 .docx → rag", () => {
    expect(parseSurfaceFromFilename("18주차.docx")).toBe("rag");
  });

  it("매칭되지 않는 확장자는 null", () => {
    expect(parseSurfaceFromFilename("notes.pdf")).toBeNull();
  });

  it("undefined/empty 입력은 null", () => {
    expect(parseSurfaceFromFilename(undefined)).toBeNull();
    expect(parseSurfaceFromFilename(null)).toBeNull();
    expect(parseSurfaceFromFilename("")).toBeNull();
  });
});

describe("surfaceLabel", () => {
  it("각 surface에 대한 한글 라벨을 반환합니다", () => {
    expect(surfaceLabel("week_overview")).toBe("주차 개요");
    expect(surfaceLabel("week_day")).toBe("주차 일자");
    expect(surfaceLabel("rag")).toBe("일반 RAG");
    expect(surfaceLabel("archive")).toBe("아카이브");
    expect(surfaceLabel(null)).toBe("분류 없음");
  });
});
