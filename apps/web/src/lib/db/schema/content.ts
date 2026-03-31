import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  jsonb,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const contentSchema = pgSchema("content");

const genRandomUuid = sql`gen_random_uuid()`;
const utcNow = sql`timezone('utc', now())`;

export const pregnancyWeekData = contentSchema.table(
  "pregnancy_week_data",
  {
    id: uuid("id").primaryKey().default(genRandomUuid),
    weekNumber: integer("week_number").notNull(),
    title: varchar("title", { length: 200 }),
    babySizeLabel: varchar("baby_size_label", { length: 120 }),
    babySizeCompareObject: varchar("baby_size_compare_object", {
      length: 120,
    }),
    babySummary: text("baby_summary"),
    motherSummary: text("mother_summary"),
    warningSigns: text("warning_signs"),
    recommendedActions: text("recommended_actions"),
    checklistIntro: text("checklist_intro"),
    questionIntro: text("question_intro"),
    status: text("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
  },
  (table) => ({
    weekNumberIdx: uniqueIndex("idx_pregnancy_week_data_week_number").on(
      table.weekNumber,
    ),
    weekRange: check(
      "pregnancy_week_data_week_number_range",
      sql`${table.weekNumber} BETWEEN 1 AND 40`,
    ),
    statusCheck: check(
      "pregnancy_week_data_status_check",
      sql`${table.status} IN ('draft', 'published', 'archived')`,
    ),
  }),
);

export const pregnancyDayContents = contentSchema.table(
  "pregnancy_day_contents",
  {
    id: uuid("id").primaryKey().default(genRandomUuid),
    weekDataId: uuid("week_data_id")
      .notNull()
      .references(() => pregnancyWeekData.id, { onDelete: "cascade" }),
    dayNumber: integer("day_number").notNull(),
    title: varchar("title", { length: 120 }),
    babyDevelopmentPayload: jsonb("baby_development_payload")
      .notNull()
      .default(sql`'{"items":[]}'::jsonb`),
    babyMessage: text("baby_message"),
    motherChangesPayload: jsonb("mother_changes_payload")
      .notNull()
      .default(sql`'{"items":[]}'::jsonb`),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
  },
  (table) => ({
    weekDayIdx: uniqueIndex("idx_pregnancy_day_contents_week_day").on(
      table.weekDataId,
      table.dayNumber,
    ),
    dayRange: check(
      "pregnancy_day_contents_day_number_range",
      sql`${table.dayNumber} BETWEEN 1 AND 7`,
    ),
  }),
);

export const pregnancyWeekMedia = contentSchema.table(
  "pregnancy_week_media",
  {
    id: uuid("id").primaryKey().default(genRandomUuid),
    weekDataId: uuid("week_data_id")
      .notNull()
      .references(() => pregnancyWeekData.id, { onDelete: "cascade" }),
    dayContentId: uuid("day_content_id").references(
      () => pregnancyDayContents.id,
      {
        onDelete: "cascade",
      },
    ),
    dayNumber: integer("day_number"),
    mediaScope: varchar("media_scope", { length: 40 })
      .notNull()
      .default("week"),
    bucketId: varchar("bucket_id", { length: 120 }).notNull(),
    objectPath: text("object_path").notNull(),
    mediaRole: varchar("media_role", { length: 80 })
      .notNull()
      .default("reference"),
    altText: text("alt_text"),
    sourceFileName: varchar("source_file_name", { length: 255 }),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
  },
  (table) => ({
    objectIdx: uniqueIndex("idx_pregnancy_week_media_object").on(
      table.weekDataId,
      table.objectPath,
    ),
    dayRange: check(
      "pregnancy_week_media_day_number_range",
      sql`${table.dayNumber} IS NULL OR ${table.dayNumber} BETWEEN 1 AND 7`,
    ),
    scopeCheck: check(
      "pregnancy_week_media_scope_check",
      sql`${table.mediaScope} IN ('week', 'day')`,
    ),
  }),
);

export const weekChecklists = contentSchema.table(
  "week_checklists",
  {
    id: uuid("id").primaryKey().default(genRandomUuid),
    weekDataId: uuid("week_data_id")
      .notNull()
      .references(() => pregnancyWeekData.id, { onDelete: "cascade" }),
    dayContentId: uuid("day_content_id").references(
      () => pregnancyDayContents.id,
      {
        onDelete: "cascade",
      },
    ),
    dayNumber: integer("day_number"),
    code: varchar("code", { length: 120 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    checklistPayload: jsonb("checklist_payload")
      .notNull()
      .default(sql`'{}'::jsonb`),
    displayOrder: integer("display_order").notNull().default(0),
    isRequired: boolean("is_required").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
  },
  (table) => ({
    weekCodeIdx: uniqueIndex("idx_week_checklists_week_code").on(
      table.weekDataId,
      table.dayNumber,
      table.code,
    ),
    dayRange: check(
      "week_checklists_day_number_range",
      sql`${table.dayNumber} IS NULL OR ${table.dayNumber} BETWEEN 1 AND 7`,
    ),
  }),
);

export const weekQuestions = contentSchema.table(
  "week_questions",
  {
    id: uuid("id").primaryKey().default(genRandomUuid),
    weekDataId: uuid("week_data_id")
      .notNull()
      .references(() => pregnancyWeekData.id, { onDelete: "cascade" }),
    dayContentId: uuid("day_content_id").references(
      () => pregnancyDayContents.id,
      {
        onDelete: "cascade",
      },
    ),
    dayNumber: integer("day_number"),
    code: varchar("code", { length: 120 }).notNull(),
    questionText: text("question_text").notNull(),
    questionType: text("question_type").notNull().default("text"),
    helpText: text("help_text"),
    questionPayload: jsonb("question_payload")
      .notNull()
      .default(sql`'{}'::jsonb`),
    displayOrder: integer("display_order").notNull().default(0),
    isRequired: boolean("is_required").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
  },
  (table) => ({
    weekCodeIdx: uniqueIndex("idx_week_questions_week_code").on(
      table.weekDataId,
      table.dayNumber,
      table.code,
    ),
    questionTypeCheck: check(
      "week_questions_question_type_check",
      sql`${table.questionType} IN ('text', 'single_choice', 'multi_choice', 'yes_no', 'number')`,
    ),
    dayRange: check(
      "week_questions_day_number_range",
      sql`${table.dayNumber} IS NULL OR ${table.dayNumber} BETWEEN 1 AND 7`,
    ),
  }),
);
