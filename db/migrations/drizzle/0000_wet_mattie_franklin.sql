CREATE SCHEMA "auth";
--> statement-breakpoint
CREATE TABLE "admin_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"target_user_id" uuid,
	"action_type" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"reason" text NOT NULL,
	"before_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"after_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
	CONSTRAINT "admin_audit_logs_action_type_check" CHECK ("admin_audit_logs"."action_type" IN ('phone_change', 'login_id_change', 'password_reset', 'content_update', 'knowledge_publish'))
);
--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"id" uuid PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"message_id" uuid,
	"date" date NOT NULL,
	"entry_type" text NOT NULL,
	"title" varchar(200) NOT NULL,
	"summary" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
	CONSTRAINT "calendar_logs_entry_type_check" CHECK ("calendar_logs"."entry_type" IN ('chat_saved', 'symptom_note', 'ai_summary', 'emotion_checkin'))
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"parts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"plain_text" text DEFAULT '' NOT NULL,
	"image_attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"model_name" varchar(100),
	"created_at" timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
	CONSTRAINT "chat_messages_role_check" CHECK ("chat_messages"."role" IN ('user', 'assistant', 'system'))
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(200) DEFAULT '새 대화' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"last_message_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
	CONSTRAINT "chat_sessions_status_check" CHECK ("chat_sessions"."status" IN ('active', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "emotion_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"emotion_tone" text NOT NULL,
	"note" text,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
	CONSTRAINT "emotion_logs_tone_check" CHECK ("emotion_logs"."emotion_tone" IN ('calm', 'joyful', 'anxious', 'tired', 'sad')),
	CONSTRAINT "emotion_logs_source_check" CHECK ("emotion_logs"."source" IN ('manual', 'chat_inferred', 'survey'))
);
--> statement-breakpoint
CREATE TABLE "knowledge_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"section" text NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text NOT NULL,
	"card_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
	CONSTRAINT "knowledge_items_section_check" CHECK ("knowledge_items"."section" IN ('knowledge', 'notebook')),
	CONSTRAINT "knowledge_items_status_check" CHECK ("knowledge_items"."status" IN ('draft', 'published', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "message_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"knowledge_item_id" uuid NOT NULL,
	"target_section" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
	CONSTRAINT "message_links_target_section_check" CHECK ("message_links"."target_section" IN ('knowledge', 'notebook'))
);
--> statement-breakpoint
CREATE TABLE "pregnancy_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(500) NOT NULL,
	"content" text NOT NULL,
	"pregnancy_week" integer,
	"category" varchar(100) NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pregnancy_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pregnancy_status" text NOT NULL,
	"pregnancy_day_count" integer DEFAULT 0 NOT NULL,
	"pregnancy_week" integer,
	"pregnancy_day_in_week" integer,
	"due_date" date,
	"onboarding_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"baby_sex" text,
	"baby_nickname" varchar(80),
	"theme_key" varchar(40),
	"notification_time" time,
	"notification_enabled" boolean DEFAULT true NOT NULL,
	"week_override" integer,
	"day_override" integer,
	"created_at" timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
	CONSTRAINT "pregnancy_profiles_status_check" CHECK ("pregnancy_profiles"."pregnancy_status" IN ('pregnant', 'trying', 'general')),
	CONSTRAINT "pregnancy_profiles_baby_sex_check" CHECK ("pregnancy_profiles"."baby_sex" IS NULL OR "pregnancy_profiles"."baby_sex" IN ('male', 'female', 'unknown'))
);
--> statement-breakpoint
CREATE TABLE "pregnancy_week_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_id" uuid NOT NULL,
	"asset_type" varchar(80) NOT NULL,
	"storage_path" text NOT NULL,
	"alt_text" text,
	"style_key" varchar(80),
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pregnancy_week_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_id" uuid NOT NULL,
	"section_key" varchar(120) NOT NULL,
	"title" varchar(200),
	"body" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pregnancy_weeks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_number" integer NOT NULL,
	"title" varchar(200),
	"baby_size_label" varchar(120),
	"baby_size_compare_object" varchar(120),
	"baby_summary" text,
	"mother_summary" text,
	"hero_image_path" text,
	"compare_image_path" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
	CONSTRAINT "pregnancy_weeks_week_number_range" CHECK ("pregnancy_weeks"."week_number" BETWEEN 1 AND 40),
	CONSTRAINT "pregnancy_weeks_status_check" CHECK ("pregnancy_weeks"."status" IN ('draft', 'published', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "user_action_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid,
	"message_id" uuid,
	"action_type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
	CONSTRAINT "user_action_logs_action_type_check" CHECK ("user_action_logs"."action_type" IN ('login_succeeded', 'phone_verification_started', 'phone_verified', 'password_set', 'password_reset_requested', 'onboarding_completed', 'profile_updated', 'chat_message_sent'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"account_status" text DEFAULT 'active' NOT NULL,
	"password_hash" text,
	"password_set_at" timestamp with time zone,
	"phone_verified_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
	CONSTRAINT "users_role_check" CHECK ("users"."role" IN ('user', 'admin', 'super_admin')),
	CONSTRAINT "users_account_status_check" CHECK ("users"."account_status" IN ('active', 'paused', 'deleted', 'pending_recovery'))
);
--> statement-breakpoint
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_logs" ADD CONSTRAINT "calendar_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_logs" ADD CONSTRAINT "calendar_logs_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_logs" ADD CONSTRAINT "calendar_logs_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emotion_logs" ADD CONSTRAINT "emotion_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_links" ADD CONSTRAINT "message_links_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_links" ADD CONSTRAINT "message_links_knowledge_item_id_knowledge_items_id_fk" FOREIGN KEY ("knowledge_item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pregnancy_profiles" ADD CONSTRAINT "pregnancy_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pregnancy_week_assets" ADD CONSTRAINT "pregnancy_week_assets_week_id_pregnancy_weeks_id_fk" FOREIGN KEY ("week_id") REFERENCES "public"."pregnancy_weeks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pregnancy_week_sections" ADD CONSTRAINT "pregnancy_week_sections_week_id_pregnancy_weeks_id_fk" FOREIGN KEY ("week_id") REFERENCES "public"."pregnancy_weeks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_action_logs" ADD CONSTRAINT "user_action_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_action_logs" ADD CONSTRAINT "user_action_logs_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_action_logs" ADD CONSTRAINT "user_action_logs_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_admin_audit_logs_admin_created" ON "admin_audit_logs" USING btree ("admin_user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_admin_audit_logs_target_created" ON "admin_audit_logs" USING btree ("target_user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_calendar_logs_user_date" ON "calendar_logs" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "idx_calendar_logs_session_date" ON "calendar_logs" USING btree ("session_id","date");--> statement-breakpoint
CREATE INDEX "idx_chat_messages_session_created" ON "chat_messages" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_chat_messages_user_created" ON "chat_messages" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_chat_sessions_user_last_message" ON "chat_sessions" USING btree ("user_id","last_message_at");--> statement-breakpoint
CREATE INDEX "idx_emotion_logs_user_date" ON "emotion_logs" USING btree ("user_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_items_slug_idx" ON "knowledge_items" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_knowledge_items_section_status" ON "knowledge_items" USING btree ("section","status");--> statement-breakpoint
CREATE INDEX "idx_message_links_message" ON "message_links" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "idx_pregnancy_documents_week" ON "pregnancy_documents" USING btree ("pregnancy_week");--> statement-breakpoint
CREATE INDEX "idx_pregnancy_documents_category" ON "pregnancy_documents" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_pregnancy_documents_embedding" ON "pregnancy_documents" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_pregnancy_profiles_user_id" ON "pregnancy_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_pregnancy_weeks_week_number" ON "pregnancy_weeks" USING btree ("week_number");--> statement-breakpoint
CREATE INDEX "idx_user_action_logs_user_occurred" ON "user_action_logs" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "idx_user_action_logs_action_occurred" ON "user_action_logs" USING btree ("action_type","occurred_at");--> statement-breakpoint
CREATE INDEX "idx_user_action_logs_session_occurred" ON "user_action_logs" USING btree ("session_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_users_phone_number" ON "users" USING btree ("phone_number");