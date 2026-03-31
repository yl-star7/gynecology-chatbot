# Canonical Week ORM Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자/모바일이 실제로 사용하는 주차 콘텐츠 canonical 스키마만 남기고, 그 구조를 기준으로 TypeScript ORM 레이어와 local-postgres shadow를 재정렬한다.

**Architecture:** `content.pregnancy_week_data`를 루트 aggregate로 두고 `pregnancy_day_contents`, `week_checklists`, `week_questions`, `pregnancy_week_media`를 자식 관계로 둔다. 읽기/쓰기 SQL 문자열을 각 기능 코드에 흩뿌리는 대신, ORM schema + repository 계층을 추가해 canonical 관계를 한 군데에서 정의하고, local-postgres bootstrap도 같은 canonical 엔티티 집합만 복제하도록 정리한다.

**Tech Stack:** TypeScript, Next.js route handlers, pg, Drizzle ORM, Jest, Turbo, pnpm

---

## File Structure

### Create
- `apps/web/src/lib/db/schema/content.ts` — canonical content schema (`pregnancy_week_data`, `pregnancy_day_contents`, `week_checklists`, `week_questions`, `pregnancy_week_media`)의 Drizzle table 정의
- `apps/web/src/lib/db/schema/public.ts` — canonical schema가 직접 참조하는 public 테이블 최소 정의 (`users`, `chat_sessions`, `chat_messages`, `user_checklist_events`, `user_question_events`, `admin_audit_logs`)
- `apps/web/src/lib/db/client.ts` — `DATABASE_URL` 기반 Drizzle client 생성
- `apps/web/src/lib/db/repositories/week-content-repository.ts` — 주차 summary/detail 조회, day/checklist/question/media upsert/delete, audit logging용 write helper
- `apps/web/src/lib/db/repositories/week-content-repository.test.ts` — repository SQL shape/unit test
- `supabase/migrations/20260331_drop_legacy_week_tables.sql` — legacy `content.pregnancy_weeks`, `content.pregnancy_week_sections`, `content.pregnancy_week_assets` 삭제 migration

### Modify
- `apps/web/src/lib/admin/adapters/supabase-admin-content-port.ts` — canonical week CRUD를 ORM repository 호출로 교체
- `apps/web/src/lib/admin/adapters/supabase-admin-content-port.test.ts` — repository 기반 동작 검증으로 갱신
- `apps/web/src/lib/mobile/local-postgres-schema.ts` — legacy local tables 제거, canonical 5개 + 이벤트 테이블만 남김
- `apps/web/src/lib/mobile/local-postgres.ts` — allowlist/seed/bootstrap에서 legacy table 제거, canonical seed만 유지
- `apps/web/src/lib/mobile/local-postgres-schema.test.ts` — legacy table 미생성 검증 추가
- `apps/web/src/lib/mobile/local-postgres.test.ts` — canonical seed만 생성되는지 검증
- `docs/reference/DATABASE_SCHEMA.md` — canonical 5개 + public view/read model 기준으로 문서 교체
- `package.json` — Drizzle dependency 및 필요시 drizzle-kit script 추가

### Test
- `apps/web/src/lib/mobile/local-postgres-schema.test.ts`
- `apps/web/src/lib/mobile/local-postgres.test.ts`
- `apps/web/src/lib/admin/adapters/supabase-admin-content-port.test.ts`
- `apps/web/src/lib/db/repositories/week-content-repository.test.ts`

---

### Task 1: Drizzle ORM canonical schema 도입

**Files:**
- Create: `apps/web/src/lib/db/schema/content.ts`
- Create: `apps/web/src/lib/db/schema/public.ts`
- Create: `apps/web/src/lib/db/client.ts`
- Modify: `package.json:6-24`
- Test: `apps/web/src/lib/db/repositories/week-content-repository.test.ts`

- [ ] **Step 1: Write the failing repository schema test**

