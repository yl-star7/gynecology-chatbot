import type {
  AdminWeekAsset,
  AdminWeekDay,
  AdminWeekMedia,
  AdminWeekSection,
} from "@gynecology-chatbot/app-core";
import { randomUUID } from "crypto";
import { Pool } from "pg";

import {
  supabaseDelete,
  supabaseInsert,
  supabaseSelect,
  supabaseUpdate,
} from "@/lib/supabase/admin-client";

export type SupabaseWeekRow = {
  id: string;
  week_number: number;
  title: string | null;
  baby_size_label: string | null;
  baby_size_compare_object: string | null;
  baby_summary: string | null;
  mother_summary: string | null;
  warning_signs: string | null;
  recommended_actions: string | null;
  status: "draft" | "published" | "archived";
  updated_at: string;
};

export type SupabaseWeekSectionRow = {
  id: string;
  day_number: number | null;
  code: string;
  title: string | null;
  description: string | null;
  display_order: number | null;
  is_required: boolean | null;
  is_active: boolean | null;
};

export type SupabaseWeekAssetRow = {
  id: string;
  day_number: number | null;
  code: string;
  question_type: string;
  question_text: string;
  help_text: string | null;
  display_order: number | null;
  is_required: boolean | null;
  is_active: boolean | null;
};

export type SupabaseWeekDayRow = {
  id: string;
  day_number: number;
  title: string | null;
  baby_development_payload: { items?: string[] } | null;
  baby_message: string | null;
  mother_changes_payload: { items?: string[] } | null;
  display_order: number | null;
};

export type SupabaseWeekMediaRow = {
  id: string;
  day_number: number | null;
  media_scope: "week" | "day";
  bucket_id: string;
  object_path: string;
  media_role: string;
  alt_text: string | null;
  source_file_name: string | null;
  display_order: number | null;
};

let contentWritePool: Pool | null = null;

function getContentWritePool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for admin content writes");
  }

  if (!contentWritePool) {
    const databaseUrl = new URL(process.env.DATABASE_URL);
    const usesSsl =
      databaseUrl.searchParams.get("sslmode") === "require" ||
      databaseUrl.searchParams.get("sslmode") === "verify-full";
    databaseUrl.searchParams.delete("sslmode");
    databaseUrl.searchParams.delete("gssencmode");

    contentWritePool = new Pool({
      connectionString: databaseUrl.toString(),
      ssl: usesSsl ? { rejectUnauthorized: false } : undefined,
    });
  }

  return contentWritePool;
}

async function queryContentRows<T>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await getContentWritePool().query(sql, params);
  return result.rows as T[];
}

type WeekContentRepositoryDeps = {
  select?: typeof supabaseSelect;
  update?: typeof supabaseUpdate;
  insert?: typeof supabaseInsert;
  remove?: typeof supabaseDelete;
  queryRows?: <T>(sql: string, params?: unknown[]) => Promise<T[]>;
  hasDirectContentDatabase?: () => boolean;
  createId?: () => string;
};

export class WeekContentRepository {
  private readonly select: typeof supabaseSelect;
  private readonly update: typeof supabaseUpdate;
  private readonly insert: typeof supabaseInsert;
  private readonly remove: typeof supabaseDelete;
  private readonly queryRows: <T>(
    sql: string,
    params?: unknown[],
  ) => Promise<T[]>;
  private readonly hasDirectContentDatabase: () => boolean;
  private readonly createId: () => string;

  constructor(deps: WeekContentRepositoryDeps = {}) {
    this.select = deps.select ?? supabaseSelect;
    this.update = deps.update ?? supabaseUpdate;
    this.insert = deps.insert ?? supabaseInsert;
    this.remove = deps.remove ?? supabaseDelete;
    this.queryRows = deps.queryRows ?? queryContentRows;
    this.hasDirectContentDatabase =
      deps.hasDirectContentDatabase ??
      (() => Boolean(process.env.DATABASE_URL));
    this.createId = deps.createId ?? randomUUID;
  }

  async listWeeks(): Promise<SupabaseWeekRow[]> {
    if (this.hasDirectContentDatabase()) {
      return this.queryRows<SupabaseWeekRow>(
        `
          SELECT
            id,
            week_number,
            title,
            baby_size_label,
            baby_size_compare_object,
            baby_summary,
            mother_summary,
            warning_signs,
            recommended_actions,
            status,
            updated_at
          FROM content.pregnancy_week_data
          ORDER BY week_number ASC
        `,
      );
    }

    try {
      return await this.select<Array<SupabaseWeekRow>>(
        "content_pregnancy_week_data?select=id,week_number,title,baby_size_label,baby_size_compare_object,baby_summary,mother_summary,warning_signs,recommended_actions,status,updated_at&status=eq.published&order=week_number.asc",
      );
    } catch (error) {
      console.error(
        "public week summaries unavailable, falling back to content schema",
        error,
      );
      return this.select<Array<SupabaseWeekRow>>(
        "content.pregnancy_week_data?select=id,week_number,title,baby_size_label,baby_size_compare_object,baby_summary,mother_summary,warning_signs,recommended_actions,status,updated_at&order=week_number.asc",
      );
    }
  }

