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
          display_name text NOT NULL,
          phone_number text NOT NULL UNIQUE,
          account_status text NOT NULL DEFAULT 'active',
          password_hash text,
          password_set_at timestamptz,
          phone_verified_at timestamptz,
          last_login_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "chat_sessions")} (
          id text PRIMARY KEY,
          user_id text NOT NULL REFERENCES ${getQualifiedTable(schema, "users")}(id) ON DELETE CASCADE,
          title text NOT NULL,
          status text NOT NULL DEFAULT 'active',
          last_message_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "pregnancy_profiles")} (
          id text PRIMARY KEY,
          user_id text NOT NULL UNIQUE REFERENCES ${getQualifiedTable(schema, "users")}(id) ON DELETE CASCADE,
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
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "emotion_logs")} (
          id text PRIMARY KEY,
          user_id text NOT NULL REFERENCES ${getQualifiedTable(schema, "users")}(id) ON DELETE CASCADE,
          date date NOT NULL,
          emotion_tone text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
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

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "knowledge_items")} (
          id text PRIMARY KEY,
          title text NOT NULL,
          section text NOT NULL,
          body text NOT NULL,
          status text NOT NULL DEFAULT 'published',
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable(schema, "pregnancy_documents")} (
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
      `;
}
