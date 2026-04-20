function assertIdentifier(value: string) {
  if (!/^[a-z_][a-z0-9_]*$/i.test(value)) {
    throw new Error(`Invalid SQL identifier: ${value}`);
  }

  return `"${value}"`;
}

function getQualifiedTable(schema: string, table: string) {
  return `${assertIdentifier(schema)}.${assertIdentifier(table)}`;
}

export function buildLocalPostgresBootstrapSql(schema: string) {
  return `
        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "users")} (
          id text PRIMARY KEY,
          role text NOT NULL DEFAULT 'user',
          phone_number_encrypted text NOT NULL,
          phone_number_blind_index text NOT NULL UNIQUE,
          phone_number_last4 text NOT NULL,
          account_status text NOT NULL DEFAULT 'active',
          phone_verified_at timestamptz,
          last_login_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "chat_sessions")} (
          id text PRIMARY KEY,
          user_id text NOT NULL REFERENCES ${getQualifiedTable(schema, "users")}(id) ON DELETE CASCADE,
          title text NOT NULL,
          status text NOT NULL DEFAULT 'active',
          last_message_at timestamptz,
          memory_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "pregnancy_profiles")} (
          id text PRIMARY KEY,
          user_id text NOT NULL UNIQUE REFERENCES ${getQualifiedTable(schema, "users")}(id) ON DELETE CASCADE,
          display_name text,
          pregnancy_status text NOT NULL DEFAULT 'pregnant',
          pregnancy_day_count integer NOT NULL DEFAULT 0,
          pregnancy_week integer,
          pregnancy_day_in_week integer,
          due_date date,
          onboarding_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
          baby_sex text CHECK (baby_sex IN ('male', 'female', 'unknown') OR baby_sex IS NULL),
          baby_nickname text,
          theme_key text,
          notification_time time,
          notification_enabled boolean NOT NULL DEFAULT true,
          week_override integer,
          day_override integer,
          push_token text,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "auth_sessions")} (
          id text PRIMARY KEY,
          user_id text NOT NULL REFERENCES ${getQualifiedTable(schema, "users")}(id) ON DELETE CASCADE,
          refresh_token_hash text NOT NULL,
          device_label text,
          last_used_at timestamptz NOT NULL DEFAULT now(),
          expires_at timestamptz NOT NULL,
          revoked_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "phone_verification_requests")} (
          id text PRIMARY KEY,
          phone_number_encrypted text NOT NULL,
          phone_number_blind_index text NOT NULL,
          phone_number_last4 text NOT NULL,
          verification_sid text,
          channel text NOT NULL DEFAULT 'sms',
          status text NOT NULL DEFAULT 'pending',
          attempt_count integer NOT NULL DEFAULT 0,
          expires_at timestamptz NOT NULL,
          verified_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "blocked_phone_numbers")} (
          id text PRIMARY KEY,
          phone_number_encrypted text NOT NULL,
          phone_number_blind_index text NOT NULL UNIQUE,
          phone_number_last4 text NOT NULL,
          display_name text,
          note text,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "chat_messages")} (
          id text PRIMARY KEY,
          session_id text NOT NULL REFERENCES ${getQualifiedTable(schema, "chat_sessions")}(id) ON DELETE CASCADE,
          user_id text NOT NULL REFERENCES ${getQualifiedTable(schema, "users")}(id) ON DELETE CASCADE,
          role text NOT NULL,
          parts jsonb NOT NULL DEFAULT '[]'::jsonb,
          plain_text text,
          image_attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
          model_name text,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "calendar_logs")} (
          id text PRIMARY KEY,
          user_id text NOT NULL REFERENCES ${getQualifiedTable(schema, "users")}(id) ON DELETE CASCADE,
          session_id text REFERENCES ${getQualifiedTable(schema, "chat_sessions")}(id) ON DELETE SET NULL,
          date date NOT NULL,
          entry_type text NOT NULL DEFAULT 'ai_summary',
          title text NOT NULL DEFAULT '기록',
          summary text,
          payload jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "content_knowledge_items")} (
          id text PRIMARY KEY,
          title text NOT NULL,
          section text NOT NULL,
          body text NOT NULL,
          status text NOT NULL DEFAULT 'published',
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "workflow_definitions")} (
          id text PRIMARY KEY,
          name text NOT NULL,
          slug text NOT NULL UNIQUE,
          provider text NOT NULL DEFAULT 'flowise',
          status text NOT NULL DEFAULT 'draft',
          is_active boolean NOT NULL DEFAULT false,
          config jsonb NOT NULL DEFAULT '{}'::jsonb,
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
          updated_at timestamptz NOT NULL DEFAULT now(),
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "system_config")} (
          key varchar(100) PRIMARY KEY,
          value jsonb NOT NULL DEFAULT '{}'::jsonb,
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "content_rag_files")} (
          id text PRIMARY KEY,
          filename text NOT NULL,
          storage_path text NOT NULL,
          schift_bucket text NOT NULL DEFAULT 'pregnancy-knowledge',
          file_size integer NOT NULL DEFAULT 0,
          mime_type text NOT NULL DEFAULT 'application/octet-stream',
          status text NOT NULL DEFAULT 'processing'
            CHECK (status IN ('processing', 'ready', 'failed')),
          enabled boolean NOT NULL DEFAULT true,
          error_message text,
          uploaded_by text,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "content_pregnancy_documents")} (
          id text PRIMARY KEY,
          title text NOT NULL,
          content text NOT NULL,
          pregnancy_week integer,
          category text NOT NULL,
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "pregnancy_weeks")} (
          id text PRIMARY KEY,
          week_number integer NOT NULL,
          title text,
          baby_size_label text,
          baby_size_compare_object text,
          baby_summary text,
          mother_summary text,
          hero_image_path text,
          compare_image_path text,
          status text NOT NULL DEFAULT 'draft',
          updated_at timestamptz NOT NULL DEFAULT now(),
          created_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE (week_number),
          CONSTRAINT pregnancy_weeks_week_number_range CHECK (week_number BETWEEN 1 AND 40),
          CONSTRAINT pregnancy_weeks_status_check CHECK (status IN ('draft', 'published', 'archived'))
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "content_pregnancy_week_data")} (
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
          created_at timestamptz NOT NULL DEFAULT now(),
          CONSTRAINT pregnancy_week_data_week_number_range CHECK (week_number BETWEEN 1 AND 40),
          CONSTRAINT pregnancy_week_data_status_check CHECK (status IN ('draft', 'published', 'archived'))
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "content_pregnancy_day_contents")} (
          id text PRIMARY KEY,
          week_data_id text NOT NULL REFERENCES ${getQualifiedTable(schema, "content_pregnancy_week_data")}(id) ON DELETE CASCADE,
          day_number integer NOT NULL,
          title text,
          baby_development_payload jsonb NOT NULL DEFAULT '{"items":[]}'::jsonb,
          baby_message text,
          mother_changes_payload jsonb NOT NULL DEFAULT '{"items":[]}'::jsonb,
          display_order integer NOT NULL DEFAULT 0,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE (week_data_id, day_number),
          CONSTRAINT pregnancy_day_contents_day_number_range CHECK (day_number BETWEEN 1 AND 7)
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "content_pregnancy_week_media")} (
          id text PRIMARY KEY,
          week_data_id text NOT NULL REFERENCES ${getQualifiedTable(schema, "content_pregnancy_week_data")}(id) ON DELETE CASCADE,
          day_content_id text REFERENCES ${getQualifiedTable(schema, "content_pregnancy_day_contents")}(id) ON DELETE CASCADE,
          day_number integer,
          media_scope text NOT NULL DEFAULT 'week',
          bucket_id text NOT NULL,
          object_path text NOT NULL,
          media_role text NOT NULL DEFAULT 'reference',
          alt_text text,
          source_file_name text,
          display_order integer NOT NULL DEFAULT 0,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE (week_data_id, object_path),
          CONSTRAINT pregnancy_week_media_day_number_range CHECK (day_number IS NULL OR day_number BETWEEN 1 AND 7),
          CONSTRAINT pregnancy_week_media_scope_check CHECK (media_scope IN ('week', 'day'))
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "content_week_checklists")} (
          id text PRIMARY KEY,
          week_data_id text NOT NULL REFERENCES ${getQualifiedTable(schema, "content_pregnancy_week_data")}(id) ON DELETE CASCADE,
          day_content_id text REFERENCES ${getQualifiedTable(schema, "content_pregnancy_day_contents")}(id) ON DELETE CASCADE,
          day_number integer,
          code text NOT NULL,
          title text NOT NULL,
          description text,
          checklist_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
          display_order integer NOT NULL DEFAULT 0,
          is_required boolean NOT NULL DEFAULT false,
          is_active boolean NOT NULL DEFAULT true,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE (week_data_id, day_number, code),
          CONSTRAINT week_checklists_day_number_range CHECK (day_number IS NULL OR day_number BETWEEN 1 AND 7)
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "content_week_questions")} (
          id text PRIMARY KEY,
          week_data_id text NOT NULL REFERENCES ${getQualifiedTable(schema, "content_pregnancy_week_data")}(id) ON DELETE CASCADE,
          day_content_id text REFERENCES ${getQualifiedTable(schema, "content_pregnancy_day_contents")}(id) ON DELETE CASCADE,
          day_number integer,
          code text NOT NULL,
          question_text text NOT NULL,
          question_type text NOT NULL DEFAULT 'text',
          help_text text,
          question_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
          display_order integer NOT NULL DEFAULT 0,
          is_required boolean NOT NULL DEFAULT false,
          is_active boolean NOT NULL DEFAULT true,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE (week_data_id, day_number, code),
          CONSTRAINT week_questions_day_number_range CHECK (day_number IS NULL OR day_number BETWEEN 1 AND 7)
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "content_paraphrase_runs")} (
          id text PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
          model text NOT NULL,
          prompt_version text NOT NULL,
          scope text NOT NULL CHECK (scope IN ('week', 'full', 'single_item')),
          target_week_number integer CHECK (target_week_number IS NULL OR target_week_number BETWEEN 1 AND 40),
          status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
          input_token_count integer,
          output_token_count integer,
          total_token_count integer,
          cost_usd numeric(10, 6),
          error_message text,
          created_at timestamptz NOT NULL DEFAULT now(),
          completed_at timestamptz
        );

        CREATE INDEX IF NOT EXISTS ${assertIdentifier(schema)}."idx_content_paraphrase_runs_target_week"
          ON ${getQualifiedTable(schema, "content_paraphrase_runs")} (target_week_number, created_at DESC);

        CREATE INDEX IF NOT EXISTS ${assertIdentifier(schema)}."idx_content_paraphrase_runs_status"
          ON ${getQualifiedTable(schema, "content_paraphrase_runs")} (status);

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "content_paraphrased_items")} (
          id text PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
          source_table text NOT NULL,
          source_id text,
          source_week_number integer NOT NULL CHECK (source_week_number BETWEEN 1 AND 40),
          source_day_number integer CHECK (source_day_number IS NULL OR source_day_number BETWEEN 1 AND 7),
          source_code text,
          source_hash text NOT NULL,
          run_id text REFERENCES ${getQualifiedTable(schema, "content_paraphrase_runs")}(id) ON DELETE SET NULL,
          content_scope text NOT NULL CHECK (content_scope IN ('week_summary', 'section', 'day_content', 'checklist', 'question')),
          category text NOT NULL CHECK (category IN ('overview', 'baby_development', 'mother_body', 'life_guide', 'caution', 'faq', 'reflection_question')),
          title text,
          summary text,
          body text,
          items jsonb NOT NULL DEFAULT '[]'::jsonb,
          status text NOT NULL DEFAULT 'needs_review' CHECK (status IN ('needs_review', 'ready', 'archived', 'failed')),
          review_note text,
          reviewed_by text REFERENCES ${getQualifiedTable(schema, "users")}(id) ON DELETE SET NULL,
          reviewed_at timestamptz,
          is_active boolean NOT NULL DEFAULT false,
          model text NOT NULL,
          prompt_version text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE INDEX IF NOT EXISTS ${assertIdentifier(schema)}."idx_content_paraphrased_items_week_category"
          ON ${getQualifiedTable(schema, "content_paraphrased_items")} (source_week_number, category, status);

        CREATE INDEX IF NOT EXISTS ${assertIdentifier(schema)}."idx_content_paraphrased_items_source_hash"
          ON ${getQualifiedTable(schema, "content_paraphrased_items")} (source_hash);

        CREATE UNIQUE INDEX IF NOT EXISTS ${assertIdentifier(schema)}."idx_content_paraphrased_items_active_source"
          ON ${getQualifiedTable(schema, "content_paraphrased_items")} (
            source_table,
            source_week_number,
            content_scope,
            category,
            COALESCE(source_day_number, 0),
            COALESCE(source_code, '')
          )
          WHERE is_active = true;

        CREATE OR REPLACE VIEW ${getQualifiedTable(schema, "v_weekly_encyclopedia")} AS
        SELECT
          source_week_number AS week_number,
          source_day_number AS day_number,
          source_code,
          content_scope,
          category,
          title,
          summary,
          body,
          items,
          updated_at
        FROM ${getQualifiedTable(schema, "content_paraphrased_items")}
        WHERE status = 'ready'
          AND is_active = true;

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "pregnancy_week_sections")} (
          id text PRIMARY KEY,
          week_id text NOT NULL REFERENCES ${getQualifiedTable(schema, "pregnancy_weeks")}(id) ON DELETE CASCADE,
          section_key text NOT NULL,
          title text,
          body text,
          display_order integer NOT NULL DEFAULT 0,
          is_required boolean NOT NULL DEFAULT false,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "pregnancy_week_assets")} (
          id text PRIMARY KEY,
          week_id text NOT NULL REFERENCES ${getQualifiedTable(schema, "pregnancy_weeks")}(id) ON DELETE CASCADE,
          asset_type text NOT NULL,
          storage_path text NOT NULL,
          alt_text text,
          style_key text,
          display_order integer NOT NULL DEFAULT 0,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "admin_audit_logs")} (
          id text PRIMARY KEY,
          admin_user_id text,
          target_user_id text,
          action_type text NOT NULL,
          entity_type text NOT NULL,
          reason text,
          before_payload jsonb,
          after_payload jsonb,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "user_action_logs")} (
          id text PRIMARY KEY,
          user_id text NOT NULL REFERENCES ${getQualifiedTable(schema, "users")}(id) ON DELETE CASCADE,
          session_id text REFERENCES ${getQualifiedTable(schema, "chat_sessions")}(id) ON DELETE SET NULL,
          message_id text REFERENCES ${getQualifiedTable(schema, "chat_messages")}(id) ON DELETE SET NULL,
          action_type text NOT NULL,
          payload jsonb NOT NULL DEFAULT '{}'::jsonb,
          occurred_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "user_persona_signals")} (
          id text PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
          user_id text NOT NULL REFERENCES ${getQualifiedTable(schema, "users")}(id) ON DELETE CASCADE,
          session_id text REFERENCES ${getQualifiedTable(schema, "chat_sessions")}(id) ON DELETE SET NULL,
          source_message_id text REFERENCES ${getQualifiedTable(schema, "chat_messages")}(id) ON DELETE SET NULL,
          persona_hint text NOT NULL CHECK (persona_hint IN ('anxious', 'positive', 'introverted', 'practical', 'unknown')),
          confidence text NOT NULL DEFAULT 'low' CHECK (confidence IN ('low', 'medium', 'high')),
          evidence text,
          weight numeric(6, 2) NOT NULL DEFAULT 1 CHECK (weight > 0),
          observed_at timestamptz NOT NULL DEFAULT now(),
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE OR REPLACE VIEW ${getQualifiedTable(schema, "v_chat_session_activity_dates")} AS
        SELECT
          cs.user_id,
          cm.session_id,
          ((cm.created_at AT TIME ZONE 'Asia/Seoul')::date) AS activity_date,
          MAX(cm.created_at) AS last_message_at
        FROM ${getQualifiedTable(schema, "chat_messages")} cm
        JOIN ${getQualifiedTable(schema, "chat_sessions")} cs
          ON cs.id = cm.session_id
        GROUP BY
          cs.user_id,
          cm.session_id,
          ((cm.created_at AT TIME ZONE 'Asia/Seoul')::date);

        CREATE OR REPLACE VIEW ${getQualifiedTable(schema, "v_user_persona_profiles")} AS
        WITH scored_signals AS (
          SELECT
            ups.user_id,
            ups.persona_hint,
            ups.evidence,
            ups.observed_at,
            ups.weight *
              CASE
                WHEN ups.observed_at >= now() - interval '7 days' THEN 1.0
                WHEN ups.observed_at >= now() - interval '30 days' THEN 0.7
                WHEN ups.observed_at >= now() - interval '90 days' THEN 0.4
                ELSE 0.2
              END AS recency_weighted_score
          FROM ${getQualifiedTable(schema, "user_persona_signals")} ups
          WHERE ups.persona_hint <> 'unknown'
        ),
        ranked_personas AS (
          SELECT
            ss.user_id,
            ss.persona_hint,
            SUM(ss.recency_weighted_score)::numeric(8, 2) AS weighted_score,
            MAX(ss.observed_at) AS last_observed_at,
            STRING_AGG(ss.evidence, ' / ' ORDER BY ss.observed_at DESC)
              FILTER (WHERE ss.evidence IS NOT NULL AND btrim(ss.evidence) <> '') AS evidence_summary,
            ROW_NUMBER() OVER (
              PARTITION BY ss.user_id
              ORDER BY SUM(ss.recency_weighted_score) DESC, MAX(ss.observed_at) DESC
            ) AS rank
          FROM scored_signals ss
          GROUP BY ss.user_id, ss.persona_hint
        )
        SELECT
          rp.user_id,
          rp.persona_hint,
          CASE
            WHEN rp.weighted_score >= 6 THEN 'high'
            WHEN rp.weighted_score >= 2 THEN 'medium'
            ELSE 'low'
          END AS confidence,
          rp.evidence_summary,
          rp.weighted_score,
          rp.last_observed_at
        FROM ranked_personas rp
        WHERE rp.rank = 1;

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "user_checklist_events")} (
          id text PRIMARY KEY,
          user_id text NOT NULL REFERENCES ${getQualifiedTable(schema, "users")}(id) ON DELETE CASCADE,
          checklist_id text NOT NULL REFERENCES ${getQualifiedTable(schema, "content_week_checklists")}(id) ON DELETE CASCADE,
          session_id text REFERENCES ${getQualifiedTable(schema, "chat_sessions")}(id) ON DELETE SET NULL,
          prompt_message_id text REFERENCES ${getQualifiedTable(schema, "chat_messages")}(id) ON DELETE SET NULL,
          completion_message_id text REFERENCES ${getQualifiedTable(schema, "chat_messages")}(id) ON DELETE SET NULL,
          status text NOT NULL DEFAULT 'sent',
          sent_at timestamptz,
          completed_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "user_question_events")} (
          id text PRIMARY KEY,
          user_id text NOT NULL REFERENCES ${getQualifiedTable(schema, "users")}(id) ON DELETE CASCADE,
          question_id text NOT NULL REFERENCES ${getQualifiedTable(schema, "content_week_questions")}(id) ON DELETE CASCADE,
          session_id text REFERENCES ${getQualifiedTable(schema, "chat_sessions")}(id) ON DELETE SET NULL,
          prompt_message_id text REFERENCES ${getQualifiedTable(schema, "chat_messages")}(id) ON DELETE SET NULL,
          answer_message_id text REFERENCES ${getQualifiedTable(schema, "chat_messages")}(id) ON DELETE SET NULL,
          status text NOT NULL DEFAULT 'sent',
          sent_at timestamptz,
          answered_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
      `;
}