  async getWeek(weekNumber: number): Promise<SupabaseWeekRow | null> {
    let weekRows: Array<SupabaseWeekRow>;
    if (this.hasDirectContentDatabase()) {
      weekRows = await this.queryRows<SupabaseWeekRow>(
        `
          SELECT
            id,
            week_number,
            title,
            baby_size_label,
            baby_size_compare_object,
            baby_summary,
            mother_summary,
            warning_signs,
            recommended_actions,
            status,
            updated_at
          FROM content.pregnancy_week_data
          WHERE week_number = $1
          LIMIT 1
        `,
        [weekNumber],
      );
    } else {
      try {
        weekRows = await this.select<Array<SupabaseWeekRow>>(
          `content_pregnancy_week_data?select=id,week_number,title,baby_size_label,baby_size_compare_object,baby_summary,mother_summary,warning_signs,recommended_actions,status,updated_at&week_number=eq.${weekNumber}&status=eq.published&limit=1`,
        );
      } catch (error) {
        console.error(
          "public week detail unavailable, falling back to content schema",
          error,
        );
        weekRows = await this.select<Array<SupabaseWeekRow>>(
          `content.pregnancy_week_data?select=id,week_number,title,baby_size_label,baby_size_compare_object,baby_summary,mother_summary,warning_signs,recommended_actions,status,updated_at&week_number=eq.${weekNumber}&limit=1`,
        );
      }
    }

    return weekRows[0] ?? null;
  }

  async getWeekChildren(weekId: string): Promise<{
    sections: SupabaseWeekSectionRow[];
    assets: SupabaseWeekAssetRow[];
    days: SupabaseWeekDayRow[];
    media: SupabaseWeekMediaRow[];
  }> {
    if (this.hasDirectContentDatabase()) {
      const [sections, assets, days, media] = await Promise.all([
        this.queryRows<SupabaseWeekSectionRow>(
          `
            SELECT id, day_number, code, title, description, display_order, is_required, is_active
            FROM content.week_checklists
            WHERE week_data_id = $1::uuid
            ORDER BY day_number ASC NULLS LAST, display_order ASC NULLS LAST
          `,
          [weekId],
        ),
        this.queryRows<SupabaseWeekAssetRow>(
          `
            SELECT id, day_number, code, question_type, question_text, help_text, display_order, is_required, is_active
            FROM content.week_questions
            WHERE week_data_id = $1::uuid
            ORDER BY day_number ASC NULLS LAST, display_order ASC NULLS LAST
          `,
          [weekId],
        ),
        this.queryRows<SupabaseWeekDayRow>(
          `
            SELECT id, day_number, title, baby_development_payload, baby_message, mother_changes_payload, display_order
            FROM content.pregnancy_day_contents
            WHERE week_data_id = $1::uuid
            ORDER BY day_number ASC
          `,
          [weekId],
        ),
        this.queryRows<SupabaseWeekMediaRow>(
          `
            SELECT id, day_number, media_scope, bucket_id, object_path, media_role, alt_text, source_file_name, display_order
            FROM content.pregnancy_week_media
            WHERE week_data_id = $1::uuid
            ORDER BY day_number ASC NULLS LAST, display_order ASC NULLS LAST
          `,
          [weekId],
        ),
      ]);

      return { sections, assets, days, media };
    }

    let sections: Array<SupabaseWeekSectionRow>;
    let assets: Array<SupabaseWeekAssetRow>;
    let days: Array<SupabaseWeekDayRow>;

    try {
      [sections, assets, days] = await Promise.all([
        this.select<Array<SupabaseWeekSectionRow>>(
          `content.week_checklists?select=id,day_number,code,title,description,display_order,is_required,is_active&week_data_id=eq.${weekId}&order=day_number.asc.nullslast,display_order.asc.nullslast`,
        ),
        this.select<Array<SupabaseWeekAssetRow>>(
          `content.week_questions?select=id,day_number,code,question_type,question_text,help_text,display_order,is_required,is_active&week_data_id=eq.${weekId}&order=day_number.asc.nullslast,display_order.asc.nullslast`,
        ),
        this.select<Array<SupabaseWeekDayRow>>(
          `content.pregnancy_day_contents?select=id,day_number,title,baby_development_payload,baby_message,mother_changes_payload,display_order&week_data_id=eq.${weekId}&order=day_number.asc`,
        ),
      ]);
    } catch (error) {
      console.error(
        "public week detail children unavailable, falling back to content schema",
        error,
      );
      [sections, assets, days] = await Promise.all([
        this.select<Array<SupabaseWeekSectionRow>>(
          `content.week_checklists?select=id,day_number,code,title,description,display_order,is_required,is_active&week_data_id=eq.${weekId}&order=day_number.asc.nullslast,display_order.asc.nullslast`,
        ),
        this.select<Array<SupabaseWeekAssetRow>>(
          `content.week_questions?select=id,day_number,code,question_type,question_text,help_text,display_order,is_required,is_active&week_data_id=eq.${weekId}&order=day_number.asc.nullslast,display_order.asc.nullslast`,
        ),
        this.select<Array<SupabaseWeekDayRow>>(
          `content.pregnancy_day_contents?select=id,day_number,title,baby_development_payload,baby_message,mother_changes_payload,display_order&week_data_id=eq.${weekId}&order=day_number.asc`,
        ),
      ]);
    }

    let media: Array<SupabaseWeekMediaRow>;
    try {
      media = await this.select<Array<SupabaseWeekMediaRow>>(
        `content.pregnancy_week_media?select=id,day_number,media_scope,bucket_id,object_path,media_role,alt_text,source_file_name,display_order&week_data_id=eq.${weekId}&order=day_number.asc.nullslast,display_order.asc.nullslast`,
      );
    } catch (error) {
      console.error(
        "week media unavailable, returning empty media list",
        error,
      );
      media = [];
    }

    return { sections, assets, days, media };
  }

