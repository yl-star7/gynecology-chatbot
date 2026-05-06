/** 현재 시각 기준 상대 시간 레이블 (한국어). 1분 단위 반올림. */
export function formatRelativeTime(
  isoOrLabel: string | null | undefined,
  now: Date = new Date(),
): string {
  if (!isoOrLabel) return "-";
  const date = new Date(isoOrLabel);
  if (Number.isNaN(date.getTime())) {
    // ISO 가 아니면 입력을 그대로 노출 (이미 서버에서 포맷된 문자열일 수 있음).
    return isoOrLabel;
  }
  const diffSec = Math.max(
    0,
    Math.round((now.getTime() - date.getTime()) / 1000),
  );
  if (diffSec < 60) return "방금 전";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  const diffWeek = Math.round(diffDay / 7);
  if (diffWeek < 5) return `${diffWeek}주 전`;
  const diffMonth = Math.round(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}개월 전`;
  const diffYear = Math.round(diffDay / 365);
  return `${diffYear}년 전`;
}
