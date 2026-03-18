import { randomBytes, randomUUID, scryptSync } from "crypto";
import { Pool, types } from "pg";

const LOCAL_SCHEMA = process.env.LOCAL_DB_SCHEMA ?? "gynecology_local";
const DEFAULT_USER_ID =
  process.env.NEXT_PUBLIC_DEV_USER_ID ??
  process.env.EXPO_PUBLIC_DEV_USER_ID ??
  "local-user-demo";
const DEFAULT_PHONE_NUMBER =
  process.env.LOCAL_DEV_USER_PHONE_NUMBER ?? "01012345678";
const DEFAULT_PASSWORD = process.env.LOCAL_DEV_USER_PASSWORD ?? "test1234";
const DEFAULT_USER_NAME = process.env.LOCAL_DEV_USER_NAME ?? "김수아";
const DEFAULT_ADMIN_USER_ID =
  process.env.LOCAL_ADMIN_USER_ID ?? "local-admin-1";
const DEFAULT_ADMIN_PHONE_NUMBER =
  process.env.LOCAL_ADMIN_PHONE_NUMBER ?? "01099998888";
const DEFAULT_ADMIN_PASSWORD = process.env.LOCAL_ADMIN_PASSWORD ?? "admin1234";
const DEFAULT_ADMIN_NAME = process.env.LOCAL_ADMIN_NAME ?? "운영자";
const DEFAULT_DUE_DATE = process.env.LOCAL_DEV_DUE_DATE ?? "2026-07-01";

const SELECT_ONLY_PARAMS = new Set(["select", "limit", "order"]);
const LOCAL_TABLES = new Set([
  "users",
  "pregnancy_profiles",
  "calendar_logs",
  "emotion_logs",
  "chat_sessions",
  "chat_messages",
  "knowledge_items",
  "pregnancy_documents",
  "pregnancy_weeks",
  "pregnancy_week_sections",
  "pregnancy_week_assets",
  "admin_audit_logs",
  "user_action_logs",
]);

let pool: Pool | null = null;
let ensurePromise: Promise<void> | null = null;

types.setTypeParser(1082, (value) => value);

function assertIdentifier(value: string) {
  if (!/^[a-z_][a-z0-9_]*$/i.test(value)) {
    throw new Error(`Invalid SQL identifier: ${value}`);
  }

  return `"${value}"`;
}

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is missing");
  }

  if (!pool) {
    pool = new Pool({ connectionString });
  }

  return pool;
}