  async updateWeekSummary(
    weekId: string,
    input: {
      title: string;
      babySizeLabel: string | null;
      babySizeCompareObject: string | null;
      babySummary: string;
      motherSummary: string;
      heroImagePath: string | null;
      compareImagePath: string | null;
      status: "draft" | "published" | "archived";
    },
  ): Promise<void> {
    if (this.hasDirectContentDatabase()) {
      await this.queryRows(
        `
          UPDATE content.pregnancy_week_data
             SET title = $2,
                 baby_size_label = $3,
                 baby_size_compare_object = $4,
                 baby_summary = $5,
                 mother_summary = $6,
                 warning_signs = $7,
                 recommended_actions = $8,
                 status = $9,
                 updated_at = NOW()
           WHERE id = $1::uuid
        `,
        [
          weekId,
          input.title,
          input.babySizeLabel,
          input.babySizeCompareObject,
          input.babySummary,
          input.motherSummary,
          input.heroImagePath,
          input.compareImagePath,
          input.status,
        ],
      );
      return;
    }

    await this.update(`content.pregnancy_week_data?id=eq.${weekId}`, {
      title: input.title,
      baby_size_label: input.babySizeLabel,
      baby_size_compare_object: input.babySizeCompareObject,
      baby_summary: input.babySummary,
      mother_summary: input.motherSummary,
      warning_signs: input.heroImagePath,
      recommended_actions: input.compareImagePath,
      status: input.status,
      updated_at: new Date().toISOString(),
    });
  }

