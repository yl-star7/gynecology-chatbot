import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

const genRandomUuid = sql`gen_random_uuid()`;
const utcNow = sql`timezone('utc', now())`;

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(genRandomUuid),
});

export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").primaryKey().default(genRandomUuid),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().default(genRandomUuid),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => chatSessions.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: uuid("id").primaryKey().default(genRandomUuid),
  adminUserId: uuid("admin_user_id"),
  targetUserId: uuid("target_user_id"),
  actionType: text("action_type").notNull(),
  entityType: text("entity_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(utcNow),
});

export const userChecklistEvents = pgTable("user_checklist_events", {
  id: uuid("id").primaryKey().default(genRandomUuid),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  checklistId: uuid("checklist_id").notNull(),
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
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(utcNow),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(utcNow),
});

export const userQuestionEvents = pgTable("user_question_events", {
  id: uuid("id").primaryKey().default(genRandomUuid),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  questionId: uuid("question_id").notNull(),
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
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(utcNow),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(utcNow),
});