```ts
import { getTableColumns } from "drizzle-orm";
import {
  pregnancyWeekData,
  pregnancyDayContents,
  pregnancyWeekMedia,
  weekChecklists,
  weekQuestions,
} from "../schema/content";

describe("canonical content schema", () => {
  it("defines pregnancy_week_data as the root week table", () => {
    expect(pregnancyWeekData["_"]?.name).toBe("pregnancy_week_data");
    expect(Object.keys(getTableColumns(pregnancyWeekData))).toEqual(
      expect.arrayContaining([
        "id",
        "weekNumber",
        "title",
        "warningSigns",
        "recommendedActions",
        "checklistIntro",
        "questionIntro",
        "status",
      ]),
    );
  });

  it("defines canonical child tables only", () => {
    expect(pregnancyDayContents["_"]?.name).toBe("pregnancy_day_contents");
    expect(pregnancyWeekMedia["_"]?.name).toBe("pregnancy_week_media");
    expect(weekChecklists["_"]?.name).toBe("week_checklists");
    expect(weekQuestions["_"]?.name).toBe("week_questions");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @gynecology-chatbot/web exec jest src/lib/db/repositories/week-content-repository.test.ts --runInBand`
Expected: FAIL with `Cannot find module '../schema/content'`

- [ ] **Step 3: Add Drizzle dependencies**

```json
{
  "dependencies": {
    "drizzle-orm": "^0.44.5",
    "pg": "^8.16.3"
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.4"
  }
}
```

- [ ] **Step 4: Create canonical content schema**

```ts
import {
  boolean,
  check,
  index,
  integer,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  jsonb,
} from "drizzle-orm/pg-core";

const content = pgSchema("content");

export const pregnancyWeekData = content.table(
  "pregnancy_week_data",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    weekNumber: integer("week_number").notNull().unique(),
    title: varchar("title", { length: 200 }),
    babySizeLabel: varchar("baby_size_label", { length: 120 }),
    babySizeCompareObject: varchar("baby_size_compare_object", { length: 120 }),
    babySummary: text("baby_summary"),
    motherSummary: text("mother_summary"),
    warningSigns: text("warning_signs"),
    recommendedActions: text("recommended_actions"),
    checklistIntro: text("checklist_intro"),
    questionIntro: text("question_intro"),
    status: text("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    check("pregnancy_week_data_week_number_range", sql`${table.weekNumber} between 1 and 40`),
  ],
);

export const pregnancyDayContents = content.table("pregnancy_day_contents", {
  id: uuid("id").defaultRandom().primaryKey(),
  weekDataId: uuid("week_data_id").notNull().references(() => pregnancyWeekData.id, { onDelete: "cascade" }),
  dayNumber: integer("day_number").notNull(),
  title: varchar("title", { length: 120 }),
  babyDevelopmentPayload: jsonb("baby_development_payload").notNull(),
  babyMessage: text("baby_message"),
  motherChangesPayload: jsonb("mother_changes_payload").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});
```

- [ ] **Step 5: Create public schema references and Drizzle client**

```ts
import { pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core";

const publicSchema = pgSchema("public");

export const users = publicSchema.table("users", {
  id: uuid("id").primaryKey(),
});

export const chatSessions = publicSchema.table("chat_sessions", {
  id: uuid("id").primaryKey(),
});

export const chatMessages = publicSchema.table("chat_messages", {
  id: uuid("id").primaryKey(),
});

export const adminAuditLogs = publicSchema.table("admin_audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  adminUserId: uuid("admin_user_id"),
  targetUserId: uuid("target_user_id"),
  actionType: text("action_type").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  reason: text("reason"),
  beforePayload: jsonb("before_payload").notNull(),
  afterPayload: jsonb("after_payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});
```

```ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

let pool: Pool | null = null;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  return drizzle(pool);
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm --filter @gynecology-chatbot/web exec jest src/lib/db/repositories/week-content-repository.test.ts --runInBand`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add package.json apps/web/src/lib/db/schema/content.ts apps/web/src/lib/db/schema/public.ts apps/web/src/lib/db/client.ts apps/web/src/lib/db/repositories/week-content-repository.test.ts
git commit -m "feat: add canonical week drizzle schema"
```

---

### Task 2: Week content repository로 관리자 주차 CRUD 집중화

**Files:**
- Create: `apps/web/src/lib/db/repositories/week-content-repository.ts`
- Modify: `apps/web/src/lib/admin/adapters/supabase-admin-content-port.ts:45-1760`
- Modify: `apps/web/src/lib/admin/adapters/supabase-admin-content-port.test.ts:98-320`
- Test: `apps/web/src/lib/db/repositories/week-content-repository.test.ts`
- Test: `apps/web/src/lib/admin/adapters/supabase-admin-content-port.test.ts`

- [ ] **Step 1: Write the failing repository behavior test**

```ts
import { WeekContentRepository } from "./week-content-repository";

