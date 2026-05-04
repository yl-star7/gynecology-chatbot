import { createHash } from "crypto";
import { prisma } from "@gynecology-chatbot/db/prisma";

type ComfortRow = {
  text: string;
  weight: number;
};

/**
 * Deterministic hash of an arbitrary string to a 32-bit unsigned integer.
 * Uses SHA-256 and reads the first 4 bytes.
 */
function hashString(input: string): number {
  const buf = createHash("sha256").update(input).digest();
  return ((buf[0]! << 24) | (buf[1]! << 16) | (buf[2]! << 8) | buf[3]!) >>> 0;
}

/**
 * Mulberry32 — fast deterministic pseudo-random number generator.
 * Returns a function that yields floats in [0, 1).
 */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000;
  };
}

/**
 * Weighted random pick from a non-empty array using a seeded RNG.
 * Items with higher `weight` are proportionally more likely to be chosen.
 */
function weightedPick(rows: ComfortRow[], rng: () => number): string {
  const totalWeight = rows.reduce((sum, r) => sum + Math.max(1, r.weight), 0);
  let pick = rng() * totalWeight;
  for (const row of rows) {
    pick -= Math.max(1, row.weight);
    if (pick < 0) return row.text;
  }
  return rows[rows.length - 1]!.text;
}

/**
 * Converts a JS Date (or "now") to a UTC ISO date string (YYYY-MM-DD).
 */
function utcDateKey(date?: Date): string {
  const d = date ?? new Date();
  return d.toISOString().slice(0, 10);
}

export async function pickBabyComfortMessage(params: {
  userId: string;
  week: number;
  day: number;
  mood?: string | null;
  fallback: string | null;
  /** Override today's date (useful in tests) */
  _today?: Date;
}): Promise<string | null> {
  const { userId, week, mood, fallback, _today } = params;

  const whereClause = mood
    ? {
        active: true,
        OR: [{ tag_week: null as number | null }, { tag_week: week }],
        AND: [
          { OR: [{ tag_mood: null as string | null }, { tag_mood: mood }] },
        ],
      }
    : {
        active: true,
        OR: [{ tag_week: null as number | null }, { tag_week: week }],
      };

  const rows = await prisma.content_baby_comfort_pool.findMany({
    where: whereClause,
    select: { text: true, weight: true },
  });

  if (rows.length === 0) {
    return fallback;
  }

  const isoDate = utcDateKey(_today);
  const seed = hashString(`${userId}|${isoDate}`);
  const rng = mulberry32(seed);

  return weightedPick(rows as ComfortRow[], rng);
}
