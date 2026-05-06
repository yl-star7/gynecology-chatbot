/**
 * 사전(RAG) 파일명 기반 태그 파서.
 *
 * 모든 필터링은 클라이언트에서 수행합니다. Schift metadata는 신뢰할 수 없기
 * 때문에, ingest 단계에서 정한 파일명 컨벤션을 다시 추출해 주차/표면을 결정합니다.
 *
 * 원본 구현은 `packages/mobile-api/src/rag.ts`에 있으며, 이 파일은 admin 측에서
 * 동일 규칙을 그대로 적용하기 위한 복사본입니다. 어느 한쪽을 수정하면 양쪽을
 * 함께 갱신해야 합니다.
 */

export type LexiconSurface = "week_overview" | "week_day" | "rag" | "archive";

/** 파일명에서 임신 주차(1~42)를 추출합니다. 일치하는 패턴이 없으면 null. */
export function parseWeekFromFilename(
  name: string | undefined | null,
): number | null {
  if (!name) return null;

  // 우리 ingest 패턴들:
  //   week-18-overview.txt / week-18-day-3.txt    → group 1
  //   18주차.docx / 18주차_anything.docx           → group 2
  //   임신_18주_...                                → group 3
  // 한국어 문자 다음의 `\b`는 JS에서 word boundary로 인식되지 않으므로
  // (`차` 와 `.` 모두 `\W`) `주차`/`주` 뒤는 명시적으로 non-digit lookahead 사용.
  const match = name.match(
    /(?:^|[\/_-])week[-_](\d{1,2})(?!\d)|^(\d{1,2})주차(?!\d)|임신[_\s]?(\d{1,2})주(?!\d)/i,
  );
  if (!match) return null;

  const raw = match[1] ?? match[2] ?? match[3];
  const week = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(week) && week >= 1 && week <= 42 ? week : null;
}

/** 파일명에서 surface 분류를 추출합니다. 일치하는 패턴이 없으면 null. */
export function parseSurfaceFromFilename(
  name: string | undefined | null,
): LexiconSurface | null {
  if (!name) return null;
  if (/^week-\d+-overview\.txt$/i.test(name)) return "week_overview";
  if (/^week-\d+-day-\d+\.txt$/i.test(name)) return "week_day";
  if (/임신_주수별_발달정보\.docx$/i.test(name)) return "archive";
  if (/\.docx$/i.test(name)) return "rag";
  return null;
}

/** 사용자에게 보일 surface 한글 라벨. */
export function surfaceLabel(surface: LexiconSurface | null): string {
  switch (surface) {
    case "week_overview":
      return "주차 개요";
    case "week_day":
      return "주차 일자";
    case "rag":
      return "일반 RAG";
    case "archive":
      return "아카이브";
    default:
      return "분류 없음";
  }
}