describe("WeekContentRepository", () => {
  it("loads a week aggregate from canonical tables", async () => {
    const db = {
      query: {
        pregnancyWeekData: {
          findFirst: jest.fn().mockResolvedValue({
            id: "week-12",
            weekNumber: 12,
            title: "12주차",
            babySummary: "아기가 자라고 있어요.",
            motherSummary: "몸의 변화를 느낄 수 있어요.",
            warningSigns: "출혈이 있으면 바로 진료를 받아요.",
            recommendedActions: "수분을 충분히 드세요.",
            checklistIntro: "이번 주 체크리스트예요.",
            questionIntro: "가볍게 답해보세요.",
            status: "draft",
            days: [{ id: "day-1", dayNumber: 1, title: "1일차" }],
            checklists: [{ id: "check-1", code: "rest", title: "충분히 쉬기" }],
            questions: [{ id: "question-1", code: "mood", questionText: "오늘 기분은 어떤가요?" }],
            media: [{ id: "media-1", mediaScope: "week", objectPath: "weeks/12/hero.jpg" }],
          }),
        },
      },
    } as any;

    const repository = new WeekContentRepository(db);
    const week = await repository.getWeek(12);

    expect(week?.weekNumber).toBe(12);
    expect(week?.days).toHaveLength(1);
    expect(week?.checklists).toHaveLength(1);
    expect(week?.questions).toHaveLength(1);
    expect(week?.media).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @gynecology-chatbot/web exec jest src/lib/db/repositories/week-content-repository.test.ts --runInBand`
Expected: FAIL with `Cannot find module './week-content-repository'`

- [ ] **Step 3: Implement repository**

```ts
import { asc, eq } from "drizzle-orm";
import { getDb } from "../client";
import {
  pregnancyDayContents,
  pregnancyWeekData,
  pregnancyWeekMedia,
  weekChecklists,
  weekQuestions,
} from "../schema/content";

export class WeekContentRepository {
  constructor(private readonly db = getDb()) {}

  async listWeeks() {
    return this.db
      .select()
      .from(pregnancyWeekData)
      .orderBy(asc(pregnancyWeekData.weekNumber));
  }

  async getWeek(weekNumber: number) {
    return this.db.query.pregnancyWeekData.findFirst({
      where: eq(pregnancyWeekData.weekNumber, weekNumber),
      with: {
        days: { orderBy: [asc(pregnancyDayContents.dayNumber)] },
        checklists: { orderBy: [asc(weekChecklists.dayNumber), asc(weekChecklists.displayOrder)] },
        questions: { orderBy: [asc(weekQuestions.dayNumber), asc(weekQuestions.displayOrder)] },
        media: { orderBy: [asc(pregnancyWeekMedia.dayNumber), asc(pregnancyWeekMedia.displayOrder)] },
      },
    });
  }
}
```

- [ ] **Step 4: Replace week SQL branches in admin adapter with repository calls**

```ts
import { WeekContentRepository } from "@/lib/db/repositories/week-content-repository";

export class SupabaseAdminContentPortAdapter implements AdminContentPort {
  private readonly fallback = new MockAdminContentAdapter();
  private readonly weekRepository = new WeekContentRepository();

  async listWeeks() {
    if (!hasBackendAdminConfig()) {
      return this.fallback.listWeeks();
    }

    const rows = await this.weekRepository.listWeeks();
    return rows.map(mapWeekSummary);
  }

  async getWeek(weekNumber: number) {
    if (!hasBackendAdminConfig()) {
      return this.fallback.getWeek(weekNumber);
    }

    const row = await this.weekRepository.getWeek(weekNumber);
    if (!row) {
      return null;
    }

    return mapWeekDetail(row, row.days ?? [], row.checklists ?? [], row.questions ?? [], row.media ?? []);
  }
}
```

- [ ] **Step 5: Update admin adapter tests to assert repository-backed canonical mapping**

```ts
it("maps week detail from canonical repository rows", async () => {
  mockedSelect.mockReset();
  const listSpy = jest
    .spyOn(WeekContentRepository.prototype, "getWeek")
    .mockResolvedValue({
      id: "week-2",
      weekNumber: 2,
      title: "두 번째 주",
      babySizeLabel: "체리",
      babySizeCompareObject: "작은 체리",
      babySummary: "병아리처럼 작은 심장이 움직입니다.",
      motherSummary: "유방이 민감해질 수 있습니다.",
      warningSigns: "위험 신호 정리",
      recommendedActions: "권장 액션 정리",
      status: "draft",
      updatedAt: "2026-03-18T08:00:00.000Z",
      days: [{ id: "day-1", dayNumber: 1, title: "Day 1", displayOrder: 1 }],
      checklists: [{ id: "check-1", dayNumber: 1, code: "attachment_question", title: "애착 질문", description: "오늘 느낀 감정을 적어주세요.", displayOrder: 1, isRequired: false, isActive: true }],
      questions: [{ id: "question-1", dayNumber: 1, code: "hero-card", questionType: "hero", questionText: "/images/week2/hero.jpg", helpText: "히어로 이미지", displayOrder: 1, isRequired: true, isActive: true }],
      media: [{ id: "media-1", dayNumber: null, mediaScope: "week", bucketId: "pregnancy-content", objectPath: "weeks/2/hero.jpg", mediaRole: "hero", altText: "주차 대표 이미지", sourceFileName: "week2-hero.jpg", displayOrder: 1 }],
    } as any);

  const detail = await adapter.getWeek(2);

  expect(detail?.id).toBe("week-2");
  expect(listSpy).toHaveBeenCalledWith(2);
});
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm --filter @gynecology-chatbot/web exec jest src/lib/db/repositories/week-content-repository.test.ts src/lib/admin/adapters/supabase-admin-content-port.test.ts --runInBand`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/lib/db/repositories/week-content-repository.ts apps/web/src/lib/db/repositories/week-content-repository.test.ts apps/web/src/lib/admin/adapters/supabase-admin-content-port.ts apps/web/src/lib/admin/adapters/supabase-admin-content-port.test.ts
git commit -m "refactor: route week content through drizzle repository"
```

---

### Task 3: local-postgres shadow를 canonical 5개 기준으로 축소

**Files:**
- Modify: `apps/web/src/lib/mobile/local-postgres-schema.ts:13-320`
- Modify: `apps/web/src/lib/mobile/local-postgres.ts:62-900`
- Modify: `apps/web/src/lib/mobile/local-postgres-schema.test.ts:1-23`
- Modify: `apps/web/src/lib/mobile/local-postgres.test.ts:1-121`

- [ ] **Step 1: Write the failing schema regression test**

```ts
import { buildLocalPostgresBootstrapSql } from "./local-postgres-schema";

describe("buildLocalPostgresBootstrapSql", () => {
  test("does not create legacy week tables", () => {
    const sql = buildLocalPostgresBootstrapSql("gynecology_local");

    expect(sql).not.toContain('"gynecology_local"."pregnancy_weeks"');
    expect(sql).not.toContain('"gynecology_local"."pregnancy_week_sections"');
    expect(sql).not.toContain('"gynecology_local"."pregnancy_week_assets"');
  });

  test("creates canonical day/media tables", () => {
    const sql = buildLocalPostgresBootstrapSql("gynecology_local");

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "gynecology_local"."pregnancy_day_contents"');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "gynecology_local"."pregnancy_week_media"');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @gynecology-chatbot/web exec jest src/lib/mobile/local-postgres-schema.test.ts src/lib/mobile/local-postgres.test.ts --runInBand`
Expected: FAIL because legacy table SQL still exists

- [ ] **Step 3: Remove legacy local tables from bootstrap schema**

```ts
export function buildLocalPostgresBootstrapSql(schema: string) {
  return `
    CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "pregnancy_week_data")} (
      id text PRIMARY KEY,
      week_number integer NOT NULL UNIQUE,
      title text,
      baby_size_label text,
      baby_size_compare_object text,
      baby_summary text,
      mother_summary text,
      warning_signs text,
      recommended_actions text,
      checklist_intro text,
      question_intro text,
      status text NOT NULL DEFAULT 'draft',
      updated_at timestamptz NOT NULL DEFAULT now(),
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "pregnancy_day_contents")} (
      id text PRIMARY KEY,
      week_data_id text NOT NULL REFERENCES ${getQualifiedTable(schema, "pregnancy_week_data")}(id) ON DELETE CASCADE,
      day_number integer NOT NULL,
      title text,
      baby_development_payload jsonb NOT NULL DEFAULT '{"items":[]}'::jsonb,
      baby_message text,
      mother_changes_payload jsonb NOT NULL DEFAULT '{"items":[]}'::jsonb,
      display_order integer NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "pregnancy_week_media")} (
      id text PRIMARY KEY,
      week_data_id text NOT NULL REFERENCES ${getQualifiedTable(schema, "pregnancy_week_data")}(id) ON DELETE CASCADE,
      day_content_id text REFERENCES ${getQualifiedTable(schema, "pregnancy_day_contents")}(id) ON DELETE CASCADE,
      day_number integer,
      media_scope text NOT NULL DEFAULT 'week',
      bucket_id text NOT NULL,
      object_path text NOT NULL,
      media_role text NOT NULL DEFAULT 'reference',
      alt_text text,
      source_file_name text,
      display_order integer NOT NULL DEFAULT 0
    );
  `;
}
```

