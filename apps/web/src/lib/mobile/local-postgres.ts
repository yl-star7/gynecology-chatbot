import { randomUUID } from "crypto";
import { Pool, types } from "pg";
import { createPhoneNumberStorage } from "@/lib/privacy/phone-crypto";
import { buildLocalPostgresBootstrapSql } from "./local-postgres-schema";

function requireEnv(name: keyof NodeJS.ProcessEnv, message?: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(message ?? `${name} is required`);
  }

  return value;
}

function requireDevUserId() {
  const nextPublic = process.env.NEXT_PUBLIC_DEV_USER_ID?.trim();
  const expoPublic = process.env.EXPO_PUBLIC_DEV_USER_ID?.trim();
  if (nextPublic) {
    return nextPublic;
  }

  if (expoPublic) {
    return expoPublic;
  }

  throw new Error(
    "NEXT_PUBLIC_DEV_USER_ID or EXPO_PUBLIC_DEV_USER_ID is required",
  );
}

function getLocalSchema() {
  return requireEnv("LOCAL_DB_SCHEMA");
}

function getDefaultUserId() {
  return requireDevUserId();
}

function getDefaultPhoneNumber() {
  return requireEnv("LOCAL_DEV_USER_PHONE_NUMBER");
}

function getDefaultUserName() {
  return requireEnv("LOCAL_DEV_USER_NAME");
}

function getDefaultAdminUserId() {
  return requireEnv("LOCAL_ADMIN_USER_ID");
}

function getDefaultAdminPhoneNumber() {
  return requireEnv("LOCAL_ADMIN_PHONE_NUMBER");
}

function getDefaultAdminName() {
  return requireEnv("LOCAL_ADMIN_NAME");
}

function getDefaultDueDate() {
  return requireEnv("LOCAL_DEV_DUE_DATE");
}
const PREGNANCY_WEEK_FRUIT_COMPARISON_BY_WEEK: Record<number, string> = {
  5: "참깨알",
  6: "완두콩",
  7: "블루베리",
  8: "체리",
  9: "포도알",
  10: "딸기",
  11: "무화과",
  12: "자두",
  13: "레몬",
  14: "복숭아",
  15: "사과",
  16: "아보카도",
  17: "배",
  18: "피망",
  19: "석류",
  20: "바나나",
  21: "망고",
  22: "고구마",
  23: "자몽",
  24: "옥수수",
  25: "단호박",
};

