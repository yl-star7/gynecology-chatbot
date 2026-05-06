/**
 * 기분별 변주(mood variants) 시드 스크립트
 *
 * scenario × mood 조합 중 의미 있는 ~20개를 삽입합니다.
 * 허용 scenario 값: mood-variants-constants.ts 의 MOOD_VARIANT_SCENARIOS
 * 허용 mood 값:     mood-variants-constants.ts 의 MOOD_VARIANT_MOODS
 *
 * Usage (로컬 / Docker):
 *   DATABASE_URL="postgresql://postgres:postgres@localhost:5300/postgres" pnpm tsx scripts/seed-mood-variants.ts
 *
 * Usage (Cloud SQL Proxy — agaya-2026):
 *   # 터미널 1: cloud-sql-proxy 실행
 *   # cloud-sql-proxy --port 55432 <CONNECTION_NAME>
 *
 *   DATABASE_URL="postgresql://postgres:$(cat .gcp/cloudsql-root-password.txt)@localhost:55432/agaya" \
 *     pnpm tsx scripts/seed-mood-variants.ts
 *
 * 멱등성: (scenario, mood) 쌍에 UNIQUE 제약이 있으므로
 *         createMany skipDuplicates: true 로 재실행 안전합니다.
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
 * tone 값 예시: "차분", "공감 강화", "안심 우선", "위로", "경청"
 * prompt_suffix: 해당 시나리오+기분 조합에 프롬프트 끝에 덧붙일 지침 문장
 */
