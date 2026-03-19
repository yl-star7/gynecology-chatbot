import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  pgSchema,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const contentSchema = pgSchema("content");

const genRandomUuid = sql`gen_random_uuid()`;
const utcNow = sql`timezone('utc', now())`;

const vector = customType<{
  data: number[];
  driverData: string;
  config: { dimensions: number };
  configRequired: true;
}>({
  dataType(config) {
    return `vector(${config.dimensions})`;
  },
  toDriver(value) {
    return JSON.stringify(value);
  },
  fromDriver(value) {
    return JSON.parse(value);
  },
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    role: text("role").notNull().default("user"),
    phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
    accountStatus: text("account_status").notNull().default("active"),
    phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
  },
  (table) => ({
    phoneNumberIdx: uniqueIndex("idx_users_phone_number").on(table.phoneNumber),
    roleCheck: check(
      "users_role_check",
      sql`${table.role} IN ('user', 'admin', 'super_admin')`,
    ),
    accountStatusCheck: check(
      "users_account_status_check",
      sql`${table.accountStatus} IN ('active', 'paused', 'deleted', 'pending_recovery')`,
    ),
  }),
);

export const pregnancyProfiles = pgTable(
  "pregnancy_profiles",
  {
    id: uuid("id").primaryKey().default(genRandomUuid),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    displayName: varchar("display_name", { length: 100 }),
    pregnancyStatus: text("pregnancy_status").notNull(),
    pregnancyDayCount: integer("pregnancy_day_count").notNull().default(0),
    pregnancyWeek: integer("pregnancy_week"),
    pregnancyDayInWeek: integer("pregnancy_day_in_week"),
    dueDate: date("due_date"),
    onboardingPayload: jsonb("onboarding_payload")
      .notNull()
      .default(sql`'{}'::jsonb`),
    babySex: text("baby_sex"),
    babyNickname: varchar("baby_nickname", { length: 80 }),
    themeKey: varchar("theme_key", { length: 40 }),
    notificationTime: time("notification_time"),
    notificationEnabled: boolean("notification_enabled")
      .notNull()
      .default(true),
    weekOverride: integer("week_override"),
    dayOverride: integer("day_override"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
  },
  (table) => ({
    userUniqueIdx: uniqueIndex("idx_pregnancy_profiles_user_id").on(
      table.userId,
    ),
    pregnancyStatusCheck: check(
      "pregnancy_profiles_status_check",
      sql`${table.pregnancyStatus} IN ('pregnant', 'trying', 'general')`,
    ),
    babySexCheck: check(
      "pregnancy_profiles_baby_sex_check",
      sql`${table.babySex} IS NULL OR ${table.babySex} IN ('male', 'female', 'unknown')`,
    ),
  }),
);

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: uuid("id").primaryKey().default(genRandomUuid),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    refreshTokenHash: text("refresh_token_hash").notNull(),
    deviceLabel: varchar("device_label", { length: 120 }),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
  },
  (table) => ({
    userLastUsedIdx: index("idx_auth_sessions_user_last_used").on(
      table.userId,
      table.lastUsedAt,
    ),
    expiresAtIdx: index("idx_auth_sessions_expires_at").on(table.expiresAt),
  }),
);

export const phoneVerificationRequests = pgTable(
  "phone_verification_requests",
  {
    id: uuid("id").primaryKey().default(genRandomUuid),
    phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
    verificationSid: varchar("verification_sid", { length: 100 }),
    channel: text("channel").notNull().default("sms"),
    status: text("status").notNull().default("pending"),
    attemptCount: integer("attempt_count").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
  },
  (table) => ({
    phoneCreatedIdx: index("idx_phone_verification_requests_phone_created").on(
      table.phoneNumber,
      table.createdAt,
    ),
    statusCreatedIdx: index("idx_phone_verification_requests_status_created").on(
      table.status,
      table.createdAt,
    ),
    channelCheck: check(
      "phone_verification_requests_channel_check",
      sql`${table.channel} IN ('sms', 'voice', 'whatsapp')`,
    ),
    statusCheck: check(
      "phone_verification_requests_status_check",
      sql`${table.status} IN ('pending', 'approved', 'expired', 'canceled', 'failed')`,
    ),
  }),
);

