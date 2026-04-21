/**
 * DB의 임신 주수 콘텐츠를 Schift 버킷에 업로드
 *   - pregnancy-raw: 원본 docx 파일
 *   - pregnancy-knowledge: 주차 개요 + 일별 구조화 문서 (241개)
 *
 * Usage: pnpm tsx scripts/sync-pregnancy-to-schift.ts            # 실제 업로드
 *        DRY_RUN=1 pnpm tsx scripts/sync-pregnancy-to-schift.ts  # 업로드 없이 파일 카운트만
 *
 * 전제:
 *   - Schift 서버의 ENCRYPTION_KEY 문제가 해결되어 job이 정상 처리돼야 함
 *   - .env.local 에 SCHIFT_API_KEY, DATABASE_URL 설정
 */

// Shell 환경변수(direnv .envrc 포함)를 최우선으로 하고, 없을 때만 .env 파일로 보충.
import { config as loadEnv } from "dotenv";
import path from "node:path";
loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

import { Schift } from "@schift-io/sdk";

const SCHIFT_API_KEY = process.env.SCHIFT_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const BUCKET_RAW = "pregnancy-raw";
const BUCKET_KNOWLEDGE = "pregnancy-knowledge";
const DRY_RUN = process.env.DRY_RUN === "1";
const RAW_DOCX_PATH =
  process.env.PREGNANCY_RAW_DOCX ??
  "/Users/jskang/Downloads/임신 주수 별 발달정보(0320_room).docx";

if (!SCHIFT_API_KEY) {
  console.error("SCHIFT_API_KEY is required");
  process.exit(1);
}
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

// -- Postgres direct query via pg --
import pg from "pg";
// Strip sslmode/gssencmode from URL to avoid pg-connection-string overriding
// our TLS settings (Supabase pooler serves a self-signed cert).
const needsSsl =
  DATABASE_URL.includes("sslmode=") ||
  /supabase\.(co|com)|pooler\./i.test(DATABASE_URL);
const cleanedUrl = DATABASE_URL.replace(/[?&](sslmode|gssencmode)=[^&]*/g, "")
  .replace(/\?&/, "?")
  .replace(/\?$/, "");
const pool = new pg.Pool({
  connectionString: cleanedUrl,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
});

async function query<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  const result = await pool.query(sql);
  return result.rows as T[];
}

type WeekRow = {
  week_number: number;
  title: string;
  baby_summary: string | null;
  mother_summary: string | null;
  warning_signs: string | null;
  recommended_actions: string | null;
};

type DayRow = {
  week_number: number;
  day_number: number;
  title: string | null;
  baby_message: string | null;
  baby_development_payload: { items?: string[] } | null;
  mother_changes_payload: { items?: string[] } | null;
};

type ChecklistRow = {
  week_number: number;
  day_number: number;
  title: string;
  description: string | null;
};

type QuestionRow = {
  week_number: number;
  day_number: number;
  question_text: string;
};

function buildWeekDocument(week: WeekRow): string {
  const lines = [
    `# 임신 ${week.week_number}주차 정보`,
    "",
    `제목: ${week.title}`,
  ];
  if (week.baby_summary) lines.push(`아기 요약: ${week.baby_summary}`);
  if (week.mother_summary) lines.push(`엄마 요약: ${week.mother_summary}`);
  if (week.warning_signs) lines.push(`위험 신호: ${week.warning_signs}`);
  if (week.recommended_actions)
    lines.push(`권장 조치: ${week.recommended_actions}`);
  return lines.join("\n");
}