function getQualifiedTable(table: string) {
  if (!LOCAL_TABLES.has(table)) {
    throw new Error(`Unsupported local table: ${table}`);
  }

  return `${assertIdentifier(LOCAL_SCHEMA)}.${assertIdentifier(table)}`;
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function toIsoDate(input: Date) {
  return input.toISOString().slice(0, 10);
}

function createSeedDates() {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(now.getDate() - 2);
  const fourDaysAgo = new Date(now);
  fourDaysAgo.setDate(now.getDate() - 4);

  return { now, yesterday, twoDaysAgo, fourDaysAgo };
}

function calculatePregnancyMetricsFromDueDate(dueDateText: string) {
  const dueDate = new Date(`${dueDateText}T00:00:00`);
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const diffDays = Math.round(
    (dueDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
  );
  const pregnancyDayCount = Math.max(0, Math.min(280, 280 - diffDays));

  return {
    pregnancyDayCount,
    pregnancyWeek: Math.max(1, Math.floor(pregnancyDayCount / 7)),
    pregnancyDayInWeek: pregnancyDayCount % 7,
  };
}

async function ensureSeedData() {
  const db = getPool();
  const { now, yesterday, twoDaysAgo, fourDaysAgo } = createSeedDates();
  const pregnancyMetrics =
    calculatePregnancyMetricsFromDueDate(DEFAULT_DUE_DATE);
  const passwordHash = hashPassword(DEFAULT_PASSWORD);
  const adminPasswordHash = hashPassword(DEFAULT_ADMIN_PASSWORD);

  await db.query(
    `
      INSERT INTO ${getQualifiedTable("users")} (
        id,
        role,
        display_name,
        phone_number,
        account_status,
        password_hash,
        password_set_at,
        phone_verified_at,
        last_login_at
      )
      VALUES ($1, 'user', $2, $3, 'active', $4, $5, $5, $5)
      ON CONFLICT (id) DO UPDATE
      SET
        role = EXCLUDED.role,
        display_name = EXCLUDED.display_name,
        phone_number = EXCLUDED.phone_number,
        account_status = EXCLUDED.account_status,
        password_hash = EXCLUDED.password_hash,
        password_set_at = EXCLUDED.password_set_at,
        phone_verified_at = EXCLUDED.phone_verified_at
    `,
    [
      DEFAULT_USER_ID,
      DEFAULT_USER_NAME,
      DEFAULT_PHONE_NUMBER,
      passwordHash,
      yesterday.toISOString(),
    ],
  );

  await db.query(
    `
      INSERT INTO ${getQualifiedTable("users")} (
        id,
        role,
        display_name,
        phone_number,
        account_status,
        password_hash,
        password_set_at,
        phone_verified_at,
        last_login_at
      )
      VALUES ($1, 'admin', $2, $3, 'active', $4, $5, $5, $5)
      ON CONFLICT (id) DO UPDATE
      SET
        role = EXCLUDED.role,
        display_name = EXCLUDED.display_name,
        phone_number = EXCLUDED.phone_number,
        account_status = EXCLUDED.account_status,
        password_hash = EXCLUDED.password_hash,
        password_set_at = EXCLUDED.password_set_at,
        phone_verified_at = EXCLUDED.phone_verified_at
    `,
    [
      DEFAULT_ADMIN_USER_ID,
      DEFAULT_ADMIN_NAME,
      DEFAULT_ADMIN_PHONE_NUMBER,
      adminPasswordHash,
      yesterday.toISOString(),
    ],
  );

  await db.query(
    `
      DELETE FROM ${getQualifiedTable("users")}
      WHERE role = 'super_admin' OR id = 'local-super-admin-1'
    `,
  );

  await db.query(
    `
      INSERT INTO ${getQualifiedTable("pregnancy_profiles")} (
        id,
        user_id,
        pregnancy_status,
        pregnancy_day_count,
        pregnancy_week,
        pregnancy_day_in_week,
        due_date,
        onboarding_payload,
        baby_sex,
        baby_nickname,
        theme_key,
        notification_time,
        notification_enabled,
        week_override,
        day_override
      )
      VALUES ($1, $2, 'pregnant', $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (user_id) DO UPDATE
      SET
        pregnancy_status = EXCLUDED.pregnancy_status,
        pregnancy_day_count = EXCLUDED.pregnancy_day_count,
        pregnancy_week = EXCLUDED.pregnancy_week,
        pregnancy_day_in_week = EXCLUDED.pregnancy_day_in_week,
        due_date = EXCLUDED.due_date,
        onboarding_payload = EXCLUDED.onboarding_payload,
        baby_sex = EXCLUDED.baby_sex,
        baby_nickname = EXCLUDED.baby_nickname,
        theme_key = EXCLUDED.theme_key,
        notification_time = EXCLUDED.notification_time,
        notification_enabled = EXCLUDED.notification_enabled,
        week_override = EXCLUDED.week_override,
        day_override = EXCLUDED.day_override
    `,
    [
      "profile-local-user-demo",
      DEFAULT_USER_ID,
      pregnancyMetrics.pregnancyDayCount,
      pregnancyMetrics.pregnancyWeek,
      pregnancyMetrics.pregnancyDayInWeek,
      DEFAULT_DUE_DATE,
      JSON.stringify({
        pregnancyWeekOrDueDate: DEFAULT_DUE_DATE,
        tonePreference: "calm",
        babyNickname: "튼튼이",
        hospitalName: "산단여성병원",
        notificationTime: "08:30",
      }),
      "unknown",
      "튼튼이",
      "default",
      "08:30",
      true,
      null,
      null,
    ],
  );

  const calendarEntries = [
    [
      "calendar-yesterday",
      toIsoDate(yesterday),
      "오늘 컨디션 메모",
      "아침 입덧이 줄었고 저녁에 가벼운 당김이 있었습니다.",
      "symptom_note",
    ],
    [
      "calendar-two-days-ago",
      toIsoDate(twoDaysAgo),
      "산책 후 피로 기록",
      "산책 20분 후 피로감이 있었지만 휴식 후 안정되었습니다.",
      "ai_summary",
    ],
    [
      "calendar-four-days-ago",
      toIsoDate(fourDaysAgo),
      "정기검진 요약",
      "정기검진에서 큰 이상 없었고 수분 섭취를 더 권고받았습니다.",
      "chat_saved",
    ],
  ];

  for (const [id, date, title, summary, entryType] of calendarEntries) {
    await db.query(
      `
        INSERT INTO ${getQualifiedTable("calendar_logs")} (id, user_id, session_id, date, title, summary, entry_type, payload)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
        ON CONFLICT (id) DO UPDATE
        SET
          session_id = EXCLUDED.session_id,
          date = EXCLUDED.date,
          title = EXCLUDED.title,
          summary = EXCLUDED.summary,
          entry_type = EXCLUDED.entry_type,
          payload = EXCLUDED.payload
      `,
      [
        id,
        DEFAULT_USER_ID,
        "local-session-welcome",
        date,
        title,
        summary,
        entryType,
        JSON.stringify({ source: "local-seed" }),
      ],
    );
  }

  const emotionEntries = [
    ["emotion-yesterday", toIsoDate(yesterday), "calm"],
    ["emotion-two-days-ago", toIsoDate(twoDaysAgo), "tired"],
    ["emotion-four-days-ago", toIsoDate(fourDaysAgo), "joyful"],
  ];

  for (const [id, date, emotionTone] of emotionEntries) {
    await db.query(
      `
        INSERT INTO ${getQualifiedTable("emotion_logs")} (id, user_id, date, emotion_tone)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE
        SET date = EXCLUDED.date, emotion_tone = EXCLUDED.emotion_tone
      `,
      [id, DEFAULT_USER_ID, date, emotionTone],
    );
  }

  await db.query(
    `
      INSERT INTO ${getQualifiedTable("chat_sessions")} (id, user_id, title, status, last_message_at)
      VALUES ($1, $2, $3, 'active', $4)
      ON CONFLICT (id) DO UPDATE
      SET title = EXCLUDED.title, status = EXCLUDED.status, last_message_at = EXCLUDED.last_message_at
    `,
    [
      "local-session-welcome",
      DEFAULT_USER_ID,
      "24주차 컨디션 상담",
      now.toISOString(),
    ],
  );

  const introMessages = [
    {
      id: "message-local-user-1",
      role: "user",
      plainText: "24주차인데 밤에 배가 단단해지는 느낌이 잠깐 있어요.",
      parts: [
        {
          type: "text",
          id: "part-local-user-1",
          text: "24주차인데 밤에 배가 단단해지는 느낌이 잠깐 있어요.",
        },
      ],
      createdAt: twoDaysAgo.toISOString(),
    },
    {
      id: "message-local-assistant-1",
      role: "assistant",
      plainText:
        "짧고 불규칙한 자궁 수축은 있을 수 있지만, 통증이 심해지거나 규칙적으로 반복되면 진료를 권합니다.",
      parts: [
        {
          type: "text",
          id: "part-local-assistant-1",
          text: "짧고 불규칙한 자궁 수축은 있을 수 있지만, 통증이 심해지거나 규칙적으로 반복되면 진료를 권합니다.",
        },
        {
          type: "deepLink",
          id: "part-local-assistant-2",
          title: "임신수첩 체크리스트",
          description: "수축 빈도와 동반 증상을 바로 기록할 수 있습니다.",
          target: "notebook",
          entityId: "visit-checklist",
        },
      ],
      createdAt: yesterday.toISOString(),
    },
  ];

  for (const message of introMessages) {
    await db.query(
      `
        INSERT INTO ${getQualifiedTable("chat_messages")} (
          id,
          session_id,
          user_id,
          role,
          parts,
          plain_text,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
        ON CONFLICT (id) DO UPDATE
        SET
          role = EXCLUDED.role,
          parts = EXCLUDED.parts,
          plain_text = EXCLUDED.plain_text,
          created_at = EXCLUDED.created_at
      `,
      [
        message.id,
        "local-session-welcome",
        DEFAULT_USER_ID,
        message.role,
        JSON.stringify(message.parts),
        message.plainText,
        message.createdAt,
      ],
    );
  }

  const knowledgeItems = [
    {
      id: "visit-checklist",
      title: "진료 전 체크리스트",
      section: "notebook",
      body: "통증 시작 시각, 지속 시간, 출혈 여부, 태동 변화, 체온을 기록해 두면 진료에 도움이 됩니다.",
    },
    {
      id: "warning-signs",
      title: "24주차 위험 신호",
      section: "knowledge",
      body: "규칙적인 수축, 양수 같은 맑은 액체 유출, 선명한 출혈, 태동 급감은 바로 진료 상담이 필요합니다.",
    },
  ];

  for (const item of knowledgeItems) {
    await db.query(
      `
        INSERT INTO ${getQualifiedTable("knowledge_items")} (id, title, section, body, status)
        VALUES ($1, $2, $3, $4, 'published')
        ON CONFLICT (id) DO UPDATE
        SET
          title = EXCLUDED.title,
          section = EXCLUDED.section,
          body = EXCLUDED.body,
          status = EXCLUDED.status
      `,
      [item.id, item.title, item.section, item.body],
    );
  }

  const ragDocuments = [
    {
      id: "pregnancy-doc-24-common",
      title: "24주차 배뭉침 안내",
      content:
        "24주차에는 짧고 불규칙한 배뭉침이 나타날 수 있습니다. 수분 섭취와 휴식 후 완화되는지 관찰하고 규칙적인 간격이면 진료 상담이 필요합니다.",
      pregnancyWeek: 24,
      category: "symptom-guide",
    },
    {
      id: "pregnancy-doc-common-warning",
      title: "조산 위험 신호",
      content:
        "한 시간 이상 반복되는 수축, 선명한 출혈, 양수 유출 의심, 태동 감소는 즉시 의료기관과 상의해야 합니다.",
      pregnancyWeek: null,
      category: "warning-signs",
    },
  ];

  for (const document of ragDocuments) {
    await db.query(
      `
        INSERT INTO ${getQualifiedTable("pregnancy_documents")} (
          id,
          title,
          content,
          pregnancy_week,
          category,
          metadata,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
        ON CONFLICT (id) DO UPDATE
        SET
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          pregnancy_week = EXCLUDED.pregnancy_week,
          category = EXCLUDED.category,
          metadata = EXCLUDED.metadata
      `,
      [
        document.id,
        document.title,
        document.content,
        document.pregnancyWeek,
        document.category,
        JSON.stringify({ source: "local-dev" }),
        now.toISOString(),
      ],
    );
  }

  for (let weekNumber = 1; weekNumber <= 40; weekNumber++) {
    await db.query(
      `
        INSERT INTO ${getQualifiedTable("pregnancy_weeks")} (
          id,
          week_number,
          title,
          status,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (week_number) DO NOTHING
      `,
      [
        `pregnancy-week-${weekNumber}`,
        weekNumber,
        `Week ${weekNumber}`,
        "draft",
        now.toISOString(),
        now.toISOString(),
      ],
    );
  }
}

export async function ensureLocalPostgresReady() {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      const db = getPool();

      await db.query(
        `CREATE SCHEMA IF NOT EXISTS ${assertIdentifier(LOCAL_SCHEMA)}`,
      );
      await db.query(`
        CREATE TABLE IF NOT EXISTS ${getQualifiedTable("users")} (
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

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable("pregnancy_profiles")} (
          id text PRIMARY KEY,
          user_id text NOT NULL UNIQUE REFERENCES ${getQualifiedTable("users")}(id) ON DELETE CASCADE,
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

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable("calendar_logs")} (
          id text PRIMARY KEY,
          user_id text NOT NULL REFERENCES ${getQualifiedTable("users")}(id) ON DELETE CASCADE,
          session_id text REFERENCES ${getQualifiedTable("chat_sessions")}(id) ON DELETE SET NULL,
          date date NOT NULL,
          entry_type text NOT NULL DEFAULT 'ai_summary',
          title text NOT NULL DEFAULT '기록',
          summary text,
          payload jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable("emotion_logs")} (
          id text PRIMARY KEY,
          user_id text NOT NULL REFERENCES ${getQualifiedTable("users")}(id) ON DELETE CASCADE,
          date date NOT NULL,
          emotion_tone text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable("chat_sessions")} (
          id text PRIMARY KEY,
          user_id text NOT NULL REFERENCES ${getQualifiedTable("users")}(id) ON DELETE CASCADE,
          title text NOT NULL,
          status text NOT NULL DEFAULT 'active',
          last_message_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable("chat_messages")} (
          id text PRIMARY KEY,
          session_id text NOT NULL REFERENCES ${getQualifiedTable("chat_sessions")}(id) ON DELETE CASCADE,
          user_id text NOT NULL REFERENCES ${getQualifiedTable("users")}(id) ON DELETE CASCADE,
          role text NOT NULL,
          parts jsonb NOT NULL DEFAULT '[]'::jsonb,
          plain_text text,
          image_attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
          model_name text,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable("knowledge_items")} (
          id text PRIMARY KEY,
          title text NOT NULL,
          section text NOT NULL,
          body text NOT NULL,
          status text NOT NULL DEFAULT 'published',
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable("pregnancy_documents")} (
          id text PRIMARY KEY,
          title text NOT NULL,
          content text NOT NULL,
          pregnancy_week integer,
          category text NOT NULL,
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable("pregnancy_weeks")} (
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

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable("pregnancy_week_sections")} (
          id text PRIMARY KEY,
          week_id text NOT NULL REFERENCES ${getQualifiedTable("pregnancy_weeks")}(id) ON DELETE CASCADE,
          section_key text NOT NULL,
          title text,
          body text,
          display_order integer NOT NULL DEFAULT 0,
          is_required boolean NOT NULL DEFAULT false,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable("pregnancy_week_assets")} (
          id text PRIMARY KEY,
          week_id text NOT NULL REFERENCES ${getQualifiedTable("pregnancy_weeks")}(id) ON DELETE CASCADE,
          asset_type text NOT NULL,
          storage_path text NOT NULL,
          alt_text text,
          style_key text,
          display_order integer NOT NULL DEFAULT 0,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable("admin_audit_logs")} (
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

        CREATE TABLE IF NOT EXISTS ${getQualifiedTable("user_action_logs")} (
          id text PRIMARY KEY,
          user_id text NOT NULL REFERENCES ${getQualifiedTable("users")}(id) ON DELETE CASCADE,
          session_id text REFERENCES ${getQualifiedTable("chat_sessions")}(id) ON DELETE SET NULL,
          message_id text REFERENCES ${getQualifiedTable("chat_messages")}(id) ON DELETE SET NULL,
          action_type text NOT NULL,
          payload jsonb NOT NULL DEFAULT '{}'::jsonb,
          occurred_at timestamptz NOT NULL DEFAULT now()
        );
      `);

      await db.query(`
        ALTER TABLE ${getQualifiedTable("users")} ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';
        ALTER TABLE ${getQualifiedTable("users")} ADD COLUMN IF NOT EXISTS display_name text;
        ALTER TABLE ${getQualifiedTable("users")} ADD COLUMN IF NOT EXISTS phone_number text;
        ALTER TABLE ${getQualifiedTable("users")} ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active';
        ALTER TABLE ${getQualifiedTable("users")} ADD COLUMN IF NOT EXISTS password_hash text;
        ALTER TABLE ${getQualifiedTable("users")} ADD COLUMN IF NOT EXISTS password_set_at timestamptz;
        ALTER TABLE ${getQualifiedTable("users")} ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz;
        ALTER TABLE ${getQualifiedTable("users")} ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
        ALTER TABLE ${getQualifiedTable("users")} ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
        ALTER TABLE ${getQualifiedTable("pregnancy_profiles")} ADD COLUMN IF NOT EXISTS due_date date;
        ALTER TABLE ${getQualifiedTable("pregnancy_profiles")} ADD COLUMN IF NOT EXISTS baby_sex text CHECK (baby_sex IN ('male', 'female', 'unknown') OR baby_sex IS NULL);
        ALTER TABLE ${getQualifiedTable("pregnancy_profiles")} ADD COLUMN IF NOT EXISTS baby_nickname text;
        ALTER TABLE ${getQualifiedTable("pregnancy_profiles")} ADD COLUMN IF NOT EXISTS theme_key text;
        ALTER TABLE ${getQualifiedTable("pregnancy_profiles")} ADD COLUMN IF NOT EXISTS notification_time time;
        ALTER TABLE ${getQualifiedTable("pregnancy_profiles")} ADD COLUMN IF NOT EXISTS notification_enabled boolean NOT NULL DEFAULT true;
        ALTER TABLE ${getQualifiedTable("pregnancy_profiles")} ADD COLUMN IF NOT EXISTS week_override integer;
        ALTER TABLE ${getQualifiedTable("pregnancy_profiles")} ADD COLUMN IF NOT EXISTS day_override integer;
        ALTER TABLE ${getQualifiedTable("pregnancy_week_assets")} ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;
        ALTER TABLE ${getQualifiedTable("calendar_logs")} ADD COLUMN IF NOT EXISTS session_id text REFERENCES ${getQualifiedTable("chat_sessions")}(id) ON DELETE SET NULL;
        ALTER TABLE ${getQualifiedTable("calendar_logs")} ADD COLUMN IF NOT EXISTS entry_type text NOT NULL DEFAULT 'ai_summary';
        ALTER TABLE ${getQualifiedTable("calendar_logs")} ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '기록';
        ALTER TABLE ${getQualifiedTable("calendar_logs")} ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb;
      `);

      await ensureSeedData();
    })().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }

  await ensurePromise;
}

