/**
 * DB의 임신 주수 콘텐츠 → Supabase pregnancy_documents 테이블에 embedding과 함께 저장
 *
 * Usage: NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx scripts/fill-pregnancy-rag.ts
 */

import pg from "pg";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const DATABASE_URL = process.env.DATABASE_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const PGVECTOR_DIM = 1536;

if (!DATABASE_URL) { console.error("DATABASE_URL required"); process.exit(1); }
if (!GEMINI_API_KEY) { console.error("GEMINI_API_KEY required"); process.exit(1); }

const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
const embeddings = new GoogleGenerativeAIEmbeddings({ apiKey: GEMINI_API_KEY, modelName: "gemini-embedding-001" });

async function query<T>(sql: string, params?: unknown[]): Promise<T[]> {
  const r = await pool.query(sql, params);
  return r.rows as T[];
}

type WeekRow = { week_number: number; title: string; baby_summary: string | null; mother_summary: string | null; warning_signs: string | null; recommended_actions: string | null };
type DayRow = { week_number: number; day_number: number; baby_message: string | null; baby_development_payload: { items?: string[] } | null; mother_changes_payload: { items?: string[] } | null };
type ChecklistRow = { week_number: number; day_number: number; title: string; description: string | null };
type QuestionRow = { week_number: number; day_number: number; question_text: string };

function buildWeekText(w: WeekRow): string {
  return [
    `임신 ${w.week_number}주차 정보`,
    w.title,
    w.baby_summary ? `아기: ${w.baby_summary}` : null,
    w.mother_summary ? `엄마: ${w.mother_summary}` : null,
    w.warning_signs ? `위험 신호: ${w.warning_signs}` : null,
    w.recommended_actions ? `권장 조치: ${w.recommended_actions}` : null,
  ].filter(Boolean).join("\n");
}

function buildDayText(d: DayRow, cls: ChecklistRow[], qs: QuestionRow[]): string {
  const lines: string[] = [`임신 ${d.week_number}주 ${d.day_number}일차`];
  if (d.baby_message) lines.push(`아기의 말: ${d.baby_message}`);
  for (const item of d.baby_development_payload?.items ?? []) lines.push(`태아 발달: ${item}`);
  for (const item of d.mother_changes_payload?.items ?? []) lines.push(`모체 변화: ${item}`);
  for (const c of cls.filter(x => x.week_number === d.week_number && x.day_number === d.day_number))
    lines.push(`체크리스트: ${c.title}${c.description ? ` - ${c.description}` : ""}`);
  for (const q of qs.filter(x => x.week_number === d.week_number && x.day_number === d.day_number))
    lines.push(`태교 질문: ${q.question_text}`);
  return lines.join("\n");
}

async function embedText(text: string): Promise<number[]> {
  const vec = await embeddings.embedQuery(text);
  return vec.slice(0, PGVECTOR_DIM);
}

async function upsertDoc(doc: { title: string; content: string; category: string; pregnancyWeek: number; embedding: number[] }) {
  await pool.query(
    `INSERT INTO content.pregnancy_documents (title, content, category, pregnancy_week, embedding, metadata)
     VALUES ($1, $2, $3, $4, $5::vector, '{}'::jsonb)`,
    [doc.title, doc.content, doc.category, doc.pregnancyWeek, `[${doc.embedding.join(",")}]`],
  );
}

async function deleteOldDocs() {
  const r = await pool.query("DELETE FROM content.pregnancy_documents WHERE category != '수동'");
  console.log(`기존 자동 생성 문서 ${r.rowCount}건 삭제`);
}

