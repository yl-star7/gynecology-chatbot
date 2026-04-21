import "dotenv/config";
import { config as loadEnv } from "dotenv";
import path from "node:path";
loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: true });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

import { searchFileRag } from "@gynecology-chatbot/mobile-api/rag";

const queries = [
  { q: "임신 27주차 손발 부종 정상", week: 27 },
  { q: "임신 27주차 태동 횟수 기준", week: 27 },
  { q: "임신 14주차 입덧", week: 14 },
];

async function main() {
  for (const { q, week } of queries) {
    const t0 = performance.now();
    const res = await searchFileRag({
      query: q,
      currentWeek: week,
      matchCount: 5,
    });
    const ms = Math.round(performance.now() - t0);
    const n = Array.isArray(res) ? res.length : res ? 1 : 0;
    const preview = JSON.stringify(res).slice(0, 140);
    console.log(
      `${String(ms).padStart(6)}ms  hits=${n}  q="${q}" week=${week}`,
    );
    console.log(`        ${preview}${preview.length >= 140 ? "..." : ""}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