- [ ] **Step 4: Remove legacy tables from local bootstrap/seed code**

```ts
const LOCAL_TABLES = new Set([
  "users",
  "pregnancy_profiles",
  "auth_sessions",
  "phone_verification_requests",
  "allowed_phone_numbers",
  "calendar_logs",
  "chat_sessions",
  "chat_messages",
  "knowledge_items",
  "pregnancy_documents",
  "pregnancy_week_data",
  "pregnancy_day_contents",
  "pregnancy_week_media",
  "week_checklists",
  "week_questions",
  "user_checklist_events",
  "user_question_events",
  "admin_audit_logs",
  "user_action_logs",
  "workflow_definitions",
  "system_config",
]);
```

```ts
await db.query(
  `
    INSERT INTO ${getQualifiedTable("pregnancy_week_data")} (
      id,
      week_number,
      title,
      baby_size_label,
      baby_size_compare_object,
      baby_summary,
      mother_summary,
      warning_signs,
      recommended_actions,
      checklist_intro,
      question_intro,
      status,
      updated_at,
      created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'published', $12, $12)
    ON CONFLICT (week_number) DO UPDATE
      SET title = EXCLUDED.title,
          baby_size_label = EXCLUDED.baby_size_label,
          baby_size_compare_object = EXCLUDED.baby_size_compare_object,
          baby_summary = EXCLUDED.baby_summary,
          mother_summary = EXCLUDED.mother_summary,
          warning_signs = EXCLUDED.warning_signs,
          recommended_actions = EXCLUDED.recommended_actions,
          checklist_intro = EXCLUDED.checklist_intro,
          question_intro = EXCLUDED.question_intro,
          updated_at = EXCLUDED.updated_at
  `,
  [
    `week-${weekNumber}`,
    weekNumber,
    `${weekNumber}주차`,
    fruit,
    fruit,
    `${weekNumber}주차 아기 요약`,
    `${weekNumber}주차 엄마 요약`,
    `${weekNumber}주차 위험 신호`,
    `${weekNumber}주차 권장 행동`,
    "오늘 체크해보면 좋아요.",
    "지금 마음을 가볍게 적어보세요.",
    now.toISOString(),
  ],
);
```