function buildDayDocument(
  day: DayRow,
  checklists: ChecklistRow[],
  questions: QuestionRow[],
): string {
  const lines = [`# 임신 ${day.week_number}주 ${day.day_number}일차`, ""];

  if (day.baby_message) {
    lines.push(`아기의 말: ${day.baby_message}`, "");
  }

  const babyItems = day.baby_development_payload?.items ?? [];
  if (babyItems.length > 0) {
    lines.push("## 태아 발달정보");
    for (const item of babyItems) lines.push(`- ${item}`);
    lines.push("");
  }

  const motherItems = day.mother_changes_payload?.items ?? [];
  if (motherItems.length > 0) {
    lines.push("## 모체 변화정보");
    for (const item of motherItems) lines.push(`- ${item}`);
    lines.push("");
  }

  const dayChecklists = checklists.filter(
    (c) => c.week_number === day.week_number && c.day_number === day.day_number,
  );
  if (dayChecklists.length > 0) {
    lines.push("## 생활 체크리스트");
    for (const c of dayChecklists) {
      lines.push(`- ${c.title}${c.description ? `: ${c.description}` : ""}`);
    }
    lines.push("");
  }

  const dayQuestions = questions.filter(
    (q) => q.week_number === day.week_number && q.day_number === day.day_number,
  );
  if (dayQuestions.length > 0) {
    lines.push("## 태교 질문");
    for (const q of dayQuestions) lines.push(`- ${q.question_text}`);
    lines.push("");
  }

  return lines.join("\n");
}