function splitPath(path: string) {
  const [table, search = ""] = path.split("?");
  if (!table) {
    throw new Error(`Invalid Supabase path: ${path}`);
  }

  return {
    table,
    searchParams: new URLSearchParams(search),
  };
}

function normalizeValue(value: unknown) {
  if (value === undefined) {
    return null;
  }

  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }

  return value;
}

function normalizeFilterValue(operator: "eq" | "gte" | "lt", rawValue: string) {
  if (operator === "lt" && /^\d{4}-\d{2}-32$/.test(rawValue)) {
    const [yearText, monthText] = rawValue.split("-").slice(0, 2);
    const year = Number(yearText);
    const monthIndex = Number(monthText) - 1;
    return toIsoDate(new Date(Date.UTC(year, monthIndex + 1, 1)));
  }

  return rawValue;
}

function buildWhereClause(searchParams: URLSearchParams, parameterOffset = 0) {
  const clauses: string[] = [];
  const values: unknown[] = [];

  searchParams.forEach((rawValue, rawField) => {
    if (SELECT_ONLY_PARAMS.has(rawField)) {
      return;
    }

    const field = assertIdentifier(rawField);

    if (rawValue.startsWith("eq.")) {
      values.push(normalizeFilterValue("eq", rawValue.slice(3)));
      clauses.push(`${field} = $${parameterOffset + values.length}`);
      return;
    }

    if (rawValue.startsWith("gte.")) {
      values.push(normalizeFilterValue("gte", rawValue.slice(4)));
      clauses.push(`${field} >= $${parameterOffset + values.length}`);
      return;
    }

    if (rawValue.startsWith("lt.")) {
      values.push(normalizeFilterValue("lt", rawValue.slice(3)));
      clauses.push(`${field} < $${parameterOffset + values.length}`);
      return;
    }

    throw new Error(`Unsupported local filter: ${rawField}=${rawValue}`);
  });

  return {
    sql: clauses.length > 0 ? ` WHERE ${clauses.join(" AND ")}` : "",
    values,
  };
}