- [ ] **Step 5: Update local-postgres test to assert canonical-only seed path**

```ts
test("seeds canonical week data without legacy week inserts", async () => {
  const queryMock = jest.fn().mockResolvedValue({ rows: [] });

  jest.doMock("pg", () => ({
    Pool: jest.fn().mockImplementation(() => ({ query: queryMock })),
    types: { setTypeParser: jest.fn() },
  }));

  const { ensureLocalPostgresReady } = await import("./local-postgres");

  await ensureLocalPostgresReady();

  const queries = queryMock.mock.calls.map(([sql]) => String(sql));
  expect(
    queries.some((sql) => sql.includes('INSERT INTO "gynecology_local"."pregnancy_weeks"')),
  ).toBe(false);
  expect(
    queries.some((sql) => sql.includes('INSERT INTO "gynecology_local"."pregnancy_week_data"')),
  ).toBe(true);
});
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm --filter @gynecology-chatbot/web exec jest src/lib/mobile/local-postgres-schema.test.ts src/lib/mobile/local-postgres.test.ts --runInBand`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/lib/mobile/local-postgres-schema.ts apps/web/src/lib/mobile/local-postgres.ts apps/web/src/lib/mobile/local-postgres-schema.test.ts apps/web/src/lib/mobile/local-postgres.test.ts
git commit -m "refactor: align local postgres with canonical week schema"
```

---

### Task 4: legacy Supabase 객체와 기준 문서 정리

**Files:**
- Create: `supabase/migrations/20260331_drop_legacy_week_tables.sql`
- Modify: `docs/reference/DATABASE_SCHEMA.md:119-154`

- [ ] **Step 1: Write the failing documentation expectation test**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("DATABASE_SCHEMA canonical week docs", () => {
  it("documents canonical week tables and not legacy week tables", () => {
    const doc = readFileSync(
      join(process.cwd(), "../../docs/reference/DATABASE_SCHEMA.md"),
      "utf8",
    );

    expect(doc).toContain("content.pregnancy_week_data");
    expect(doc).toContain("content.pregnancy_day_contents");
    expect(doc).toContain("content.week_checklists");
    expect(doc).toContain("content.week_questions");
    expect(doc).toContain("content.pregnancy_week_media");
    expect(doc).not.toContain("content.pregnancy_week_sections");
    expect(doc).not.toContain("content.pregnancy_week_assets");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @gynecology-chatbot/web exec jest src/lib/db/repositories/week-content-repository.test.ts --runInBand`
