/**
 * 오늘의 한마디 홈 카피 시드
 *
 * Usage:
 *   direnv exec /Users/jskang/Projects/si pnpm tsx scripts/seed-home-daily-notes.ts
 *
 * 대상(variant)은 null로 저장한다. 앱은 특정 말투 매칭이 없으면 대상 없는
 * daily_note를 공통 후보로 사용한다.
 */

import { config as loadEnv } from "dotenv";
import path from "node:path";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

import { PrismaClient, type Prisma } from "@prisma/client";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL 환경변수가 필요합니다.");
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
  log: ["warn", "error"],
});

type HomeCopyItem = {
  id: string;
  slot: "hero_bubble" | "daily_note" | "encouragement_quote";
  variant: string | null;
  title: string;
  body: string;
  status: "draft" | "published" | "archived";
  displayOrder: number;
  updatedAt: string;
};

const HOME_COPY_CONFIG_KEY = "home_main_copy";
const UPDATED_AT = "2026-05-13T00:00:00.000Z";
const DEFAULT_RETAINED_HOME_COPY_ITEMS: HomeCopyItem[] = [
  {
    id: "default-hero-bubble-known",
    slot: "hero_bubble",
    variant: "default",
    title: "아기 말풍선",
    body: "{babyName}는 지금 {pregnancyWeekLabel}에 머물고 있어요. 오늘도 엄마와 연결된 시간을 기다리고 있어요.",
    status: "published",
    displayOrder: 1,
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "default-hero-bubble-unknown",
    slot: "hero_bubble",
    variant: "unknown",
    title: "아기 말풍선 - 주차 정보 없음",
    body: "엄마, 오늘도 저를 생각해주셔서 감사해요. 천천히 숨 쉬면서 함께 하루를 보내요.",
    status: "published",
    displayOrder: 2,
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const DAILY_NOTE_BODIES = [
  "지금 이 순간, 깊게 숨을 들이쉬고 내쉬어 보세요. 오늘 하루도 잘 해내고 있어요.",
  "천천히 눈을 감고 배 위에 손을 올려보세요. 아기가 그 온기를 느끼고 있을 거예요.",
  "지금 이 고요한 순간도, 아기와 함께하는 소중한 시간이에요.",
  "숨을 고르며 잠깐 멈춰도 괜찮아요. 쉬어가는 것도 엄마의 역할이에요.",
  "오늘 하루, 아기와 나누었던 작은 순간들을 떠올려보세요. 그 모든 것이 사랑이에요.",
  "아기는 지금 이 순간도 엄마의 심장 소리를 들으며 편안함을 느끼고 있어요.",
  "배를 살며시 쓰다듬어 주세요. 그 손길 하나하나가 아기에게 닿고 있답니다.",
  "엄마의 목소리는 아기에게 세상에서 가장 따뜻한 자장가예요.",
  "오늘 아기에게 말을 걸어주셨나요? 그 작은 대화가 애착의 씨앗이 됩니다.",
  "아기는 엄마의 감정을 함께 느껴요. 오늘 행복한 감정을 가득 나눠주세요.",
  "엄마가 웃으면 아기도 행복해진답니다. 오늘 하루 한 번만 더 미소 지어봐요.",
  '태동을 느낄 때마다 아기가 "엄마, 나 여기 있어요"라고 인사하는 거예요.',
  "아기는 이미 엄마를 알아보고 있어요. 세상에서 가장 먼저 사랑받는 사람이 바로 엄마예요.",
  "오늘 느낀 태동, 잊지 말고 기억해두세요. 훗날 아기에게 들려줄 첫 번째 이야기가 될 거예요.",
  "매일 조금씩 커가는 배처럼, 엄마와 아기의 사랑도 매일 자라고 있어요.",
  "오늘도 수고 많았어요. 아기도 엄마 옆에서 편안하게 하루를 보내고 있을 거예요.",
  "힘든 하루였더라도, 아기 곁에 있어 주는 것만으로도 충분히 훌륭한 엄마예요.",
  "몸이 무겁고 피곤해도 하루를 버텨낸 당신, 정말 대단해요.",
  "완벽하지 않아도 괜찮아요. 지금 이 순간 최선을 다하고 있는 걸 아기도 알아요.",
  "오늘 밥 한 끼 챙겨 드셨나요? 엄마가 건강해야 아기도 건강하답니다.",
  "어제보다 오늘, 오늘보다 내일 조금씩 더 단단해지고 있어요.",
  "지치고 흔들리는 날도 있어요. 그래도 여기까지 온 당신은 충분히 잘하고 있어요.",
  "임신은 아름답지만 쉽지 않아요. 그 무게를 묵묵히 견디는 당신이 존경스러워요.",
  "힘들 땐 도움을 요청해도 괜찮아요. 강한 엄마는 혼자 다 하는 엄마가 아니에요.",
  "오늘 하루도 아기를 위해 애써주셔서 고마워요.",
  "오늘 하루도 잘 마무리했어요. 이제 아기와 함께 편안하게 쉬어요.",
  '잠들기 전, 배 위에 손을 얹고 아기에게 "잘 자"라고 속삭여 주세요.',
  "좋은 꿈 꾸세요. 아기도 엄마 꿈속에서 방긋 웃고 있을 거예요.",
  "하루를 보내며 느꼈던 감사한 것 한 가지를 떠올려보세요. 그 마음이 아기에게도 전해진답니다.",
  "오늘 밤도 아기와 함께 따뜻하게 보내세요.",
  "좋은 아침이에요! 오늘도 아기와 함께 새로운 하루를 시작해봐요.",
  "오늘 하루, 아기에게 어떤 이야기를 들려줄 건가요? 설레는 하루가 기다리고 있어요.",
  "아침 햇살처럼 따뜻한 하루 보내세요. 아기도 엄마와 함께라면 언제나 따뜻해요.",
  "오늘도 한 가지, 아기에게 작은 사랑을 표현해보세요. 노래도 좋고, 말도 좋고, 쓰다듬기도 좋아요.",
  "새로운 아침이 밝았어요. 어제보다 더 단단해진 엄마로 오늘을 맞이해봐요.",
  "처음이라 서툴러도 괜찮아요. 아기도 처음으로 엄마를 만나는 중이니까요.",
  "불안한 마음이 드는 건 그만큼 아기를 사랑한다는 증거예요.",
  "엄마가 되는 길엔 정답이 없어요. 지금 당신의 방식이 바로 정답이에요.",
  "잘 하고 있는지 걱정되는 날에도, 아기에게 당신은 이미 최고의 엄마예요.",
  "혼자가 아니에요. 수많은 엄마들이 당신과 함께 이 길을 걷고 있어요.",
  "아기가 세상에 나오는 날, 엄마의 얼굴을 가장 먼저 보고 싶어 할 거예요.",
  "지금 이 순간에도 아기는 엄마 안에서 무럭무럭 자라고 있어요. 정말 신기하고 소중하지 않나요?",
  "아기가 처음으로 엄마 손을 잡는 순간을 상상해보세요. 벌써 설레지 않나요?",
  "엄마가 먹는 음식, 엄마가 듣는 음악, 엄마가 느끼는 감정—모든 것을 아기와 나누고 있어요.",
  "세상에서 가장 특별한 인연, 바로 엄마와 아기 사이예요.",
  "오늘 나를 위해 한 가지 좋아하는 일을 해보세요. 행복한 엄마가 행복한 아기를 만들어요.",
  "엄마도 충분히 사랑받을 자격이 있어요. 오늘 자신을 다독여 주세요.",
  "물 한 잔, 따뜻한 차 한 모금. 오늘 나를 위한 작은 선물을 챙겨보세요.",
  "지금 이 경험 하나하나가 모두 엄마로 성장하는 과정이에요. 잘 해내고 있어요.",
  "당신이 엄마여서, 아기는 세상에서 가장 운이 좋은 아이예요.",
];

function buildDailyNoteItems(): HomeCopyItem[] {
  return DAILY_NOTE_BODIES.map((body, index) => ({
    id: `daily-note-common-${String(index + 1).padStart(2, "0")}`,
    slot: "daily_note",
    variant: null,
    title: `오늘의 한마디 ${index + 1}`,
    body,
    status: "published",
    displayOrder: 100 + index,
    updatedAt: UPDATED_AT,
  }));
}

function sortHomeCopyItems(items: HomeCopyItem[]) {
  return [...items].sort((left, right) => {
    const orderDelta = left.displayOrder - right.displayOrder;
    if (orderDelta !== 0) return orderDelta;
    return left.title.localeCompare(right.title, "ko-KR");
  });
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeHomeCopyItems(value: unknown): HomeCopyItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index): HomeCopyItem | null => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const record = item as Record<string, unknown>;
      const id = normalizeText(record.id);
      const slot = record.slot;
      const title = normalizeText(record.title);
      const body = normalizeText(record.body);
      const status = record.status;
      const displayOrder =
        typeof record.displayOrder === "number"
          ? record.displayOrder
          : Number(record.displayOrder);

      if (
        !id ||
        (slot !== "hero_bubble" &&
          slot !== "daily_note" &&
          slot !== "encouragement_quote") ||
        !title ||
        !body ||
        (status !== "draft" && status !== "published" && status !== "archived")
      ) {
        return null;
      }

      return {
        id,
        slot,
        variant: normalizeText(record.variant) || null,
        title,
        body,
        status,
        displayOrder: Number.isFinite(displayOrder)
          ? Math.trunc(displayOrder)
          : index + 1,
        updatedAt: normalizeText(record.updatedAt) || new Date(0).toISOString(),
      };
    })
    .filter((item): item is HomeCopyItem => Boolean(item));
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const row = await prisma.system_config.findUnique({
    where: { key: HOME_COPY_CONFIG_KEY },
  });
  const currentItems = row
    ? normalizeHomeCopyItems(row.value)
    : DEFAULT_RETAINED_HOME_COPY_ITEMS;
  const retainedItems = currentItems.filter(
    (item) => item.slot !== "daily_note" && item.slot !== "encouragement_quote",
  );
  const nextItems = sortHomeCopyItems([
    ...retainedItems,
    ...buildDailyNoteItems(),
  ]);

  const summary = {
    dryRun,
    existing: currentItems.length,
    retained: retainedItems.length,
    dailyNote: DAILY_NOTE_BODIES.length,
    next: nextItems.length,
  };

  if (dryRun) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  await prisma.system_config.upsert({
    where: { key: HOME_COPY_CONFIG_KEY },
    create: {
      key: HOME_COPY_CONFIG_KEY,
      value: nextItems as unknown as Prisma.InputJsonValue,
      updated_at: new Date(),
    },
    update: {
      value: nextItems as unknown as Prisma.InputJsonValue,
      updated_at: new Date(),
      previous_snapshot: row
        ? {
            key: row.key,
            value: row.value,
            updated_at: row.updated_at.toISOString(),
            updated_by: row.updated_by,
          }
        : undefined,
    },
  });

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error("오늘의 한마디 시드 실패:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
