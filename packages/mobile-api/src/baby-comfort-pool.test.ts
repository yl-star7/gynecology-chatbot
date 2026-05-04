jest.mock("@gynecology-chatbot/db/prisma", () => ({
  prisma: {
    content_baby_comfort_pool: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from "@gynecology-chatbot/db/prisma";
import { pickBabyComfortMessage } from "./baby-comfort-pool";

const findManyMock = prisma.content_baby_comfort_pool.findMany as jest.Mock;

beforeEach(() => {
  findManyMock.mockReset();
});

const BASE_PARAMS = {
  userId: "user-abc",
  week: 12,
  day: 3,
  mood: null,
  fallback: "기본 아기 메시지예요.",
};

const POOL_EQUAL = [
  { text: "메시지 A", weight: 1 },
  { text: "메시지 B", weight: 1 },
  { text: "메시지 C", weight: 1 },
];

describe("pickBabyComfortMessage", () => {
  test("empty pool returns fallback", async () => {
    findManyMock.mockResolvedValue([]);
    const result = await pickBabyComfortMessage(BASE_PARAMS);
    expect(result).toBe(BASE_PARAMS.fallback);
  });

  test("empty pool with null fallback returns null", async () => {
    findManyMock.mockResolvedValue([]);
    const result = await pickBabyComfortMessage({
      ...BASE_PARAMS,
      fallback: null,
    });
    expect(result).toBeNull();
  });

  test("deterministic: same userId + date produces the same pick", async () => {
    findManyMock.mockResolvedValue(POOL_EQUAL);
    const today = new Date("2026-04-24T10:00:00Z");

    const first = await pickBabyComfortMessage({
      ...BASE_PARAMS,
      _today: today,
    });
    const second = await pickBabyComfortMessage({
      ...BASE_PARAMS,
      _today: today,
    });

    expect(first).toBe(second);
    expect(typeof first).toBe("string");
  });

  test("different dates produce at least 2 distinct picks across 5 seeds", async () => {
    findManyMock.mockResolvedValue(POOL_EQUAL);

    const results = new Set<string | null>();
    for (let i = 0; i < 5; i++) {
      const today = new Date(
        `2026-04-${String(20 + i).padStart(2, "0")}T00:00:00Z`,
      );
      const pick = await pickBabyComfortMessage({
        ...BASE_PARAMS,
        _today: today,
      });
      results.add(pick);
    }

    expect(results.size).toBeGreaterThan(1);
  });

  test("different userIds on the same date produce at least 2 distinct picks across 5 users", async () => {
    findManyMock.mockResolvedValue(POOL_EQUAL);
    const today = new Date("2026-04-24T00:00:00Z");

    const results = new Set<string | null>();
    for (let i = 0; i < 5; i++) {
      const pick = await pickBabyComfortMessage({
        ...BASE_PARAMS,
        userId: `user-${i}`,
        _today: today,
      });
      results.add(pick);
    }

    expect(results.size).toBeGreaterThan(1);
  });

  test("weighted: higher-weight item picked more often across many seeds", async () => {
    const pool = [
      { text: "rare", weight: 1 },
      { text: "common", weight: 20 },
    ];
    findManyMock.mockResolvedValue(pool);

    const counts: Record<string, number> = { rare: 0, common: 0 };
    for (let i = 0; i < 100; i++) {
      const today = new Date(2026, 3, 1 + (i % 28));
      today.setUTCHours(0, 0, 0, 0);
      const pick = await pickBabyComfortMessage({
        ...BASE_PARAMS,
        userId: `user-weight-${i}`,
        _today: today,
      });
      if (pick === "rare" || pick === "common") counts[pick]++;
    }

    expect(counts.common).toBeGreaterThan(counts.rare * 3);
  });

  test("single-item pool always returns that item", async () => {
    findManyMock.mockResolvedValue([{ text: "유일한 메시지예요.", weight: 5 }]);
    const today = new Date("2026-04-24T00:00:00Z");

    for (let i = 0; i < 5; i++) {
      const result = await pickBabyComfortMessage({
        ...BASE_PARAMS,
        userId: `u${i}`,
        _today: today,
      });
      expect(result).toBe("유일한 메시지예요.");
    }
  });

  test("passes mood filter to prisma query when mood is provided", async () => {
    findManyMock.mockResolvedValue([
      { text: "기분 맞춤 메시지예요.", weight: 1 },
    ]);
    await pickBabyComfortMessage({ ...BASE_PARAMS, mood: "calm" });

    const callArgs = findManyMock.mock.calls[0][0];
    expect(callArgs.where).toMatchObject({
      AND: [{ OR: [{ tag_mood: null }, { tag_mood: "calm" }] }],
    });
  });

  test("omits mood filter from prisma query when mood is null", async () => {
    findManyMock.mockResolvedValue([{ text: "메시지예요.", weight: 1 }]);
    await pickBabyComfortMessage({ ...BASE_PARAMS, mood: null });

    const callArgs = findManyMock.mock.calls[0][0];
    expect(callArgs.where).not.toHaveProperty("AND");
  });
});
