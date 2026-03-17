import { calculatePregnancyProgress } from './utils';

describe('calculatePregnancyProgress', () => {
    test('오늘이 시작일이면 1주 1일차여야 함', () => {
        const today = new Date().toISOString();
        const result = calculatePregnancyProgress(today);
        expect(result).toEqual({ week: 1, day: 1 });
    });

    test('7일 전이 시작일이면 2주 1일차여야 함', () => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const result = calculatePregnancyProgress(weekAgo.toISOString());
        expect(result).toEqual({ week: 2, day: 1 });
    });

    test('280일 전(40주)이 시작일이면 41주 1일차여야 함 (최대 42주 제한 확인)', () => {
        const fortyWeeksAgo = new Date();
        fortyWeeksAgo.setDate(fortyWeeksAgo.getDate() - 280);
        const result = calculatePregnancyProgress(fortyWeeksAgo.toISOString());
        // 로직상 280/7 + 1 = 41
        expect(result.week).toBe(41);
        expect(result.day).toBe(1);
    });

    test('미래 날짜 입력 시 1주 1일차로 처리되거나 합리적으로 동작해야 함 (현재 로직 유지)', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const result = calculatePregnancyProgress(tomorrow.toISOString());
        expect(result.week).toBe(1);
    });
});