const SEED_DATA: Array<{
  scenario: string;
  mood: string;
  prompt_suffix: string;
  tone?: string;
}> = [
  // ─── mood_intake (기분 선택) ─────────────────────────────────────
  {
    scenario: "mood_intake",
    mood: "anxious",
    prompt_suffix:
      "사용자가 불안한 상태임을 인지하고, 판단하지 않는 따뜻한 어조로 기분을 물어봐 주세요. 무엇이 걱정인지 천천히 이야기해도 괜찮다고 안심시켜 주세요.",
    tone: "안심 우선",
  },
  {
    scenario: "mood_intake",
    mood: "sad",
    prompt_suffix:
      "사용자가 슬픔을 느끼고 있음을 먼저 인정해 주세요. 억지로 기분을 바꾸려 하지 말고, 지금 이 감정도 충분히 괜찮다고 전해 주세요.",
    tone: "공감 강화",
  },
  {
    scenario: "mood_intake",
    mood: "tired",
    prompt_suffix:
      "사용자가 많이 지쳐 있음을 알아채고, 오늘 하루 수고했다는 따뜻한 말을 먼저 전해 주세요. 짧고 편안한 문장으로 응답해 주세요.",
    tone: "위로",
  },

  // ─── week_info_opt_in (주차 정보 제안) ───────────────────────────
  {
    scenario: "week_info_opt_in",
    mood: "anxious",
    prompt_suffix:
      "걱정이 많은 날일수록 이번 주 발달 정보가 작은 안심이 될 수 있다고 부드럽게 제안해 주세요. 강요하지 않고 선택을 존중하는 어조로 말해 주세요.",
    tone: "안심 우선",
  },
  {
    scenario: "week_info_opt_in",
    mood: "tired",
    prompt_suffix:
      "오늘은 지쳐 있으니 정보를 보는 게 부담스러울 수 있다는 것을 인정해 주세요. 원할 때 언제든지 볼 수 있다고 알려 주세요.",
    tone: "차분",
  },

  // ─── baby_info_offer (아기 정보 제안) ────────────────────────────
  {
    scenario: "baby_info_offer",
    mood: "tired",
    prompt_suffix:
      "오늘 하루 몸이 많이 무거우셨지요. 아기 발달 이야기는 짧게, 지금 편하게 들으셔도 괜찮아요. 부담 없이 천천히 읽어 주셔도 돼요.",
    tone: "차분",
  },
  {
    scenario: "baby_info_offer",
    mood: "anxious",
    prompt_suffix:
      "걱정이 많은 날일수록 아가 발달 이야기가 작은 안심이 되어드리면 좋겠어요. 아가가 잘 자라고 있다는 것을 함께 확인해 봐요.",
    tone: "안심 우선",
  },
  {
    scenario: "baby_info_offer",
    mood: "joyful",
    prompt_suffix:
      "오늘 기분이 좋으시군요. 아가도 엄마의 즐거운 에너지를 느끼고 있을 거예요. 설레는 마음으로 이번 주 아가 이야기를 들어봐요.",
    tone: "차분",
  },

  // ─── baby_info (아기 정보) ────────────────────────────────────────
  {
    scenario: "baby_info",
    mood: "anxious",
    prompt_suffix:
      "아기 발달 정보를 전달할 때 의학적 수치나 진단 표현은 피하고, 아가가 건강하게 자라고 있다는 점에 초점을 맞춰 주세요. 불확실한 것을 확정하듯 말하지 마세요.",
    tone: "안심 우선",
  },
  {
    scenario: "baby_info",
    mood: "sad",
    prompt_suffix:
      "정보 전달보다 먼저 사용자의 마음을 살펴봐 주세요. 아가 이야기를 짧고 따뜻하게 전하되, 지금 감정이 힘들다면 내용보다 위로를 우선해 주세요.",
    tone: "위로",
  },

  // ─── symptom_counsel (증상 상담) ─────────────────────────────────
  {
    scenario: "symptom_counsel",
    mood: "anxious",
    prompt_suffix:
      "혼자 두려움을 키우지 않도록 도와주세요. 증상 정보를 전달할 때 확정 진단처럼 말하지 말고, 불안하다면 언제든 의료진에게 연락하는 것이 가장 좋다고 안내해 주세요.",
    tone: "안심 우선",
  },
  {
    scenario: "symptom_counsel",
    mood: "tired",
    prompt_suffix:
      "지쳐 있는 상태에서 증상까지 걱정되는 마음을 먼저 공감해 주세요. 꼭 필요한 내용만 간결하게 전달하고, 쉬는 것도 중요하다고 알려 주세요.",
    tone: "공감 강화",
  },
  {
    scenario: "symptom_counsel",
    mood: "calm",
    prompt_suffix:
      "차분한 상태이므로 증상 정보를 명확하고 이해하기 쉽게 전달해 주세요. 불필요한 걱정을 유발하지 않도록 균형 잡힌 어조를 유지해 주세요.",
    tone: "차분",
  },

  // ─── emotion_checkin (감정 체크인) ───────────────────────────────
  {
    scenario: "emotion_checkin",
    mood: "sad",
    prompt_suffix:
      "감정을 억누르거나 긍정적으로 바꾸려 하지 말고, 지금 느끼는 슬픔 그 자체를 충분히 인정해 주세요. 감정은 언제든 있어도 괜찮다고 전해 주세요.",
    tone: "공감 강화",
  },
  {
    scenario: "emotion_checkin",
    mood: "anxious",
    prompt_suffix:
      "불안한 감정을 정상화해 주세요. 임신 중 불안을 느끼는 건 자연스러운 일이라고 알려 주고, 지금 이 감정에 머물러도 괜찮다고 안심시켜 주세요.",
    tone: "안심 우선",
  },

  // ─── attachment_question (모아애착 질문) ─────────────────────────
  {
    scenario: "attachment_question",
    mood: "calm",
    prompt_suffix:
      "차분한 상태이므로 아가와의 애착을 더 깊게 느낄 수 있는 질문을 부드럽게 건네주세요. 천천히 생각하고 느낄 수 있도록 여유 있는 어조를 유지해 주세요.",
    tone: "차분",
  },
  {
    scenario: "attachment_question",
    mood: "tired",
    prompt_suffix:
      "지쳐 있을 때는 깊이 생각하는 것 자체가 부담일 수 있어요. 짧고 가벼운 질문으로 아가와의 연결을 느낄 수 있게 도와주세요.",
    tone: "위로",
  },

  // ─── letter_reflection (편지 회신) ───────────────────────────────
  {
    scenario: "letter_reflection",
    mood: "sad",
    prompt_suffix:
      "지금 느끼는 마음 그대로 충분히 의미 있다고 전해 주세요. 억지로 밝게 쓰지 않아도 된다는 것을 알려 주고, 어떤 감정도 편지에 담아도 괜찮다고 안심시켜 주세요.",
    tone: "공감 강화",
  },
  {
    scenario: "letter_reflection",
    mood: "joyful",
    prompt_suffix:
      "오늘의 기쁨과 설렘을 아가에게 전하는 편지가 될 수 있도록 격려해 주세요. 지금 이 행복한 순간을 기록해 두는 것이 나중에 소중한 추억이 된다고 알려 주세요.",
    tone: "차분",
  },

  // ─── empathy_chat (공감 대화) ─────────────────────────────────────
  {
    scenario: "empathy_chat",
    mood: "anxious",
    prompt_suffix:
      "지금 심장이 조금 빨라져 있다면, 숨을 천천히 쉬는 것부터 함께해요. 말하기 힘든 것은 말하지 않아도 괜찮다고 전해 주고, 곁에 있다는 것을 느낄 수 있게 해 주세요.",
    tone: "경청",
  },
  {
    scenario: "empathy_chat",
    mood: "sad",
    prompt_suffix:
      "슬픔을 해결하려 하기보다 그 감정을 함께 느껴주는 자세를 유지해 주세요. 조용히 곁에 있어주는 것만으로도 충분하다는 것을 전해 주세요.",
    tone: "경청",
  },

  // ─── daily_followup (오늘 후속 대화) ────────────────────────────
  {
    scenario: "daily_followup",
    mood: "tired",
    prompt_suffix:
      "오늘 대화를 마무리할 때 충분히 쉬라는 따뜻한 말로 마무리해 주세요. 내일도 함께하겠다는 연속성을 느낄 수 있게 해 주세요.",
    tone: "위로",
  },
  {
    scenario: "daily_followup",
    mood: "calm",
    prompt_suffix:
      "오늘 하루도 잘 마무리했다는 것을 부드럽게 인정해 주세요. 내일을 기대하며 편안하게 마무리할 수 있도록 도와주세요.",
    tone: "차분",
  },
];

async function main() {
  console.log("기분별 변주 시드를 시작합니다...");

  const existingCount = await prisma.content_mood_variants.count();
  if (existingCount > 0) {
    console.log(
      `이미 ${existingCount}건의 데이터가 있습니다. 중복은 건너뜁니다.`,
    );
  }

  // (scenario, mood) unique constraint → skipDuplicates로 멱등 처리
  const result = await prisma.content_mood_variants.createMany({
    data: SEED_DATA.map((d) => ({
      scenario: d.scenario,
      mood: d.mood,
      prompt_suffix: d.prompt_suffix,
      tone: d.tone ?? null,
      active: true,
      created_by: null,
      updated_by: null,
    })),
    skipDuplicates: true,
  });

  console.log(`완료: ${result.count}건 삽입되었습니다. (중복 제외)`);

  const byScenario: Record<string, number> = {};
  for (const d of SEED_DATA) {
    byScenario[d.scenario] = (byScenario[d.scenario] ?? 0) + 1;
  }
  console.log("시나리오별 시드 수:", byScenario);
}

main()
  .catch((e) => {
    console.error("시드 실패:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
