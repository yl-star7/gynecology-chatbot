import type {
  AdminContentPort,
  AdminWeekAsset,
  AdminWeekDetail,
  AdminWeekSection,
  AdminWeekSummary,
  AdminWeekUpdateInput,
} from "@gynecology-chatbot/app-core";
import { MockAdminContentAdapter } from "@gynecology-chatbot/app-core";
import { randomUUID } from "crypto";

import {
  hasDockerConfig,
  hasSupabaseConfig,
  resolveServerDataProvider,
} from "@/lib/server-data-provider";
import {
  supabaseInsert,
  supabaseSelect,
  supabaseUpdate,
} from "@/lib/mobile/supabase-rest";

function hasBackendAdminConfig() {
  const provider = resolveServerDataProvider();
  return provider === "docker" ? hasDockerConfig() : hasSupabaseConfig();
}

type SupabaseWeekRow = {
  id: string;
  week_number: number;
  title: string | null;
  baby_size_label: string | null;
  baby_size_compare_object: string | null;
  baby_summary: string | null;
  mother_summary: string | null;
  hero_image_path: string | null;
  compare_image_path: string | null;
  status: "draft" | "published" | "archived";
  updated_at: string;
};

type SupabaseWeekSectionRow = {
  id: string;
  section_key: string;
  title: string | null;
  body: string | null;
  display_order: number | null;
  is_required: boolean | null;
};

type SupabaseWeekAssetRow = {
  id: string;
  asset_type: string;
  storage_path: string;
  alt_text: string | null;
  style_key: string | null;
  display_order: number | null;
};

const sectionComparator = (a: AdminWeekSection, b: AdminWeekSection) =>
  a.displayOrder - b.displayOrder;

const assetComparator = (a: AdminWeekAsset, b: AdminWeekAsset) =>
  a.displayOrder - b.displayOrder;

function mapWeekSummary(row: SupabaseWeekRow): AdminWeekSummary {
  return {
    id: row.id,
    weekNumber: row.week_number,
    title: row.title ?? `${row.week_number}주차`,
    babySizeLabel: row.baby_size_label,
    babySizeCompareObject: row.baby_size_compare_object,
    babySummary: row.baby_summary,
    motherSummary: row.mother_summary,
    heroImagePath: row.hero_image_path,
    compareImagePath: row.compare_image_path,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

function mapSections(rows: SupabaseWeekSectionRow[]): AdminWeekSection[] {
  return rows
    .map((row) => ({
      id: row.id,
      sectionKey: row.section_key,
      title: row.title ?? "",
      body: row.body ?? "",
      displayOrder: row.display_order ?? 0,
      isRequired: Boolean(row.is_required),
    }))
    .sort(sectionComparator);
}

function mapAssets(rows: SupabaseWeekAssetRow[]): AdminWeekAsset[] {
  return rows
    .map((row) => ({
      id: row.id,
      assetType: row.asset_type,
      storagePath: row.storage_path,
      altText: row.alt_text ?? null,
      styleKey: row.style_key ?? null,
      displayOrder: row.display_order ?? 0,
    }))
    .sort(assetComparator);
}

function mapWeekDetail(
  row: SupabaseWeekRow,
  sections: SupabaseWeekSectionRow[],
  assets: SupabaseWeekAssetRow[],
): AdminWeekDetail {
  return {
    ...mapWeekSummary(row),
    babySummary: row.baby_summary ?? "",
    motherSummary: row.mother_summary ?? "",
    sections: mapSections(sections),
    assets: mapAssets(assets),
  };
}

export class SupabaseAdminContentPortAdapter implements AdminContentPort {
  private readonly fallback = new MockAdminContentAdapter();

  async listWeeks(): Promise<AdminWeekSummary[]> {
    if (!hasBackendAdminConfig()) {
      return this.fallback.listWeeks();
    }

    const rows = await supabaseSelect<Array<SupabaseWeekRow>>(
      "pregnancy_weeks?select=id,week_number,title,baby_size_label,baby_size_compare_object,baby_summary,mother_summary,hero_image_path,compare_image_path,status,updated_at&order=week_number.asc",
    );

    return rows.map(mapWeekSummary);
  }

  async getWeek(weekNumber: number): Promise<AdminWeekDetail | null> {
    if (!hasBackendAdminConfig()) {
      return this.fallback.getWeek(weekNumber);
    }

    const weekRows = await supabaseSelect<Array<SupabaseWeekRow>>(
      `pregnancy_weeks?select=id,week_number,title,baby_size_label,baby_size_compare_object,baby_summary,mother_summary,hero_image_path,compare_image_path,status,updated_at&week_number=eq.${weekNumber}&limit=1`,
    );

    const week = weekRows[0];
    if (!week) {
      return null;
    }

    const sections = await supabaseSelect<Array<SupabaseWeekSectionRow>>(
      `pregnancy_week_sections?select=id,section_key,title,body,display_order,is_required&week_id=eq.${week.id}&order=display_order.asc.nullslast`,
    );

    const assets = await supabaseSelect<Array<SupabaseWeekAssetRow>>(
      `pregnancy_week_assets?select=id,asset_type,storage_path,alt_text,style_key,display_order&week_id=eq.${week.id}&order=display_order.asc.nullslast`,
    );

    return mapWeekDetail(week, sections, assets);
  }

  async saveWeek(
    weekNumber: number,
    input: AdminWeekUpdateInput,
  ): Promise<AdminWeekDetail | null> {
    if (!hasBackendAdminConfig()) {
      return this.fallback.saveWeek(weekNumber, input);
    }

    const current = await this.getWeek(weekNumber);
    if (!current) {
      return null;
    }

    await supabaseUpdate(`pregnancy_weeks?id=eq.${current.id}`, {
      title: input.title,
      baby_size_label: input.babySizeLabel,
      baby_size_compare_object: input.babySizeCompareObject,
      baby_summary: input.babySummary,
      mother_summary: input.motherSummary,
      hero_image_path: input.heroImagePath,
      compare_image_path: input.compareImagePath,
      status: input.status,
      updated_at: new Date().toISOString(),
    });

    for (const section of input.sections) {
      const payload = {
        week_id: current.id,
        section_key: section.sectionKey,
        title: section.title,
        body: section.body,
        display_order: section.displayOrder,
        is_required: section.isRequired,
      };

      if (section.id) {
        await supabaseUpdate(`pregnancy_week_sections?id=eq.${section.id}`, payload);
        continue;
      }

      await supabaseInsert("pregnancy_week_sections", {
        id: randomUUID(),
        ...payload,
      });
    }

    for (const asset of input.assets) {
      const payload = {
        week_id: current.id,
        asset_type: asset.assetType,
        storage_path: asset.storagePath,
        alt_text: asset.altText,
        style_key: asset.styleKey,
        display_order: asset.displayOrder,
      };

      if (asset.id) {
        await supabaseUpdate(`pregnancy_week_assets?id=eq.${asset.id}`, payload);
        continue;
      }

      await supabaseInsert("pregnancy_week_assets", {
        id: randomUUID(),
        ...payload,
      });
    }

    return this.getWeek(weekNumber);
  }
}