  async upsertDayContents(
    weekId: string,
    days: AdminWeekDay[],
  ): Promise<Map<number, string>> {
    const dayIdByNumber = new Map<number, string>();

    for (const day of days) {
      const payload = {
        week_data_id: weekId,
        day_number: day.dayNumber,
        title: day.title,
        baby_development_payload: {
          items: day.babyDevelopmentItems,
        },
        baby_message: day.babyMessage,
        mother_changes_payload: {
          items: day.motherChangesItems,
        },
        display_order: day.displayOrder,
      };

      if (day.id) {
        if (this.hasDirectContentDatabase()) {
          await this.queryRows(
            `
              UPDATE content.pregnancy_day_contents
                 SET week_data_id = $2::uuid,
                     day_number = $3,
                     title = $4,
                     baby_development_payload = $5::jsonb,
                     baby_message = $6,
                     mother_changes_payload = $7::jsonb,
                     display_order = $8
               WHERE id = $1::uuid
            `,
            [
              day.id,
              weekId,
              day.dayNumber,
              day.title,
              JSON.stringify(payload.baby_development_payload),
              day.babyMessage,
              JSON.stringify(payload.mother_changes_payload),
              day.displayOrder,
            ],
          );
        } else {
          await this.update(
            `content.pregnancy_day_contents?id=eq.${day.id}`,
            payload,
          );
        }

        dayIdByNumber.set(day.dayNumber, day.id);
        continue;
      }

      const newId = this.createId();
      const insertedDayId = this.hasDirectContentDatabase()
        ? (
            await this.queryRows<{ id: string }>(
              `
                INSERT INTO content.pregnancy_day_contents (
                  id, week_data_id, day_number, title, baby_development_payload,
                  baby_message, mother_changes_payload, display_order
                )
                VALUES ($1::uuid, $2::uuid, $3, $4, $5::jsonb, $6, $7::jsonb, $8)
                RETURNING id
              `,
              [
                newId,
                weekId,
                day.dayNumber,
                day.title,
                JSON.stringify(payload.baby_development_payload),
                day.babyMessage,
                JSON.stringify(payload.mother_changes_payload),
                day.displayOrder,
              ],
            )
          )[0]?.id
        : (
            await this.insert<Array<{ id: string }>>(
              "content.pregnancy_day_contents",
              {
                id: newId,
                ...payload,
              },
            )
          )[0]?.id;

      if (insertedDayId) {
        dayIdByNumber.set(day.dayNumber, insertedDayId);
      }
    }

    return dayIdByNumber;
  }

  async upsertChecklists(
    weekId: string,
    sections: AdminWeekSection[],
    dayIdByNumber: Map<number, string>,
  ): Promise<void> {
    for (const section of sections) {
      const payload = {
        week_data_id: weekId,
        day_content_id:
          section.dayNumber !== null
            ? (dayIdByNumber.get(section.dayNumber) ?? null)
            : null,
        day_number: section.dayNumber,
        code: section.sectionKey,
        title: section.title,
        description: section.body,
        display_order: section.displayOrder,
        is_required: section.isRequired,
        is_active: section.isActive,
      };

      if (section.id) {
        if (this.hasDirectContentDatabase()) {
          await this.queryRows(
            `
              UPDATE content.week_checklists
                 SET week_data_id = $2::uuid,
                     day_content_id = $3::uuid,
                     day_number = $4,
                     code = $5,
                     title = $6,
                     description = $7,
                     display_order = $8,
                     is_required = $9,
                     is_active = $10
               WHERE id = $1::uuid
            `,
            [
              section.id,
              weekId,
              payload.day_content_id,
              section.dayNumber,
              section.sectionKey,
              section.title,
              section.body,
              section.displayOrder,
              section.isRequired,
              section.isActive,
            ],
          );
        } else {
          await this.update(
            `content.week_checklists?id=eq.${section.id}`,
            payload,
          );
        }

        continue;
      }

      const newId = this.createId();
      if (this.hasDirectContentDatabase()) {
        await this.queryRows(
          `
            INSERT INTO content.week_checklists (
              id, week_data_id, day_content_id, day_number, code, title,
              description, display_order, is_required, is_active
            )
            VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8, $9, $10)
          `,
          [
            newId,
            weekId,
            payload.day_content_id,
            section.dayNumber,
            section.sectionKey,
            section.title,
            section.body,
            section.displayOrder,
            section.isRequired,
            section.isActive,
          ],
        );
      } else {
        await this.insert("content.week_checklists", {
          id: newId,
          ...payload,
        });
      }
    }
  }

  async upsertQuestions(
    weekId: string,
    assets: AdminWeekAsset[],
    dayIdByNumber: Map<number, string>,
  ): Promise<void> {
    for (const asset of assets) {
      const payload = {
        week_data_id: weekId,
        day_content_id:
          asset.dayNumber !== null
            ? (dayIdByNumber.get(asset.dayNumber) ?? null)
            : null,
        day_number: asset.dayNumber,
        code: asset.styleKey,
        question_type: asset.assetType,
        question_text: asset.storagePath,
        help_text: asset.altText,
        display_order: asset.displayOrder,
        is_required: asset.isRequired,
        is_active: asset.isActive,
      };

      if (asset.id) {
        if (this.hasDirectContentDatabase()) {
          await this.queryRows(
            `
              UPDATE content.week_questions
                 SET week_data_id = $2::uuid,
                     day_content_id = $3::uuid,
                     day_number = $4,
                     code = $5,
                     question_type = $6,
                     question_text = $7,
                     help_text = $8,
                     display_order = $9,
                     is_required = $10,
                     is_active = $11
               WHERE id = $1::uuid
            `,
            [
              asset.id,
              weekId,
              payload.day_content_id,
              asset.dayNumber,
              asset.styleKey,
              asset.assetType,
              asset.storagePath,
              asset.altText,
              asset.displayOrder,
              asset.isRequired,
              asset.isActive,
            ],
          );
        } else {
          await this.update(
            `content.week_questions?id=eq.${asset.id}`,
            payload,
          );
        }

        continue;
      }

      const newId = this.createId();
      if (this.hasDirectContentDatabase()) {
        await this.queryRows(
          `
            INSERT INTO content.week_questions (
              id, week_data_id, day_content_id, day_number, code, question_type,
              question_text, help_text, display_order, is_required, is_active
            )
            VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8, $9, $10, $11)
          `,
          [
            newId,
            weekId,
            payload.day_content_id,
            asset.dayNumber,
            asset.styleKey,
            asset.assetType,
            asset.storagePath,
            asset.altText,
            asset.displayOrder,
            asset.isRequired,
            asset.isActive,
          ],
        );
      } else {
        await this.insert("content.week_questions", {
          id: newId,
          ...payload,
        });
      }
    }
  }

