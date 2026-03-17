/**
 * 임신 주차 및 일차 계산 로직
 * @param startDate 임신 시작일 (ISO string)
 * @returns { week: number, day: number }
 */
export function calculatePregnancyProgress(startDate: string): { week: number; day: number } {
    if (!startDate) return { week: 1, day: 1 };

    const start = new Date(startDate);
    const now = new Date();

    // 정확한 일수 계산을 위해 자정으로 설정
    start.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffTime = now.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // 임신 40주(280일)를 기준으로 1주 1일~40주 0일 등으로 표시
    // week: 0~6일 -> 1주, 7~13일 -> 2주...
    const week = Math.max(1, Math.floor(diffDays / 7) + 1);
    // day: 0일째 -> 1일차, 6일째 -> 7일차
    const day = (Math.abs(diffDays) % 7) + 1;

    return { week: Math.min(week, 42), day };
}