export const allowedPhoneNumbers = pgTable(
  "allowed_phone_numbers",
  {
    id: uuid("id").primaryKey().default(genRandomUuid),
    phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
    displayName: varchar("display_name", { length: 100 }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
  },
  (table) => ({
    phoneNumberIdx: uniqueIndex("idx_allowed_phone_numbers_phone_number").on(
      table.phoneNumber,
    ),
  }),
);

export const chatSessions = pgTable(
  "chat_sessions",
  {
    id: uuid("id").primaryKey().default(genRandomUuid),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull().default("새 대화"),
    status: text("status").notNull().default("active"),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
  },
  (table) => ({
    userLastMessageIdx: index("idx_chat_sessions_user_last_message").on(
      table.userId,
      table.lastMessageAt,
    ),
    statusCheck: check(
      "chat_sessions_status_check",
      sql`${table.status} IN ('active', 'archived', 'deleted')`,
    ),
  }),
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().default(genRandomUuid),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => chatSessions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    parts: jsonb("parts")
      .notNull()
      .default(sql`'[]'::jsonb`),
    plainText: text("plain_text").notNull().default(""),
    imageAttachments: jsonb("image_attachments")
      .notNull()
      .default(sql`'[]'::jsonb`),
    modelName: varchar("model_name", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
  },
  (table) => ({
    sessionCreatedIdx: index("idx_chat_messages_session_created").on(
      table.sessionId,
      table.createdAt,
    ),
    userCreatedIdx: index("idx_chat_messages_user_created").on(
      table.userId,
      table.createdAt,
    ),
    roleCheck: check(
      "chat_messages_role_check",
      sql`${table.role} IN ('user', 'assistant', 'system')`,
    ),
  }),
);

export const calendarLogs = pgTable(
  "calendar_logs",
  {
    id: uuid("id").primaryKey().default(genRandomUuid),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => chatSessions.id, { onDelete: "cascade" }),
    messageId: uuid("message_id").references(() => chatMessages.id, {
      onDelete: "set null",
    }),
    date: date("date").notNull(),
    entryType: text("entry_type").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    summary: text("summary"),
    payload: jsonb("payload")
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
  },
  (table) => ({
    userDateIdx: index("idx_calendar_logs_user_date").on(table.userId, table.date),
    sessionDateIdx: index("idx_calendar_logs_session_date").on(
      table.sessionId,
      table.date,
    ),
    entryTypeCheck: check(
      "calendar_logs_entry_type_check",
      sql`${table.entryType} IN ('chat_saved', 'symptom_note', 'ai_summary', 'emotion_checkin')`,
    ),
  }),
);