Expected: FAIL because `DATABASE_SCHEMA.md` still documents `content.pregnancy_weeks*`

- [ ] **Step 3: Add legacy drop migration**

```sql
DROP TABLE IF EXISTS content.pregnancy_week_assets;
DROP TABLE IF EXISTS content.pregnancy_week_sections;
DROP TABLE IF EXISTS content.pregnancy_weeks;
```

- [ ] **Step 4: Rewrite the database reference document**

```md
### `content.pregnancy_week_data`
- 목적: 주차별 대표 요약과 화면 헤더 데이터의 canonical 루트
- 주요 컬럼:
  - `id`
  - `week_number`
  - `title`
  - `baby_size_label`
  - `baby_size_compare_object`
  - `baby_summary`
  - `mother_summary`
  - `warning_signs`
  - `recommended_actions`
  - `checklist_intro`
  - `question_intro`
  - `status`

### `content.pregnancy_day_contents`
- 목적: 주차 하위 1~7일 세부 본문

### `content.week_checklists`
- 목적: 주차/일차별 체크리스트

### `content.week_questions`
- 목적: 주차/일차별 질문 카드

### `content.pregnancy_week_media`
- 목적: 주차/일차 대표 이미지 및 부가 미디어

## 4. public read model
- `v_pregnancy_week_data`
- `v_pregnancy_day_contents`
- `v_week_checklists`
- `v_week_questions`
- `published_pregnancy_weeks`
```

- [ ] **Step 5: Run verification commands**

Run: `pnpm --filter @gynecology-chatbot/web exec jest src/lib/db/repositories/week-content-repository.test.ts --runInBand && pnpm type-check`
Expected: PASS, then monorepo type-check PASS

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260331_drop_legacy_week_tables.sql docs/reference/DATABASE_SCHEMA.md
git commit -m "docs: promote canonical week schema and drop legacy tables"
```

---

## Self-Review

### Spec coverage
- canonical 5개를 ORM 기준으로 재정의 — Task 1
- admin week CRUD를 canonical 관계로 집중화 — Task 2
- local-postgres 구형 복제 구조 제거 — Task 3
- legacy Supabase 객체 제거 + 기준 문서 갱신 — Task 4

### Placeholder scan
- `TODO`, `TBD`, “적절한 처리” 같은 문구 없음
- 각 task에 파일 경로, 코드 블록, 실행 명령, 기대 결과 포함

### Type consistency
- canonical 엔티티 이름은 전 task에서 동일하게 `pregnancyWeekData`, `pregnancyDayContents`, `weekChecklists`, `weekQuestions`, `pregnancyWeekMedia`로 유지
- local-postgres도 같은 canonical 집합만 남기도록 계획됨

---

Plan complete and saved to `docs/superpowers/plans/2026-03-31-canonical-week-orm-reset.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**