function buildSelectColumns(select: string | null) {
  if (!select) {
    return "*";
  }

  return select
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean)
    .map((column) => `${assertIdentifier(column)}`)
    .join(", ");
}

function buildOrderBy(order: string | null) {
  if (!order) {
    return "";
  }

  const [column, direction = "asc", nulls] = order.split(".");
  const normalizedDirection =
    direction.toLowerCase() === "desc" ? "DESC" : "ASC";
  const nullsClause =
    nulls?.toLowerCase() === "nullslast"
      ? " NULLS LAST"
      : nulls?.toLowerCase() === "nullsfirst"
        ? " NULLS FIRST"
        : "";

  return ` ORDER BY ${assertIdentifier(column)} ${normalizedDirection}${nullsClause}`;
}

function createInsertRows(table: string, payload: object | object[]) {
  const rows = Array.isArray(payload) ? payload : [payload];

  return rows.map((row) => {
    const normalized = { ...(row as Record<string, unknown>) };

    if (!("id" in normalized)) {
      normalized.id = randomUUID();
    }

    if (table === "chat_messages" && !("created_at" in normalized)) {
      normalized.created_at = new Date().toISOString();
    }

    if (table === "chat_sessions" && !("created_at" in normalized)) {
      normalized.created_at = new Date().toISOString();
    }

    return normalized;
  });
}

