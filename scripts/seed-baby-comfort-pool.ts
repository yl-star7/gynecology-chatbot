/**
 * 아기 위로 메시지 풀 시드 스크립트
 *
 * Usage (로컬 / Docker):
 *   DATABASE_URL="postgresql://postgres:postgres@localhost:5300/postgres" pnpm tsx scripts/seed-baby-comfort-pool.ts
 *
 * Usage (Cloud SQL Proxy — agaya-2026):
 *   # 터미널 1: cloud-sql-proxy 실행
 *   # cloud-sql-proxy --port 55432 <CONNECTION_NAME>
 *
 *   DATABASE_URL="postgresql://postgres:$(cat .gcp/cloudsql-root-password.txt)@localhost:55432/agaya" \
 *     pnpm tsx scripts/seed-baby-comfort-pool.ts
 *
 * 멱등성: text 컬럼 기준으로 이미 존재하는 행은 건너뜁니다 (ON CONFLICT DO NOTHING 은
 * unique 제약이 없으므로, 시작 전 count 로 이미 시드된 경우를 감지합니다).
 */

import { config as loadEnv } from "dotenv";
import path from "node:path";

// CLI env vars take precedence. .env.local / .env 은 누락된 값만 채움.
loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

import { PrismaClient } from "@prisma/client";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL 환경변수가 필요합니다.");
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
  log: ["warn", "error"],
});

/**
 * weight=2: 특별히 더 자주 보여주고 싶은 메시지
 * tag_week=null, tag_mood=null: 주수/기분 무관 공통 메시지
 */