async function main() {
  console.log("DB에서 콘텐츠 로딩...");
  const [weeks, days, cls, qs] = await Promise.all([
    query<WeekRow>("SELECT week_number, title, baby_summary, mother_summary, warning_signs, recommended_actions FROM content.pregnancy_week_data WHERE status='published' ORDER BY week_number"),
    query<DayRow>("SELECT pwd.week_number, pdc.day_number, pdc.baby_message, pdc.baby_development_payload, pdc.mother_changes_payload FROM content.pregnancy_day_contents pdc JOIN content.pregnancy_week_data pwd ON pwd.id=pdc.week_data_id WHERE pwd.status='published' ORDER BY pwd.week_number, pdc.day_number"),
    query<ChecklistRow>("SELECT pwd.week_number, wc.day_number, wc.title, wc.description FROM content.week_checklists wc JOIN content.pregnancy_week_data pwd ON pwd.id=wc.week_data_id WHERE wc.is_active=true AND pwd.status='published' ORDER BY pwd.week_number, wc.day_number, wc.display_order"),
    query<QuestionRow>("SELECT pwd.week_number, wq.day_number, wq.question_text FROM content.week_questions wq JOIN content.pregnancy_week_data pwd ON pwd.id=wq.week_data_id WHERE wq.is_active=true AND pwd.status='published' ORDER BY pwd.week_number, wq.day_number, wq.display_order"),
  ]);
  console.log(`  주차: ${weeks.length}, 일차: ${days.length}, 체크리스트: ${cls.length}, 질문: ${qs.length}`);

  // 문서 구성
  type Doc = { title: string; content: string; category: string; week: number };
  const docs: Doc[] = [];

  for (const w of weeks) {
    docs.push({ title: `${w.week_number}주차 개요`, content: buildWeekText(w), category: "week-overview", week: w.week_number });
  }
  for (const d of days) {
    docs.push({ title: `${d.week_number}주 ${d.day_number}일차`, content: buildDayText(d, cls, qs), category: "day-content", week: d.week_number });
  }
  console.log(`총 ${docs.length}개 문서 생성`);

  // 기존 자동 문서 삭제
  await deleteOldDocs();

  // Embedding + Insert (배치)
  let done = 0;
  const BATCH = 10;
  for (let i = 0; i < docs.length; i += BATCH) {
    const batch = docs.slice(i, i + BATCH);
    const texts = batch.map(d => d.content);

    // embedBatch 대신 개별 호출 (langchain 호환)
    const vecs = await Promise.all(texts.map(t => embedText(t)));

    for (let j = 0; j < batch.length; j++) {
      await upsertDoc({
        title: batch[j].title,
        content: batch[j].content,
        category: batch[j].category,
        pregnancyWeek: batch[j].week,
        embedding: vecs[j],
      });
    }

    done += batch.length;
    process.stdout.write(`\r  ${done}/${docs.length} 완료`);
  }

  console.log("\n\n검증 중...");
  const [{ count }] = await query<{ count: string }>("SELECT count(*) FROM content.pregnancy_documents");
  console.log(`pregnancy_documents 총 ${count}건`);

  // 쿼리 성능 테스트
  console.log("\n쿼리 성능 테스트 (EXPLAIN ANALYZE)...");
  const testQuery = "허리가 아파요";
  const testVec = await embedText(testQuery);
  const vecStr = `[${testVec.join(",")}]`;

  const explain = await query<{ "QUERY PLAN": string }>(
    `EXPLAIN ANALYZE SELECT id, title, pregnancy_week, 1-(embedding <=> $1::vector) as similarity
     FROM content.pregnancy_documents
     ORDER BY embedding <=> $1::vector
     LIMIT 5`,
    [vecStr],
  );
  for (const row of explain) console.log(`  ${row["QUERY PLAN"]}`);

  // 실제 검색 결과
  console.log(`\n검색: "${testQuery}" 상위 5건:`);
  const results = await query<{ title: string; pregnancy_week: number; similarity: number }>(
    `SELECT title, pregnancy_week, 1-(embedding <=> $1::vector) as similarity
     FROM content.pregnancy_documents
     ORDER BY embedding <=> $1::vector
     LIMIT 5`,
    [vecStr],
  );
  for (const r of results) console.log(`  [${r.pregnancy_week}주] ${r.title} (유사도: ${Number(r.similarity).toFixed(4)})`);

  await pool.end();
  console.log("\n완료!");
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
