import type {
  AdminContentPort,
  AdminKnowledgeItem,
  AdminKnowledgeItemInput,
  AdminRagDocumentDetail,
  AdminRagDocumentInput,
  AdminWorkflowRule,
  AdminWorkflowRuleInput,
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
  supabaseDelete,
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

type SupabaseKnowledgeItemRow = {
  id: string;
  slug: string;
  section: "knowledge" | "notebook";
  title: string;
  body: string;
  status: "draft" | "published" | "archived";
  updated_at: string;
};

type SupabaseRagDocumentRow = {
  id: string;
  title: string;
  content: string;
  pregnancy_week: number | null;
  category: string;
  metadata: { chunk_count?: number; draft?: boolean } | null;
  created_at?: string;
  updated_at?: string | null;
};

type SupabaseWorkflowDefinitionRow = {
  id: string;
  name: string;
  slug: string;
  provider: string;
  status: string;
  is_active: boolean;
  config: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  updated_at: string;
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

function mapKnowledgeItem(
  row: SupabaseKnowledgeItemRow,
): AdminKnowledgeItem {
  return {
    id: row.id,
    slug: row.slug,
    section: row.section,
    title: row.title,
    body: row.body,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

function getDocumentUpdatedAt(row: SupabaseRagDocumentRow) {
  return row.updated_at ?? row.created_at ?? new Date().toISOString();
}

function mapRagDocument(row: SupabaseRagDocumentRow): AdminRagDocumentDetail {
  const status =
    row.metadata?.draft || row.metadata?.chunk_count === 0 ? "draft" : "ready";

  return {
    id: row.id,
    title: row.title,
    pregnancyWeekLabel: row.pregnancy_week ? `${row.pregnancy_week}주차` : "공통",
    pregnancyWeek: row.pregnancy_week,
    category: row.category,
    chunkCount: row.metadata?.chunk_count ?? 1,
    updatedAt: getDocumentUpdatedAt(row),
    status,
    content: row.content,
  };
}

function mapWorkflowRule(
  row: SupabaseWorkflowDefinitionRow,
): AdminWorkflowRule {
  const trigger =
    typeof row.metadata?.trigger === "string"
      ? row.metadata.trigger
      : typeof row.config?.trigger === "string"
        ? row.config.trigger
        : row.provider;
  const retrievalScope =
    typeof row.metadata?.retrievalScope === "string"
      ? row.metadata.retrievalScope
      : typeof row.config?.retrievalScope === "string"
        ? row.config.retrievalScope
        : "기본 범위";
  const modelName =
    typeof row.metadata?.modelName === "string"
      ? row.metadata.modelName
      : typeof row.config?.modelName === "string"
        ? row.config.modelName
        : "미설정";

  return {
    id: row.id,
    name: row.name,
    trigger,
    retrievalScope,
    modelName,
    status: row.is_active ? "active" : "review",
  };
}

export class SupabaseAdminContentPortAdapter implements AdminContentPort {
  private readonly fallback = new MockAdminContentAdapter();

  async createDocument(
    input: AdminRagDocumentInput,
  ): Promise<AdminRagDocumentDetail> {
    if (!hasBackendAdminConfig()) {
      return this.fallback.createDocument(input);
    }

    const inserted = await supabaseInsert<Array<SupabaseRagDocumentRow>>(
      "content.pregnancy_documents",
      {
        id: randomUUID(),
        title: input.title,
        content: input.content,
        pregnancy_week: input.pregnancyWeek,
        category: input.category,
        metadata: {
          chunk_count: 1,
          draft: false,
          source: "admin_upload",
        },
        updated_at: new Date().toISOString(),
      },
    );

    return mapRagDocument(inserted[0] as SupabaseRagDocumentRow);
  }

  async getDocument(
    documentId: string,
  ): Promise<AdminRagDocumentDetail | null> {
    if (!hasBackendAdminConfig()) {
      return this.fallback.getDocument(documentId);
    }

    const rows = await supabaseSelect<Array<SupabaseRagDocumentRow>>(
      `content.pregnancy_documents?select=id,title,content,pregnancy_week,category,metadata,created_at,updated_at&id=eq.${documentId}&limit=1`,
    );

    return rows[0] ? mapRagDocument(rows[0]) : null;
  }

  async updateDocument(
    documentId: string,
    input: AdminRagDocumentInput,
  ): Promise<AdminRagDocumentDetail | null> {
    if (!hasBackendAdminConfig()) {
      return this.fallback.updateDocument(documentId, input);
    }

    const updated = await supabaseUpdate<Array<SupabaseRagDocumentRow>>(
      `content.pregnancy_documents?id=eq.${documentId}`,
      {
        title: input.title,
        content: input.content,
        pregnancy_week: input.pregnancyWeek,
        category: input.category,
        updated_at: new Date().toISOString(),
      },
    );

    return updated[0] ? mapRagDocument(updated[0]) : null;
  }

  async deleteDocument(documentId: string): Promise<void> {
    if (!hasBackendAdminConfig()) {
      return this.fallback.deleteDocument(documentId);
    }

    await supabaseDelete(`content.pregnancy_documents?id=eq.${documentId}`);
  }

  async updateWorkflowRule(
    id: string,
    input: AdminWorkflowRuleInput,
  ): Promise<AdminWorkflowRule | null> {
    if (!hasBackendAdminConfig()) {
      return this.fallback.updateWorkflowRule(id, input);
    }

    const currentRows = await supabaseSelect<Array<SupabaseWorkflowDefinitionRow>>(
      `workflow_definitions?select=id,name,slug,provider,status,is_active,config,metadata,updated_at&id=eq.${id}&limit=1`,
    );
    const current = currentRows[0];
    if (!current) {
      return null;
    }

    const updated = await supabaseUpdate<Array<SupabaseWorkflowDefinitionRow>>(
      `workflow_definitions?id=eq.${id}`,
      {
        name: input.name,
        status: input.status === "active" ? "published" : "draft",
        is_active: input.status === "active",
        config: {
          ...(current.config ?? {}),
          modelName: input.modelName,
          retrievalScope: input.retrievalScope,
        },
        metadata: {
          ...(current.metadata ?? {}),
          trigger: input.trigger,
          retrievalScope: input.retrievalScope,
          modelName: input.modelName,
        },
        updated_at: new Date().toISOString(),
      },
    );

    return updated[0] ? mapWorkflowRule(updated[0]) : null;
  }

  async listKnowledgeItems(): Promise<AdminKnowledgeItem[]> {
    if (!hasBackendAdminConfig()) {
      return this.fallback.listKnowledgeItems();
    }

    const rows = await supabaseSelect<Array<SupabaseKnowledgeItemRow>>(
      "content.knowledge_items?select=id,slug,section,title,body,status,updated_at&order=updated_at.desc",
    );

    return rows.map(mapKnowledgeItem);
  }

  async createKnowledgeItem(
    input: AdminKnowledgeItemInput,
  ): Promise<AdminKnowledgeItem> {
    if (!hasBackendAdminConfig()) {
      return this.fallback.createKnowledgeItem(input);
    }

    const inserted = await supabaseInsert<Array<SupabaseKnowledgeItemRow>>(
      "content.knowledge_items",
      {
        id: randomUUID(),
        slug: input.slug,
        section: input.section,
        title: input.title,
        body: input.body,
        status: input.status,
        updated_at: new Date().toISOString(),
      },
    );

    return mapKnowledgeItem(inserted[0] as SupabaseKnowledgeItemRow);
  }

  async updateKnowledgeItem(
    id: string,
    input: AdminKnowledgeItemInput,
  ): Promise<AdminKnowledgeItem | null> {
    if (!hasBackendAdminConfig()) {
      return this.fallback.updateKnowledgeItem(id, input);
    }

    const updated = await supabaseUpdate<Array<SupabaseKnowledgeItemRow>>(
      `content.knowledge_items?id=eq.${id}`,
      {
        slug: input.slug,
        section: input.section,
        title: input.title,
        body: input.body,
        status: input.status,
        updated_at: new Date().toISOString(),
      },
    );

    return updated[0] ? mapKnowledgeItem(updated[0]) : null;
  }

  async deleteKnowledgeItem(id: string): Promise<void> {
    if (!hasBackendAdminConfig()) {
      return this.fallback.deleteKnowledgeItem(id);
    }

    await supabaseDelete(`content.knowledge_items?id=eq.${id}`);
  }

  async listWeeks(): Promise<AdminWeekSummary[]> {
    if (!hasBackendAdminConfig()) {
      return this.fallback.listWeeks();
    }

    const rows = await supabaseSelect<Array<SupabaseWeekRow>>(
      "content.pregnancy_weeks?select=id,week_number,title,baby_size_label,baby_size_compare_object,baby_summary,mother_summary,hero_image_path,compare_image_path,status,updated_at&order=week_number.asc",
    );

    return rows.map(mapWeekSummary);
  }

  async getWeek(weekNumber: number): Promise<AdminWeekDetail | null> {
    if (!hasBackendAdminConfig()) {
      return this.fallback.getWeek(weekNumber);
    }

    const weekRows = await supabaseSelect<Array<SupabaseWeekRow>>(
      `content.pregnancy_weeks?select=id,week_number,title,baby_size_label,baby_size_compare_object,baby_summary,mother_summary,hero_image_path,compare_image_path,status,updated_at&week_number=eq.${weekNumber}&limit=1`,
    );

    const week = weekRows[0];
    if (!week) {
      return null;
    }

    const sections = await supabaseSelect<Array<SupabaseWeekSectionRow>>(
      `content.pregnancy_week_sections?select=id,section_key,title,body,display_order,is_required&week_id=eq.${week.id}&order=display_order.asc.nullslast`,
    );

    const assets = await supabaseSelect<Array<SupabaseWeekAssetRow>>(
      `content.pregnancy_week_assets?select=id,asset_type,storage_path,alt_text,style_key,display_order&week_id=eq.${week.id}&order=display_order.asc.nullslast`,
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

    await supabaseUpdate(`content.pregnancy_weeks?id=eq.${current.id}`, {
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

    const nextSectionIds = new Set(
      input.sections
        .map((section) => section.id)
        .filter((sectionId): sectionId is string => Boolean(sectionId)),
    );
    const nextAssetIds = new Set(
      input.assets
        .map((asset) => asset.id)
        .filter((assetId): assetId is string => Boolean(assetId)),
    );

    const removedSectionIds = current.sections
      .map((section) => section.id)
      .filter((sectionId) => !nextSectionIds.has(sectionId));
    const removedAssetIds = current.assets
      .map((asset) => asset.id)
      .filter((assetId) => !nextAssetIds.has(assetId));

    for (const sectionId of removedSectionIds) {
      await supabaseDelete(`content.pregnancy_week_sections?id=eq.${sectionId}`);
    }

    for (const assetId of removedAssetIds) {
      await supabaseDelete(`content.pregnancy_week_assets?id=eq.${assetId}`);
    }

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
        await supabaseUpdate(`content.pregnancy_week_sections?id=eq.${section.id}`, payload);
        continue;
      }

      await supabaseInsert("content.pregnancy_week_sections", {
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
        await supabaseUpdate(`content.pregnancy_week_assets?id=eq.${asset.id}`, payload);
        continue;
      }

      await supabaseInsert("content.pregnancy_week_assets", {
        id: randomUUID(),
        ...payload,
      });
    }

    return this.getWeek(weekNumber);
  }
}