async function syncSessionTimestamp(
  table: string,
  rows: Array<Record<string, unknown>>,
) {
  if (table !== "chat_messages") {
    return;
  }

  const db = getPool();

  for (const row of rows) {
    if (!row.session_id) {
      continue;
    }

    const createdAt =
      typeof row.created_at === "string"
        ? row.created_at
        : new Date().toISOString();
    await db.query(
      `UPDATE ${getQualifiedTable("chat_sessions")} SET last_message_at = $2 WHERE id = $1`,
      [row.session_id, createdAt],
    );
  }
}

export async function localSupabaseSelect<T>(path: string) {
  await ensureLocalPostgresReady();
  const db = getPool();
  const { table, searchParams } = splitPath(path);
  const { sql: whereSql, values } = buildWhereClause(searchParams);
  const selectSql = buildSelectColumns(searchParams.get("select"));
  const orderSql = buildOrderBy(searchParams.get("order"));
  const limit = searchParams.get("limit");
  const limitSql = limit ? ` LIMIT ${Number(limit)}` : "";

  const query = `SELECT ${selectSql} FROM ${getQualifiedTable(table)}${whereSql}${orderSql}${limitSql}`;
  const result = await db.query(query, values);
  return result.rows as T;
}

export async function localSupabaseInsert<T>(
  table: string,
  payload: object | object[],
) {
  await ensureLocalPostgresReady();
  const db = getPool();
  const rows = createInsertRows(table, payload);
  const columnNames = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const columnsSql = columnNames
    .map((column) => assertIdentifier(column))
    .join(", ");

  const values: unknown[] = [];
  const valuesSql = rows
    .map((row) => {
      const placeholders = columnNames.map((column) => {
        values.push(normalizeValue(row[column]));
        return `$${values.length}`;
      });

      return `(${placeholders.join(", ")})`;
    })
    .join(", ");

  const query = `INSERT INTO ${getQualifiedTable(table)} (${columnsSql}) VALUES ${valuesSql} RETURNING *`;
  const result = await db.query(query, values);
  await syncSessionTimestamp(table, rows);
  return result.rows as T;
}