  async upsertMedia(
    weekId: string,
    media: AdminWeekMedia[],
    dayIdByNumber: Map<number, string>,
  ): Promise<void> {
    for (const item of media) {
      const payload = {
        week_data_id: weekId,
        day_content_id:
          item.dayNumber !== null
            ? (dayIdByNumber.get(item.dayNumber) ?? null)
            : null,
        day_number: item.dayNumber,
        media_scope: item.mediaScope,
        bucket_id: item.bucketId,
        object_path: item.objectPath,
        media_role: item.mediaRole,
        alt_text: item.altText,
        source_file_name: item.sourceFileName,
        display_order: item.displayOrder,
      };

      if (item.id) {
        if (this.hasDirectContentDatabase()) {
          await this.queryRows(
            `
              UPDATE content.pregnancy_week_media
                 SET week_data_id = $2::uuid,
                     day_content_id = $3::uuid,
                     day_number = $4,
                     media_scope = $5,
                     bucket_id = $6,
                     object_path = $7,
                     media_role = $8,
                     alt_text = $9,
                     source_file_name = $10,
                     display_order = $11
               WHERE id = $1::uuid
            `,
            [
              item.id,
              weekId,
              payload.day_content_id,
              item.dayNumber,
              item.mediaScope,
              item.bucketId,
              item.objectPath,
              item.mediaRole,
              item.altText,
              item.sourceFileName,
              item.displayOrder,
            ],
          );
        } else {
          await this.update(
            `content.pregnancy_week_media?id=eq.${item.id}`,
            payload,
          );
        }

        continue;
      }

      const newId = this.createId();
      if (this.hasDirectContentDatabase()) {
        await this.queryRows(
          `
            INSERT INTO content.pregnancy_week_media (
              id, week_data_id, day_content_id, day_number, media_scope, bucket_id,
              object_path, media_role, alt_text, source_file_name, display_order
            )
            VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8, $9, $10, $11)
          `,
          [
            newId,
            weekId,
            payload.day_content_id,
            item.dayNumber,
            item.mediaScope,
            item.bucketId,
            item.objectPath,
            item.mediaRole,
            item.altText,
            item.sourceFileName,
            item.displayOrder,
          ],
        );
      } else {
        await this.insert("content.pregnancy_week_media", {
          id: newId,
          ...payload,
        });
      }
    }
  }

  async deleteDay(id: string): Promise<void> {
    if (this.hasDirectContentDatabase()) {
      await this.queryRows(
        `DELETE FROM content.pregnancy_day_contents WHERE id = $1::uuid`,
        [id],
      );
      return;
    }

    await this.remove(`content.pregnancy_day_contents?id=eq.${id}`);
  }

  async deleteChecklist(id: string): Promise<void> {
    if (this.hasDirectContentDatabase()) {
      await this.queryRows(
        `DELETE FROM content.week_checklists WHERE id = $1::uuid`,
        [id],
      );
      return;
    }

    await this.remove(`content.week_checklists?id=eq.${id}`);
  }

  async deleteQuestion(id: string): Promise<void> {
    if (this.hasDirectContentDatabase()) {
      await this.queryRows(
        `DELETE FROM content.week_questions WHERE id = $1::uuid`,
        [id],
      );
      return;
    }

    await this.remove(`content.week_questions?id=eq.${id}`);
  }

  async deleteMedia(id: string): Promise<void> {
    if (this.hasDirectContentDatabase()) {
      await this.queryRows(
        `DELETE FROM content.pregnancy_week_media WHERE id = $1::uuid`,
        [id],
      );
      return;
    }

    await this.remove(`content.pregnancy_week_media?id=eq.${id}`);
  }
}
