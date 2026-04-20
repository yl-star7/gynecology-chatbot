import type {
  AdminWeekAsset,
  AdminWeekAssetInput,
  AdminWeekDay,
  AdminWeekDayInput,
  AdminWeekMedia,
  AdminWeekMediaInput,
  AdminWeekSection,
  AdminWeekSectionInput,
} from "@gynecology-chatbot/app-core";
import { prisma, type PrismaClient } from "@gynecology-chatbot/db/prisma";
import { randomUUID } from "crypto";

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
  updated_at: string | Date;
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

type WeekContentPrisma = Pick<
  PrismaClient,
  | "pregnancy_week_data"
  | "pregnancy_day_contents"
  | "week_checklists"
  | "week_questions"
  | "pregnancy_week_media"
>;

type WeekContentRepositoryDeps = {
  select?: typeof supabaseSelect;
  update?: typeof supabaseUpdate;
  insert?: typeof supabaseInsert;
  remove?: typeof supabaseDelete;
  prisma?: WeekContentPrisma;
  hasDirectContentDatabase?: () => boolean;
  createId?: () => string;
};

export class WeekContentRepository {
  private readonly select: typeof supabaseSelect;
  private readonly update: typeof supabaseUpdate;
  private readonly insert: typeof supabaseInsert;
  private readonly remove: typeof supabaseDelete;
  private readonly prisma: WeekContentPrisma;
  private readonly hasDirectContentDatabase: () => boolean;
  private readonly createId: () => string;

  constructor(deps: WeekContentRepositoryDeps = {}) {
    this.select = deps.select ?? supabaseSelect;
    this.update = deps.update ?? supabaseUpdate;
    this.insert = deps.insert ?? supabaseInsert;
    this.remove = deps.remove ?? supabaseDelete;
    this.prisma = deps.prisma ?? prisma;
    this.hasDirectContentDatabase =
      deps.hasDirectContentDatabase ??
      (() => Boolean(process.env.DATABASE_URL));
    this.createId = deps.createId ?? randomUUID;
  }

