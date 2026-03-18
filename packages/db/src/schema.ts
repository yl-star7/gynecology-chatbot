import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgSchema,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const authSchema = pgSchema("auth");
export const publicSchema = pgSchema("public");

export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

export const users = publicSchema.table(
  "users",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("user"),
    phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
    displayName: varchar("display_name", { length: 100 }).notNull(),
    accountStatus: text("account_status").notNull().default("active"),
    passwordHash: text("password_hash"),
    passwordSetAt: timestamp("password_set_at", { withTimezone: true }),
    phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    phoneNumberIdx: uniqueIndex("idx_users_phone_number").on(table.phoneNumber),
  }),
);

export const pregnancyProfiles = publicSchema.table(
  "pregnancy_profiles",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    userUniqueIdx: uniqueIndex("idx_pregnancy_profiles_user_id").on(
      table.userId,
    ),
  }),
);

export const chatSessions = publicSchema.table(
  "chat_sessions",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    status: text("status").notNull().default("active"),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    userLastMessageIdx: index("idx_chat_sessions_user_last_message").on(
      table.userId,
      table.lastMessageAt,
    ),
  }),
);

export const chatMessages = publicSchema.table(
  "chat_messages",
  {
    id: uuid("id").primaryKey(),
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
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
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
  }),
);

export const pregnancyWeeks = publicSchema.table(
  "pregnancy_weeks",
  {
    id: uuid("id").primaryKey(),
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
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    weekNumberIdx: uniqueIndex("idx_pregnancy_weeks_week_number").on(
      table.weekNumber,
    ),
    weekRange: check(
      "pregnancy_weeks_week_number_range",
      sql`${table.weekNumber} BETWEEN 1 AND 40`,
    ),
  }),
);

export const pregnancyWeekSections = publicSchema.table(
  "pregnancy_week_sections",
  {
    id: uuid("id").primaryKey(),
    weekId: uuid("week_id")
      .notNull()
      .references(() => pregnancyWeeks.id, { onDelete: "cascade" }),
    sectionKey: varchar("section_key", { length: 120 }).notNull(),
    title: varchar("title", { length: 200 }),
    body: text("body"),
    displayOrder: integer("display_order").notNull().default(0),
    isRequired: boolean("is_required").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
);

export const pregnancyWeekAssets = publicSchema.table("pregnancy_week_assets", {
  id: uuid("id").primaryKey(),
  weekId: uuid("week_id")
    .notNull()
    .references(() => pregnancyWeeks.id, { onDelete: "cascade" }),
  assetType: varchar("asset_type", { length: 80 }).notNull(),
  storagePath: text("storage_path").notNull(),
  altText: text("alt_text"),
  styleKey: varchar("style_key", { length: 80 }),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const adminAuditLogs = publicSchema.table("admin_audit_logs", {
  id: uuid("id").primaryKey(),
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const userActionLogs = publicSchema.table(
  "user_action_logs",
  {
    id: uuid("id").primaryKey(),
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
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
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
  }),
);