export async function localSupabaseUpdate<T>(path: string, payload: object) {
  await ensureLocalPostgresReady();
  const db = getPool();
  const { table, searchParams } = splitPath(path);
  const entries = Object.entries(payload as Record<string, unknown>);

  if (entries.length === 0) {
    return [] as unknown as T;
  }

  const values: unknown[] = [];
  const setSql = entries
    .map(([column, value]) => {
      values.push(normalizeValue(value));
      return `${assertIdentifier(column)} = $${values.length}`;
    })
    .join(", ");

  const { sql: whereSql, values: whereValues } = buildWhereClause(
    searchParams,
    values.length,
  );
  const query = `UPDATE ${getQualifiedTable(table)} SET ${setSql}${whereSql} RETURNING *`;
  const result = await db.query(query, [...values, ...whereValues]);
  return result.rows as T;
}

export async function localSupabaseRpc<T>(
  fn: string,
  payload: Record<string, unknown>,
) {
  await ensureLocalPostgresReady();
  const db = getPool();

  if (fn !== "match_pregnancy_documents") {
    throw new Error(`Unsupported local rpc: ${fn}`);
  }

  const currentWeek =
    typeof payload.current_week === "number" ? payload.current_week : null;
  const matchCount =
    typeof payload.match_count === "number" ? payload.match_count : 4;

  const result = await db.query(
    `
      SELECT
        id,
        title,
        content,
        pregnancy_week,
        category,
        metadata,
        CASE
          WHEN $1::int IS NULL AND pregnancy_week IS NULL THEN 0.82
          WHEN $1::int IS NULL THEN 0.74
          WHEN pregnancy_week IS NULL THEN 0.78
          WHEN pregnancy_week = $1::int THEN 0.98
          WHEN ABS(pregnancy_week - $1::int) = 1 THEN 0.92
          WHEN ABS(pregnancy_week - $1::int) <= 3 THEN 0.86
          ELSE 0.68
        END AS similarity
      FROM ${getQualifiedTable("pregnancy_documents")}
      WHERE $1::int IS NULL OR pregnancy_week IS NULL OR ABS(pregnancy_week - $1::int) <= 3
      ORDER BY similarity DESC, created_at DESC
      LIMIT $2
    `,
    [currentWeek, matchCount],
  );

  return result.rows as T;
}