  async listWeeks(): Promise<SupabaseWeekRow[]> {
    if (this.hasDirectContentDatabase()) {
      return this.prisma.pregnancy_week_data.findMany({
        select: {
          id: true,
          week_number: true,
          title: true,
          baby_size_label: true,
          baby_size_compare_object: true,
          baby_summary: true,
          mother_summary: true,
          warning_signs: true,
          recommended_actions: true,
          status: true,
          updated_at: true,
        },
        orderBy: { week_number: "asc" },
      });
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
      const week = await this.prisma.pregnancy_week_data.findUnique({
        where: { week_number: weekNumber },
        select: {
          id: true,
          week_number: true,
          title: true,
          baby_size_label: true,
          baby_size_compare_object: true,
          baby_summary: true,
          mother_summary: true,
          warning_signs: true,
          recommended_actions: true,
          status: true,
          updated_at: true,
        },
      });
      weekRows = week ? [week] : [];
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
        this.prisma.week_checklists.findMany({
          where: { week_data_id: weekId },
          select: {
            id: true,
            day_number: true,
            code: true,
            title: true,
            description: true,
            display_order: true,
            is_required: true,
            is_active: true,
          },
          orderBy: [
            { day_number: { sort: "asc", nulls: "last" } },
            { display_order: { sort: "asc", nulls: "last" } },
          ],
        }),
        this.prisma.week_questions.findMany({
          where: { week_data_id: weekId },
          select: {
            id: true,
            day_number: true,
            code: true,
            question_type: true,
            question_text: true,
            help_text: true,
            display_order: true,
            is_required: true,
            is_active: true,
          },
          orderBy: [
            { day_number: { sort: "asc", nulls: "last" } },
            { display_order: { sort: "asc", nulls: "last" } },
          ],
        }),
        this.prisma.pregnancy_day_contents.findMany({
          where: { week_data_id: weekId },
          select: {
            id: true,
            day_number: true,
            title: true,
            baby_development_payload: true,
            baby_message: true,
            mother_changes_payload: true,
            display_order: true,
          },
          orderBy: { day_number: "asc" },
        }),
        this.prisma.pregnancy_week_media.findMany({
          where: { week_data_id: weekId },
          select: {
            id: true,
            day_number: true,
            media_scope: true,
            bucket_id: true,
            object_path: true,
            media_role: true,
            alt_text: true,
            source_file_name: true,
            display_order: true,
          },
          orderBy: [
            { day_number: { sort: "asc", nulls: "last" } },
            { display_order: { sort: "asc", nulls: "last" } },
          ],
        }),
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
      await this.prisma.pregnancy_week_data.update({
        where: { id: weekId },
        data: {
          title: input.title,
          baby_size_label: input.babySizeLabel,
          baby_size_compare_object: input.babySizeCompareObject,
          baby_summary: input.babySummary,
          mother_summary: input.motherSummary,
          warning_signs: input.heroImagePath,
          recommended_actions: input.compareImagePath,
          status: input.status,
          updated_at: new Date(),
        },
      });
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
    days: AdminWeekDayInput[],
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
          await this.prisma.pregnancy_day_contents.update({
            where: { id: day.id },
            data: {
              week_data_id: weekId,
              day_number: day.dayNumber,
              title: day.title,
              baby_development_payload: payload.baby_development_payload,
              baby_message: day.babyMessage,
              mother_changes_payload: payload.mother_changes_payload,
              display_order: day.displayOrder,
            },
          });
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
            await this.prisma.pregnancy_day_contents.create({
              data: {
                id: newId,
                week_data_id: weekId,
                day_number: day.dayNumber,
                title: day.title,
                baby_development_payload: payload.baby_development_payload,
                baby_message: day.babyMessage,
                mother_changes_payload: payload.mother_changes_payload,
                display_order: day.displayOrder,
              },
              select: { id: true },
            })
          ).id
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
    sections: AdminWeekSectionInput[],
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
          await this.prisma.week_checklists.update({
            where: { id: section.id },
            data: {
              week_data_id: weekId,
              day_content_id: payload.day_content_id,
              day_number: section.dayNumber,
              code: section.sectionKey,
              title: section.title,
              description: section.body,
              display_order: section.displayOrder,
              is_required: section.isRequired,
              is_active: section.isActive,
            },
          });
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
        await this.prisma.week_checklists.create({
          data: {
            id: newId,
            week_data_id: weekId,
            day_content_id: payload.day_content_id,
            day_number: section.dayNumber,
            code: section.sectionKey,
            title: section.title,
            description: section.body,
            display_order: section.displayOrder,
            is_required: section.isRequired,
            is_active: section.isActive,
          },
        });
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
    assets: AdminWeekAssetInput[],
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
          await this.prisma.week_questions.update({
            where: { id: asset.id },
            data: {
              week_data_id: weekId,
              day_content_id: payload.day_content_id,
              day_number: asset.dayNumber,
              code: asset.styleKey,
              question_type: asset.assetType,
              question_text: asset.storagePath,
              help_text: asset.altText,
              display_order: asset.displayOrder,
              is_required: asset.isRequired,
              is_active: asset.isActive,
            },
          });
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
        await this.prisma.week_questions.create({
          data: {
            id: newId,
            week_data_id: weekId,
            day_content_id: payload.day_content_id,
            day_number: asset.dayNumber,
            code: asset.styleKey,
            question_type: asset.assetType,
            question_text: asset.storagePath,
            help_text: asset.altText,
            display_order: asset.displayOrder,
            is_required: asset.isRequired,
            is_active: asset.isActive,
          },
        });
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
    media: AdminWeekMediaInput[],
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
          await this.prisma.pregnancy_week_media.update({
            where: { id: item.id },
            data: {
              week_data_id: weekId,
              day_content_id: payload.day_content_id,
              day_number: item.dayNumber,
              media_scope: item.mediaScope,
              bucket_id: item.bucketId,
              object_path: item.objectPath,
              media_role: item.mediaRole,
              alt_text: item.altText,
              source_file_name: item.sourceFileName,
              display_order: item.displayOrder,
            },
          });
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
        await this.prisma.pregnancy_week_media.create({
          data: {
            id: newId,
            week_data_id: weekId,
            day_content_id: payload.day_content_id,
            day_number: item.dayNumber,
            media_scope: item.mediaScope,
            bucket_id: item.bucketId,
            object_path: item.objectPath,
            media_role: item.mediaRole,
            alt_text: item.altText,
            source_file_name: item.sourceFileName,
            display_order: item.displayOrder,
          },
        });
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
      await this.prisma.pregnancy_day_contents.delete({ where: { id } });
      return;
    }

    await this.remove(`content.pregnancy_day_contents?id=eq.${id}`);
  }

  async deleteChecklist(id: string): Promise<void> {
    if (this.hasDirectContentDatabase()) {
      await this.prisma.week_checklists.delete({ where: { id } });
      return;
    }

    await this.remove(`content.week_checklists?id=eq.${id}`);
  }

  async deleteQuestion(id: string): Promise<void> {
    if (this.hasDirectContentDatabase()) {
      await this.prisma.week_questions.delete({ where: { id } });
      return;
    }

    await this.remove(`content.week_questions?id=eq.${id}`);
  }

  async deleteMedia(id: string): Promise<void> {
    if (this.hasDirectContentDatabase()) {
      await this.prisma.pregnancy_week_media.delete({ where: { id } });
      return;
    }

    await this.remove(`content.pregnancy_week_media?id=eq.${id}`);
  }
}