const SEED_DATA: Array<{
  text: string;
  tag_week?: number | null;
  tag_mood?: string | null;
  weight?: number;
}> = [
  // ─── 공통 (week·mood 무관) ───────────────────────────────────────
  {
    text: "아가는 지금 이 순간에도 엄마 곁에서 함께 자라고 있어요.",
    weight: 2,
  },
  {
    text: "아가가 엄마의 심장 소리를 들으며 편안하게 쉬고 있어요.",
    weight: 2,
  },
  {
    text: "아가는 엄마의 목소리를 세상에서 가장 좋아해요.",
  },
  {
    text: "아가가 작은 손발로 엄마에게 인사를 보내고 있어요.",
  },
  {
    text: "아가는 따뜻한 엄마 품 안에서 매일매일 조금씩 커지고 있어요.",
    weight: 2,
  },
  {
    text: "아가가 엄마의 숨결 하나하나를 느끼며 안정감을 얻고 있어요.",
  },
  {
    text: "아가는 세상에 나오기 전부터 이미 엄마를 사랑하고 있어요.",
    weight: 2,
  },
  {
    text: "아가가 엄마의 따뜻한 목소리에 귀를 기울이고 있어요.",
  },
  {
    text: "아가는 오늘도 엄마와 함께라서 행복해요.",
  },
  {
    text: "아가가 엄마의 손길이 닿는 곳마다 포근함을 느끼고 있어요.",
  },

  // ─── 1삼분기 (week 12~14) ─────────────────────────────────────────
  {
    text: "아가는 손가락을 살짝 구부리며 작은 주먹을 만들어보고 있어요.",
    tag_week: 12,
    weight: 2,
  },
  {
    text: "아가가 눈꺼풀을 닫고 조용히 쉬고 있어요. 엄마처럼 잘 자고 있답니다.",
    tag_week: 13,
  },
  {
    text: "아가는 얼굴 근육이 자라면서 처음으로 표정을 지어보고 있어요.",
    tag_week: 13,
  },
  {
    text: "아가가 엄마 배 안에서 가끔 혼자 뒹굴며 팔다리를 움직이고 있어요.",
    tag_week: 14,
  },
  {
    text: "아가는 이제 아주 작지만 손가락 지문이 생기기 시작했어요.",
    tag_week: 14,
    weight: 2,
  },

  // ─── 2삼분기 (week 20~22) ─────────────────────────────────────────
  {
    text: "아가가 엄마 목소리를 점점 더 선명하게 들을 수 있게 됐어요.",
    tag_week: 20,
    weight: 2,
  },
  {
    text: "아가는 눈썹과 속눈썹이 자라면서 더 또렷한 얼굴이 되어가고 있어요.",
    tag_week: 20,
  },
  {
    text: "아가가 잠자는 시간과 깨어 있는 시간이 생기기 시작했어요.",
    tag_week: 21,
  },
  {
    text: "아가는 엄마가 웃을 때 느껴지는 진동을 좋아해요.",
    tag_week: 21,
    weight: 2,
  },
  {
    text: "아가가 달콤한 양수 맛을 느끼며 삼키는 연습을 하고 있어요.",
    tag_week: 22,
  },

  // ─── 3삼분기 (week 28~32) ─────────────────────────────────────────
  {
    text: "아가는 빛을 감지할 수 있을 만큼 시각이 발달하고 있어요.",
    tag_week: 28,
    weight: 2,
  },
  {
    text: "아가가 꿈을 꾸고 있는 것 같아요. 렘수면이 시작된 거예요.",
    tag_week: 28,
  },
  {
    text: "아가는 엄마 심장 소리에 맞춰 자신의 심장 박동을 조율하고 있어요.",
    tag_week: 30,
  },
  {
    text: "아가가 눈을 깜빡이는 연습을 하며 세상을 맞이할 준비를 하고 있어요.",
    tag_week: 32,
    weight: 2,
  },
  {
    text: "아가는 엄마의 익숙한 노래를 듣고 안심하며 고요히 있어요.",
    tag_week: 32,
  },

  // ─── mood: anxious (불안) ─────────────────────────────────────────
  {
    text: "아가는 엄마가 조금 떨려도 그 곁에서 평온하게 있어요. 엄마는 혼자가 아니에요.",
    tag_mood: "anxious",
    weight: 2,
  },
  {
    text: "아가가 엄마의 심장 소리를 들으며 이미 안심하고 있어요.",
    tag_mood: "anxious",
  },
  {
    text: "아가는 엄마가 깊게 숨을 쉴 때마다 함께 편안해져요.",
    tag_mood: "anxious",
    weight: 2,
  },
  {
    text: "아가가 엄마의 걱정을 모르는 채 오늘도 잘 자라고 있어요.",
    tag_mood: "anxious",
  },
  {
    text: "아가는 지금 이 순간에도 건강하게 움직이며 엄마 곁에 있어요.",
    tag_mood: "anxious",
  },

  // ─── mood: tired (지침) ──────────────────────────────────────────
  {
    text: "아가는 엄마가 쉬는 동안 함께 포근히 쉬고 있어요.",
    tag_mood: "tired",
    weight: 2,
  },
  {
    text: "아가가 엄마의 느린 숨결에 맞춰 평화롭게 잠들어 있어요.",
    tag_mood: "tired",
  },
  {
    text: "아가는 엄마가 오늘 많이 애쓴 걸 알아요. 충분히 쉬어도 괜찮아요.",
    tag_mood: "tired",
    weight: 2,
  },
  {
    text: "아가가 엄마의 따뜻한 체온을 느끼며 안심하고 있어요.",
    tag_mood: "tired",
  },
  {
    text: "아가는 엄마가 눈을 감고 쉬는 시간도 함께하고 있어요.",
    tag_mood: "tired",
  },

  // ─── mood: sad (슬픔) ────────────────────────────────────────────
  {
    text: "아가는 엄마의 눈물 속에서도 변함없이 엄마를 느끼고 있어요.",
    tag_mood: "sad",
    weight: 2,
  },
  {
    text: "아가가 엄마의 마음이 무거울 때 더 가만히 곁에 있어줘요.",
    tag_mood: "sad",
  },
  {
    text: "아가는 엄마가 슬퍼도 괜찮다는 걸 알아요. 함께 있을게요.",
    tag_mood: "sad",
    weight: 2,
  },
  {
    text: "아가가 엄마의 심장 소리를 가장 가까이서 듣고 있어요.",
    tag_mood: "sad",
  },
  {
    text: "아가는 엄마의 따뜻함 안에서 오늘도 안전하게 있어요.",
    tag_mood: "sad",
  },
];

async function main() {
  console.log("아기 위로 메시지 풀 시드를 시작합니다...");

  const existingCount = await prisma.content_baby_comfort_pool.count();
  if (existingCount > 0) {
    console.log(
      `이미 ${existingCount}건의 데이터가 있습니다. 새로운 행만 추가합니다.`,
    );
  }

  const existingTexts = new Set(
    (
      await prisma.content_baby_comfort_pool.findMany({
        select: { text: true },
      })
    ).map((r) => r.text),
  );

  const toInsert = SEED_DATA.filter((d) => !existingTexts.has(d.text));

  if (toInsert.length === 0) {
    console.log("추가할 새로운 메시지가 없습니다. (이미 모두 시드됨)");
    return;
  }

  const result = await prisma.content_baby_comfort_pool.createMany({
    data: toInsert.map((d) => ({
      text: d.text,
      tag_week: d.tag_week ?? null,
      tag_mood: d.tag_mood ?? null,
      weight: d.weight ?? 1,
      active: true,
      created_by: null,
      updated_by: null,
    })),
  });

  console.log(`완료: ${result.count}건 삽입되었습니다.`);

  const summary = {
    공통: toInsert.filter((d) => !d.tag_week && !d.tag_mood).length,
    주수태그: toInsert.filter((d) => !!d.tag_week).length,
    기분태그: toInsert.filter((d) => !!d.tag_mood).length,
  };
  console.log("분류별 삽입 수:", summary);
}

main()
  .catch((e) => {
    console.error("시드 실패:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