async function main() {
  console.log("Fetching pregnancy data from DB...");

  const weeks = await query<WeekRow>(`
    SELECT week_number, title, baby_summary, mother_summary, warning_signs, recommended_actions
    FROM content.pregnancy_week_data
    WHERE status = 'published'
    ORDER BY week_number
  `);

  const days = await query<DayRow>(`
    SELECT pwd.week_number, pdc.day_number, pdc.title, pdc.baby_message,
           pdc.baby_development_payload, pdc.mother_changes_payload
    FROM content.pregnancy_day_contents pdc
    JOIN content.pregnancy_week_data pwd ON pwd.id = pdc.week_data_id
    WHERE pwd.status = 'published'
    ORDER BY pwd.week_number, pdc.day_number
  `);

  const checklists = await query<ChecklistRow>(`
    SELECT pwd.week_number, wc.day_number, wc.title, wc.description
    FROM content.week_checklists wc
    JOIN content.pregnancy_week_data pwd ON pwd.id = wc.week_data_id
    WHERE wc.is_active = true AND pwd.status = 'published'
    ORDER BY pwd.week_number, wc.day_number, wc.display_order
  `);

  const questions = await query<QuestionRow>(`
    SELECT pwd.week_number, wq.day_number, wq.question_text
    FROM content.week_questions wq
    JOIN content.pregnancy_week_data pwd ON pwd.id = wq.week_data_id
    WHERE wq.is_active = true AND pwd.status = 'published'
    ORDER BY pwd.week_number, wq.day_number, wq.display_order
  `);

  console.log(
    `  Weeks: ${weeks.length}, Days: ${days.length}, Checklists: ${checklists.length}, Questions: ${questions.length}`,
  );

  // Build structured text files for knowledge bucket
  const knowledgeFiles: File[] = [];

  for (const week of weeks) {
    const content = buildWeekDocument(week);
    const blob = new Blob([content], { type: "text/plain" });
    knowledgeFiles.push(
      new File([blob], `week-${week.week_number}-overview.txt`, {
        type: "text/plain",
      }),
    );
  }

  for (const day of days) {
    const content = buildDayDocument(day, checklists, questions);
    const blob = new Blob([content], { type: "text/plain" });
    knowledgeFiles.push(
      new File([blob], `week-${day.week_number}-day-${day.day_number}.txt`, {
        type: "text/plain",
      }),
    );
  }

  console.log(
    `Built ${knowledgeFiles.length} text documents for knowledge bucket`,
  );

  const schift = new Schift({ apiKey: SCHIFT_API_KEY });

  // --- Pre-upload bucket state ---
  try {
    const bucketsRes = await fetch("https://api.schift.io/v1/buckets", {
      headers: { Authorization: `Bearer ${SCHIFT_API_KEY}` },
    });
    if (bucketsRes.ok) {
      const buckets = (await bucketsRes.json()) as Array<{
        name: string;
        file_count?: number;
        vector_count?: number;
        active_job_count?: number;
      }>;
      console.log("\n[pre-upload bucket state]");
      for (const name of [BUCKET_RAW, BUCKET_KNOWLEDGE]) {
        const b = buckets.find((x) => x.name === name);
        if (b) {
          console.log(
            `  ${name}: files=${b.file_count ?? "?"} vectors=${b.vector_count ?? "?"} active_jobs=${b.active_job_count ?? 0}`,
          );
          if ((b.active_job_count ?? 0) > 0) {
            console.warn(
              `    ⚠ ${b.active_job_count}개 job이 대기/재시도 중 — Schift 서버 상태 확인 후 진행`,
            );
          }
        } else {
          console.log(`  ${name}: (버킷 없음 — upload 시 생성됨)`);
        }
      }
    }
  } catch (e) {
    console.warn(`  (버킷 상태 조회 실패: ${(e as Error).message})`);
  }

  if (DRY_RUN) {
    console.log(
      `\nDRY_RUN=1 — 업로드 생략. raw docx=${RAW_DOCX_PATH} (exists=${(await import("fs")).existsSync(RAW_DOCX_PATH)}), knowledge 문서=${knowledgeFiles.length}개 준비됨.`,
    );
    await pool.end();
    return;
  }

  // --- 1) Upload raw docx to pregnancy-raw bucket ---
  try {
    const fs = await import("fs");
    if (fs.existsSync(RAW_DOCX_PATH)) {
      const buf = fs.readFileSync(RAW_DOCX_PATH);
      const rawFile = new File(
        [
          new Blob([buf], {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          }),
        ],
        "임신_주수별_발달정보.docx",
        {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
      );
      console.log(`\nUploading raw docx to "${BUCKET_RAW}"...`);
      const rawResult = await schift.db.upload(BUCKET_RAW, {
        files: [rawFile],
      });
      console.log(
        `  ✓ Raw bucket: ${rawResult.bucket_name}, uploaded: ${(rawResult.uploaded as unknown[]).length}`,
      );
    } else {
      console.log(
        `\nSkipping raw docx upload — file not found: ${RAW_DOCX_PATH}`,
      );
      console.log(`  (PREGNANCY_RAW_DOCX 환경변수로 경로 지정 가능)`);
    }
  } catch (e) {
    console.error(`  ✗ Raw docx upload failed:`, (e as Error).message);
  }

  // --- 2) Upload structured documents to pregnancy-knowledge bucket ---
  console.log(
    `\nUploading ${knowledgeFiles.length} documents to "${BUCKET_KNOWLEDGE}"...`,
  );
  const BATCH_SIZE = 10;
  let uploaded = 0;
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  for (let i = 0; i < knowledgeFiles.length; i += BATCH_SIZE) {
    const batch = knowledgeFiles.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(knowledgeFiles.length / BATCH_SIZE);
    console.log(
      `  Batch ${batchNum}/${totalBatches} (${batch.length} files)...`,
    );

    let retries = 3;
    while (retries > 0) {
      try {
        const result = await schift.db.upload(BUCKET_KNOWLEDGE, {
          files: batch,
        });
        uploaded += batch.length;
        console.log(`    ✓ uploaded: ${(result.uploaded as unknown[]).length}`);
        break;
      } catch (e) {
        const msg = (e as Error).message;
        if (msg.includes("429") && retries > 1) {
          retries--;
          console.log(
            `    ⏳ Rate limited, waiting 10s... (${retries} retries left)`,
          );
          await sleep(10000);
        } else {
          console.error(`    ✗ Batch upload failed:`, msg);
          break;
        }
      }
    }

    // Pause between batches to avoid rate limits
    if (i + BATCH_SIZE < knowledgeFiles.length) {
      await sleep(3000);
    }
  }

  console.log(
    `\nDone! Uploaded ${uploaded}/${knowledgeFiles.length} documents to "${BUCKET_KNOWLEDGE}"`,
  );

  await pool.end();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