export const knowledgeItems = contentSchema.table(
  "knowledge_items",
  {
    id: uuid("id").primaryKey().default(genRandomUuid),
    slug: varchar("slug", { length: 120 }).notNull(),
    section: text("section").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body").notNull(),
    cardPayload: jsonb("card_payload")
      .notNull()
      .default(sql`'{}'::jsonb`),
    status: text("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
  },
  (table) => ({
    slugIdx: uniqueIndex("knowledge_items_slug_idx").on(table.slug),
    sectionStatusIdx: index("idx_knowledge_items_section_status").on(
      table.section,
      table.status,
    ),
    sectionCheck: check(
      "knowledge_items_section_check",
      sql`${table.section} IN ('knowledge', 'notebook')`,
    ),
    statusCheck: check(
      "knowledge_items_status_check",
      sql`${table.status} IN ('draft', 'published', 'archived')`,
    ),
  }),
);

export const messageLinks = pgTable(
  "message_links",
  {
    id: uuid("id").primaryKey().default(genRandomUuid),
    messageId: uuid("message_id")
      .notNull()
      .references(() => chatMessages.id, { onDelete: "cascade" }),
    targetType: text("target_type").notNull(),
    targetId: uuid("target_id"),
    targetPath: text("target_path"),
    targetSection: text("target_section").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
  },
  (table) => ({
    messageIdx: index("idx_message_links_message").on(table.messageId),
    targetTypeIdx: index("idx_message_links_target_type").on(table.targetType),
    targetSectionCheck: check(
      "message_links_target_section_check",
      sql`${table.targetSection} IN ('knowledge', 'notebook')`,
    ),
    targetTypeCheck: check(
      "message_links_target_type_check",
      sql`${table.targetType} IN ('knowledge_item', 'pregnancy_week', 'pregnancy_document', 'week_data', 'week_checklist', 'week_question', 'external')`,
    ),
  }),
);

export const pregnancyDocuments = contentSchema.table(
  "pregnancy_documents",
  {
    id: uuid("id").primaryKey().default(genRandomUuid),
    title: varchar("title", { length: 500 }).notNull(),
    content: text("content").notNull(),
    pregnancyWeek: integer("pregnancy_week"),
    category: varchar("category", { length: 100 }).notNull(),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    metadata: jsonb("metadata")
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
  },
  (table) => ({
    weekIdx: index("idx_pregnancy_documents_week").on(table.pregnancyWeek),
    categoryIdx: index("idx_pregnancy_documents_category").on(table.category),
    embeddingIdx: index("idx_pregnancy_documents_embedding").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  }),
);

export const pregnancyWeeks = contentSchema.table(
  "pregnancy_weeks",
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
    heroImagePath: text("hero_image_path"),
    compareImagePath: text("compare_image_path"),
    status: text("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
  },
  (table) => ({
    weekNumberIdx: uniqueIndex("idx_pregnancy_weeks_week_number").on(
      table.weekNumber,
    ),
    weekRange: check(
      "pregnancy_weeks_week_number_range",
      sql`${table.weekNumber} BETWEEN 1 AND 40`,
    ),
    statusCheck: check(
      "pregnancy_weeks_status_check",
      sql`${table.status} IN ('draft', 'published', 'archived')`,
    ),
  }),
);

export const pregnancyWeekSections = contentSchema.table(
  "pregnancy_week_sections",
  {
    id: uuid("id").primaryKey().default(genRandomUuid),
    weekId: uuid("week_id")
      .notNull()
      .references(() => pregnancyWeeks.id, { onDelete: "cascade" }),
    sectionKey: varchar("section_key", { length: 120 }).notNull(),
    title: varchar("title", { length: 200 }),
    body: text("body"),
    displayOrder: integer("display_order").notNull().default(0),
    isRequired: boolean("is_required").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
  },
);

export const pregnancyWeekAssets = contentSchema.table("pregnancy_week_assets", {
  id: uuid("id").primaryKey().default(genRandomUuid),
  weekId: uuid("week_id")
    .notNull()
    .references(() => pregnancyWeeks.id, { onDelete: "cascade" }),
  assetType: varchar("asset_type", { length: 80 }).notNull(),
  storagePath: text("storage_path").notNull(),
  altText: text("alt_text"),
  styleKey: varchar("style_key", { length: 80 }),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(utcNow),
});

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
    displayIdx: index("idx_pregnancy_day_contents_display").on(
      table.weekDataId,
      table.displayOrder,
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
    dayContentId: uuid("day_content_id")
      .references(() => pregnancyDayContents.id, { onDelete: "cascade" }),
    dayNumber: integer("day_number"),
    mediaScope: varchar("media_scope", { length: 40 }).notNull().default("week"),
    bucketId: varchar("bucket_id", { length: 120 }).notNull(),
    objectPath: text("object_path").notNull(),
    mediaRole: varchar("media_role", { length: 80 }).notNull().default("reference"),
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
    displayIdx: index("idx_pregnancy_week_media_display").on(
      table.weekDataId,
      table.dayNumber,
      table.displayOrder,
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
    dayContentId: uuid("day_content_id").references(() => pregnancyDayContents.id, {
      onDelete: "cascade",
    }),
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
    weekDisplayIdx: index("idx_week_checklists_week_display").on(
      table.weekDataId,
      table.dayNumber,
      table.displayOrder,
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
    dayContentId: uuid("day_content_id").references(() => pregnancyDayContents.id, {
      onDelete: "cascade",
    }),
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
    weekDisplayIdx: index("idx_week_questions_week_display").on(
      table.weekDataId,
      table.dayNumber,
      table.displayOrder,
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

export const adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: uuid("id").primaryKey().default(genRandomUuid),
    adminUserId: uuid("admin_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetUserId: uuid("target_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    actionType: text("action_type").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    reason: text("reason").notNull(),
    beforePayload: jsonb("before_payload")
      .notNull()
      .default(sql`'{}'::jsonb`),
    afterPayload: jsonb("after_payload")
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
  },
  (table) => ({
    adminCreatedIdx: index("idx_admin_audit_logs_admin_created").on(
      table.adminUserId,
      table.createdAt,
    ),
    targetCreatedIdx: index("idx_admin_audit_logs_target_created").on(
      table.targetUserId,
      table.createdAt,
    ),
    actionTypeCheck: check(
      "admin_audit_logs_action_type_check",
      sql`${table.actionType} IN ('phone_change', 'login_id_change', 'session_reset', 'content_update', 'knowledge_publish')`,
    ),
  }),
);

export const userActionLogs = pgTable(
  "user_action_logs",
  {
    id: uuid("id").primaryKey().default(genRandomUuid),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id").references(() => chatSessions.id, {
      onDelete: "set null",
    }),
    messageId: uuid("message_id").references(() => chatMessages.id, {
      onDelete: "set null",
    }),
    actionType: text("action_type").notNull(),
    payload: jsonb("payload")
      .notNull()
      .default(sql`'{}'::jsonb`),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
  },
  (table) => ({
    userOccurredIdx: index("idx_user_action_logs_user_occurred").on(
      table.userId,
      table.occurredAt,
    ),
    actionOccurredIdx: index("idx_user_action_logs_action_occurred").on(
      table.actionType,
      table.occurredAt,
    ),
    sessionOccurredIdx: index("idx_user_action_logs_session_occurred").on(
      table.sessionId,
      table.occurredAt,
    ),
    actionTypeCheck: check(
      "user_action_logs_action_type_check",
      sql`${table.actionType} IN ('login_succeeded', 'phone_verification_started', 'phone_verified', 'onboarding_completed', 'profile_updated', 'chat_message_sent')`,
    ),
  }),
);

export const userChecklistEvents = pgTable(
  "user_checklist_events",
  {
    id: uuid("id").primaryKey().default(genRandomUuid),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    checklistId: uuid("checklist_id")
      .notNull()
      .references(() => weekChecklists.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id").references(() => chatSessions.id, {
      onDelete: "set null",
    }),
    promptMessageId: uuid("prompt_message_id").references(() => chatMessages.id, {
      onDelete: "set null",
    }),
    completionMessageId: uuid("completion_message_id").references(
      () => chatMessages.id,
      {
        onDelete: "set null",
      },
    ),
    status: text("status").notNull().default("sent"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
  },
  (table) => ({
    userChecklistIdx: index("idx_user_checklist_events_user_checklist").on(
      table.userId,
      table.checklistId,
    ),
    statusIdx: index("idx_user_checklist_events_status").on(table.status),
    statusCheck: check(
      "user_checklist_events_status_check",
      sql`${table.status} IN ('sent', 'opened', 'completed', 'skipped')`,
    ),
  }),
);

export const userQuestionEvents = pgTable(
  "user_question_events",
  {
    id: uuid("id").primaryKey().default(genRandomUuid),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => weekQuestions.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id").references(() => chatSessions.id, {
      onDelete: "set null",
    }),
    promptMessageId: uuid("prompt_message_id").references(() => chatMessages.id, {
      onDelete: "set null",
    }),
    answerMessageId: uuid("answer_message_id").references(() => chatMessages.id, {
      onDelete: "set null",
    }),
    status: text("status").notNull().default("sent"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    answeredAt: timestamp("answered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(utcNow),
  },
  (table) => ({
    userQuestionIdx: index("idx_user_question_events_user_question").on(
      table.userId,
      table.questionId,
    ),
    statusIdx: index("idx_user_question_events_status").on(table.status),
    statusCheck: check(
      "user_question_events_status_check",
      sql`${table.status} IN ('sent', 'opened', 'answered', 'skipped')`,
    ),
  }),
);