const SELECT_ONLY_PARAMS = new Set(["select", "limit", "order"]);
const LOCAL_TABLES = new Set([
  "users",
  "pregnancy_profiles",
  "auth_sessions",
  "phone_verification_requests",
  "blocked_phone_numbers",
  "calendar_logs",
  "chat_sessions",
  "chat_messages",
  "content_knowledge_items",
  "content_pregnancy_documents",
  "pregnancy_weeks",
  "content_pregnancy_week_data",
  "pregnancy_week_sections",
  "pregnancy_week_assets",
  "content_week_checklists",
  "content_week_questions",
  "content_pregnancy_day_contents",
  "content_pregnancy_week_media",
  "user_checklist_events",
  "user_question_events",
  "admin_audit_logs",
  "user_action_logs",
  "workflow_definitions",
  "system_config",
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

function resolveLocalTableName(table: string) {
  const normalizedTable = table.includes(".")
    ? (table.split(".").pop() ?? table)
    : table;

  const aliasTable =
    normalizedTable === "allowed_phone_numbers"
      ? "blocked_phone_numbers"
      : normalizedTable === "pregnancy_documents"
        ? "content_pregnancy_documents"
        : normalizedTable === "knowledge_items"
          ? "content_knowledge_items"
          : normalizedTable === "pregnancy_week_data"
            ? "content_pregnancy_week_data"
            : normalizedTable === "pregnancy_day_contents"
              ? "content_pregnancy_day_contents"
              : normalizedTable === "week_checklists"
                ? "content_week_checklists"
                : normalizedTable === "week_questions"
                  ? "content_week_questions"
                  : normalizedTable === "pregnancy_week_media"
                    ? "content_pregnancy_week_media"
                    : normalizedTable;

  if (!LOCAL_TABLES.has(aliasTable)) {
    throw new Error(`Unsupported local table: ${table}`);
  }

  return aliasTable;
}

function getQualifiedTable(table: string) {
  return `${assertIdentifier(getLocalSchema())}.${assertIdentifier(resolveLocalTableName(table))}`;
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
    calculatePregnancyMetricsFromDueDate(getDefaultDueDate());
  const {
    rows: [displayNameColumnRow],
  } = await db.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = $1
          AND table_name = 'users'
          AND column_name = 'display_name'
      ) AS exists
    `,
    [getLocalSchema()],
  );
  const hasLegacyDisplayNameColumn = Boolean(displayNameColumnRow?.exists);
  const defaultUserPhone = createPhoneNumberStorage(getDefaultPhoneNumber());
  const defaultAdminPhone = createPhoneNumberStorage(
    getDefaultAdminPhoneNumber(),
  );

  const userInsertSql = hasLegacyDisplayNameColumn
    ? `
        INSERT INTO ${getQualifiedTable("users")} (
          id,
          role,
          display_name,
          phone_number_encrypted,
          phone_number_blind_index,
          phone_number_last4,
          account_status,
          phone_verified_at,
          last_login_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $7, $7)
        ON CONFLICT (id) DO UPDATE
        SET
          role = EXCLUDED.role,
          display_name = EXCLUDED.display_name,
          phone_number_encrypted = EXCLUDED.phone_number_encrypted,
          phone_number_blind_index = EXCLUDED.phone_number_blind_index,
          phone_number_last4 = EXCLUDED.phone_number_last4,
          account_status = EXCLUDED.account_status,
          phone_verified_at = EXCLUDED.phone_verified_at,
          last_login_at = EXCLUDED.last_login_at,
          updated_at = EXCLUDED.updated_at
      `
    : `
        INSERT INTO ${getQualifiedTable("users")} (
          id,
          role,
          phone_number_encrypted,
          phone_number_blind_index,
          phone_number_last4,
          account_status,
          phone_verified_at,
          last_login_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, 'active', $6, $6, $6)
        ON CONFLICT (id) DO UPDATE
        SET
          role = EXCLUDED.role,
          phone_number_encrypted = EXCLUDED.phone_number_encrypted,
          phone_number_blind_index = EXCLUDED.phone_number_blind_index,
          phone_number_last4 = EXCLUDED.phone_number_last4,
          account_status = EXCLUDED.account_status,
          phone_verified_at = EXCLUDED.phone_verified_at,
          last_login_at = EXCLUDED.last_login_at,
          updated_at = EXCLUDED.updated_at
      `;

  await db.query(
    userInsertSql,
    hasLegacyDisplayNameColumn
      ? [
          getDefaultUserId(),
          "user",
          getDefaultUserName(),
          defaultUserPhone.phoneNumberEncrypted,
          defaultUserPhone.phoneNumberBlindIndex,
          defaultUserPhone.phoneNumberLast4,
          yesterday.toISOString(),
        ]
      : [
          getDefaultUserId(),
          "user",
          defaultUserPhone.phoneNumberEncrypted,
          defaultUserPhone.phoneNumberBlindIndex,
          defaultUserPhone.phoneNumberLast4,
          yesterday.toISOString(),
        ],
  );

  await db.query(
    userInsertSql,
    hasLegacyDisplayNameColumn
      ? [
          getDefaultAdminUserId(),
          "admin",
          getDefaultAdminName(),
          defaultAdminPhone.phoneNumberEncrypted,
          defaultAdminPhone.phoneNumberBlindIndex,
          defaultAdminPhone.phoneNumberLast4,
          yesterday.toISOString(),
        ]
      : [
          getDefaultAdminUserId(),
          "admin",
          defaultAdminPhone.phoneNumberEncrypted,
          defaultAdminPhone.phoneNumberBlindIndex,
          defaultAdminPhone.phoneNumberLast4,
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
        INSERT INTO ${getQualifiedTable("blocked_phone_numbers")} (
        id,
        phone_number_encrypted,
        phone_number_blind_index,
        phone_number_last4,
        display_name,
        note,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
      ON CONFLICT (phone_number_blind_index) DO UPDATE
      SET
        display_name = EXCLUDED.display_name,
        note = EXCLUDED.note,
        updated_at = EXCLUDED.updated_at
    `,
    [
      "allow-local-user-demo",
      defaultUserPhone.phoneNumberEncrypted,
      defaultUserPhone.phoneNumberBlindIndex,
      defaultUserPhone.phoneNumberLast4,
      getDefaultUserName(),
      "로컬 개발 허용 번호",
      yesterday.toISOString(),
    ],
  );

  await db.query(
    `
      INSERT INTO ${getQualifiedTable("pregnancy_profiles")} (
        id,
        user_id,
        display_name,
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
      VALUES ($1, $2, $3, 'pregnant', $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (user_id) DO UPDATE
      SET
        display_name = EXCLUDED.display_name,
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
      getDefaultUserId(),
      getDefaultUserName(),
      pregnancyMetrics.pregnancyDayCount,
      pregnancyMetrics.pregnancyWeek,
      pregnancyMetrics.pregnancyDayInWeek,
      getDefaultDueDate(),
      JSON.stringify({}),
      "unknown",
      "튼튼이",
      "default",
      "08:30",
      true,
      null,
      null,
    ],
  );

  await db.query(
    `
      INSERT INTO ${getQualifiedTable("chat_sessions")} (id, user_id, title, status, last_message_at)
      VALUES ($1, $2, $3, 'active', $4)
      ON CONFLICT (id) DO UPDATE
      SET title = EXCLUDED.title, status = EXCLUDED.status, last_message_at = EXCLUDED.last_message_at
    `,
    [
      "local-session-welcome",
      getDefaultUserId(),
      "24주차 컨디션 채팅",
      now.toISOString(),
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
        getDefaultUserId(),
        "local-session-welcome",
        date,
        title,
        summary,
        entryType,
        JSON.stringify({ source: "local-seed" }),
      ],
    );
  }

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
        getDefaultUserId(),
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
      body: "규칙적인 수축, 양수 같은 맑은 액체 유출, 선명한 출혈, 태동 급감은 즉시 진료가 필요합니다.",
    },
  ];

  for (const item of knowledgeItems) {
    await db.query(
      `
        INSERT INTO ${getQualifiedTable("content_knowledge_items")} (id, title, section, body, status)
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

  const workflowDefinitions = [
    {
      id: "workflow-chat-default",
      name: "기본 채팅 응답",
      slug: "default-chat",
      provider: "flowise",
      status: "published",
      isActive: true,
      config: {
        modelName: "gemini-2.5-flash-lite",
        retrievalScope: "현재 주차 ±1주 + 공통 문서",
      },
      metadata: {
        trigger: "일반 채팅",
        retrievalScope: "현재 주차 ±1주 + 공통 문서",
        modelName: "gemini-2.5-flash-lite",
      },
    },
    {
      id: "workflow-image-triage",
      name: "이미지 동반 채팅",
      slug: "image-triage",
      provider: "flowise",
      status: "draft",
      isActive: false,
      config: {
        modelName: "gemini-2.5-flash-lite",
        retrievalScope: "위험 신호 문서 우선",
      },
      metadata: {
        trigger: "이미지 + 텍스트 입력",
        retrievalScope: "위험 신호 문서 우선",
        modelName: "gemini-2.5-flash-lite",
      },
    },
  ];

  for (const workflow of workflowDefinitions) {
    await db.query(
      `
        INSERT INTO ${getQualifiedTable("workflow_definitions")} (
          id,
          name,
          slug,
          provider,
          status,
          is_active,
          config,
          metadata,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9)
        ON CONFLICT (id) DO UPDATE
        SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          provider = EXCLUDED.provider,
          status = EXCLUDED.status,
          is_active = EXCLUDED.is_active,
          config = EXCLUDED.config,
          metadata = EXCLUDED.metadata,
          updated_at = EXCLUDED.updated_at
      `,
      [
        workflow.id,
        workflow.name,
        workflow.slug,
        workflow.provider,
        workflow.status,
        workflow.isActive,
        JSON.stringify(workflow.config),
        JSON.stringify(workflow.metadata),
        now.toISOString(),
      ],
    );
  }

  const ragDocuments = [
    {
      id: "pregnancy-doc-24-common",
      title: "24주차 배뭉침 안내",
      content:
        "24주차에는 짧고 불규칙한 배뭉침이 나타날 수 있습니다. 수분 섭취와 휴식 후 완화되는지 관찰하고 규칙적인 간격이면 진료가 필요합니다.",
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
        INSERT INTO ${getQualifiedTable("content_pregnancy_documents")} (
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
    const fruitComparison =
      PREGNANCY_WEEK_FRUIT_COMPARISON_BY_WEEK[weekNumber] ?? null;

    await db.query(
      `
        INSERT INTO ${getQualifiedTable("pregnancy_weeks")} (
          id,
          week_number,
          title,
          baby_size_label,
          baby_size_compare_object,
          status,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (week_number) DO UPDATE
        SET
          baby_size_label = COALESCE(
            ${getQualifiedTable("pregnancy_weeks")}.baby_size_label,
            EXCLUDED.baby_size_label
          ),
          baby_size_compare_object = COALESCE(
            ${getQualifiedTable("pregnancy_weeks")}.baby_size_compare_object,
            EXCLUDED.baby_size_compare_object
          )
      `,
      [
        `pregnancy-week-${weekNumber}`,
        weekNumber,
        `Week ${weekNumber}`,
        fruitComparison,
        fruitComparison,
        "draft",
        now.toISOString(),
        now.toISOString(),
      ],
    );

    await db.query(
      `
        INSERT INTO ${getQualifiedTable("content_pregnancy_week_data")} (
          id,
          week_number,
          title,
          baby_size_label,
          baby_size_compare_object,
          status,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (week_number) DO UPDATE
        SET
          baby_size_label = COALESCE(
          ${getQualifiedTable("content_pregnancy_week_data")}.baby_size_label,
            EXCLUDED.baby_size_label
          ),
          baby_size_compare_object = COALESCE(
          ${getQualifiedTable("content_pregnancy_week_data")}.baby_size_compare_object,
            EXCLUDED.baby_size_compare_object
          )
      `,
      [
        `pregnancy-week-data-${weekNumber}`,
        weekNumber,
        `Week ${weekNumber}`,
        fruitComparison,
        fruitComparison,
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
        `CREATE SCHEMA IF NOT EXISTS ${assertIdentifier(getLocalSchema())}`,
      );
      await db.query(buildLocalPostgresBootstrapSql(getLocalSchema()));

      await db.query(`
        ALTER TABLE ${getQualifiedTable("users")} ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';
        ALTER TABLE ${getQualifiedTable("users")} ADD COLUMN IF NOT EXISTS phone_number_encrypted text;
        ALTER TABLE ${getQualifiedTable("users")} ADD COLUMN IF NOT EXISTS phone_number_blind_index text;
        ALTER TABLE ${getQualifiedTable("users")} ADD COLUMN IF NOT EXISTS phone_number_last4 text;
        ALTER TABLE ${getQualifiedTable("users")} ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active';
        ALTER TABLE ${getQualifiedTable("users")} ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz;
        ALTER TABLE ${getQualifiedTable("users")} ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
        ALTER TABLE ${getQualifiedTable("users")} ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
        ALTER TABLE ${getQualifiedTable("users")} ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
        ALTER TABLE ${getQualifiedTable("chat_sessions")} ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
        ALTER TABLE ${getQualifiedTable("phone_verification_requests")} ADD COLUMN IF NOT EXISTS phone_number_encrypted text;
        ALTER TABLE ${getQualifiedTable("phone_verification_requests")} ADD COLUMN IF NOT EXISTS phone_number_blind_index text;
        ALTER TABLE ${getQualifiedTable("phone_verification_requests")} ADD COLUMN IF NOT EXISTS phone_number_last4 text;
    ALTER TABLE ${getQualifiedTable("blocked_phone_numbers")} ADD COLUMN IF NOT EXISTS phone_number_encrypted text;
    ALTER TABLE ${getQualifiedTable("blocked_phone_numbers")} ADD COLUMN IF NOT EXISTS phone_number_blind_index text;
    ALTER TABLE ${getQualifiedTable("blocked_phone_numbers")} ADD COLUMN IF NOT EXISTS phone_number_last4 text;
    ALTER TABLE ${getQualifiedTable("blocked_phone_numbers")} ADD COLUMN IF NOT EXISTS display_name text;
    ALTER TABLE ${getQualifiedTable("blocked_phone_numbers")} ADD COLUMN IF NOT EXISTS note text;
    ALTER TABLE ${getQualifiedTable("blocked_phone_numbers")} ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
    ALTER TABLE ${getQualifiedTable("blocked_phone_numbers")} ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
        ALTER TABLE ${getQualifiedTable("pregnancy_profiles")} ADD COLUMN IF NOT EXISTS display_name text;
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
  const [rawTable, search = ""] = path.split("?");
  if (!rawTable) {
    throw new Error(`Invalid Supabase path: ${path}`);
  }

  const table = rawTable.includes(".")
    ? (rawTable.split(".").at(-1) ?? rawTable)
    : rawTable;

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

export async function localSupabaseDelete<T>(path: string) {
  await ensureLocalPostgresReady();
  const db = getPool();
  const { table, searchParams } = splitPath(path);
  const { sql: whereSql, values } = buildWhereClause(searchParams);
  const query = `DELETE FROM ${getQualifiedTable(table)}${whereSql} RETURNING *`;
  const result = await db.query(query, values);
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
            FROM ${getQualifiedTable("content_pregnancy_documents")}
      WHERE $1::int IS NULL OR pregnancy_week IS NULL OR ABS(pregnancy_week - $1::int) <= 3
      ORDER BY similarity DESC, created_at DESC
      LIMIT $2
    `,
    [currentWeek, matchCount],
  );

  return result.rows as T;
}
