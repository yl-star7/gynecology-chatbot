import type {
  AdminContentPort,
  AdminKnowledgeItem,
  AdminKnowledgeItemInput,
  AdminRagDocumentDetail,
  AdminRagDocumentInput,
  AdminWeekDay,
  AdminWorkflowRule,
  AdminWorkflowRuleInput,
  AdminWeekAsset,
  AdminWeekDetail,
  AdminWeekMedia,
  AdminWeekSection,
  AdminWeekSummary,
  AdminWeekUpdateInput,
} from "@gynecology-chatbot/app-core";
import { MockAdminContentAdapter } from "@gynecology-chatbot/app-core";
import { randomUUID } from "crypto";

import { embedPregnancyDocument } from "@/lib/mobile/rag";
import { hasDockerConfig, hasSupabaseConfig, resolveServerDataProvider } from "@/lib/server-data-provider";
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
  warning_signs: string | null;
  recommended_actions: string | null;
  status: "draft" | "published" | "archived";
  updated_at: string;
};

type SupabaseWeekSectionRow = {
  id: string;
  day_number: number | null;
  code: string;
  title: string | null;
  description: string | null;
  display_order: number | null;
  is_required: boolean | null;
  is_active: boolean | null;
};

type SupabaseWeekAssetRow = {
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

type SupabaseWeekDayRow = {
  id: string;
  day_number: number;
  title: string | null;
  baby_development_payload: { items?: string[] } | null;
  baby_message: string | null;
  mother_changes_payload: { items?: string[] } | null;
  display_order: number | null;
};

type SupabaseWeekMediaRow = {
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
  (a.dayNumber ?? 0) - (b.dayNumber ?? 0) || a.displayOrder - b.displayOrder;

const assetComparator = (a: AdminWeekAsset, b: AdminWeekAsset) =>
  (a.dayNumber ?? 0) - (b.dayNumber ?? 0) || a.displayOrder - b.displayOrder;

const dayComparator = (a: AdminWeekDay, b: AdminWeekDay) =>
  a.dayNumber - b.dayNumber || a.displayOrder - b.displayOrder;

const mediaComparator = (a: AdminWeekMedia, b: AdminWeekMedia) =>
  (a.dayNumber ?? 0) - (b.dayNumber ?? 0) || a.displayOrder - b.displayOrder;

function mapWeekSummary(row: SupabaseWeekRow): AdminWeekSummary {
  return {
    id: row.id,
    weekNumber: row.week_number,
    title: row.title ?? `${row.week_number}주차`,
    babySizeLabel: row.baby_size_label,
    babySizeCompareObject: row.baby_size_compare_object,
    babySummary: row.baby_summary,
    motherSummary: row.mother_summary,
    heroImagePath: row.warning_signs,
    compareImagePath: row.recommended_actions,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

function mapSections(rows: SupabaseWeekSectionRow[]): AdminWeekSection[] {
  return rows
    .map((row) => ({
      id: row.id,
      dayNumber: row.day_number,
      sectionKey: row.code,
      title: row.title ?? "",
      body: row.description ?? "",
      displayOrder: row.display_order ?? 0,
      isRequired: Boolean(row.is_required),
      isActive: row.is_active ?? true,
    }))
    .sort(sectionComparator);
}

function mapAssets(rows: SupabaseWeekAssetRow[]): AdminWeekAsset[] {
  return rows
    .map((row) => ({
      id: row.id,
      dayNumber: row.day_number,
      assetType: row.question_type,
      storagePath: row.question_text,
      altText: row.help_text ?? null,
      styleKey: row.code ?? null,
      displayOrder: row.display_order ?? 0,
      isRequired: Boolean(row.is_required),
      isActive: row.is_active ?? true,
    }))
    .sort(assetComparator);
}

function mapDays(rows: SupabaseWeekDayRow[]): AdminWeekDay[] {
  return rows
    .map((row) => ({
      id: row.id,
      dayNumber: row.day_number,
      title: row.title ?? `Day ${row.day_number}`,
      babyDevelopmentItems: row.baby_development_payload?.items ?? [],
      babyMessage: row.baby_message,
      motherChangesItems: row.mother_changes_payload?.items ?? [],
      displayOrder: row.display_order ?? row.day_number,
    }))
    .sort(dayComparator);
}

function mapMedia(rows: SupabaseWeekMediaRow[]): AdminWeekMedia[] {
  return rows
    .map((row) => ({
      id: row.id,
      dayNumber: row.day_number,
      mediaScope: row.media_scope,
      bucketId: row.bucket_id,
      objectPath: row.object_path,
      mediaRole: row.media_role,
      altText: row.alt_text,
      sourceFileName: row.source_file_name,
      displayOrder: row.display_order ?? 0,
    }))
    .sort(mediaComparator);
}

function mapWeekDetail(
  row: SupabaseWeekRow,
  days: SupabaseWeekDayRow[],
  sections: SupabaseWeekSectionRow[],
  assets: SupabaseWeekAssetRow[],
  media: SupabaseWeekMediaRow[],
): AdminWeekDetail {
  return {
    ...mapWeekSummary(row),
    babySummary: row.baby_summary ?? "",
    motherSummary: row.mother_summary ?? "",
    days: mapDays(days),
    sections: mapSections(sections),
    assets: mapAssets(assets),
    media: mapMedia(media),
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

    const embedding = await embedPregnancyDocument(input.content);
    const inserted = await supabaseInsert<Array<SupabaseRagDocumentRow>>(
      "content.pregnancy_documents",
      {
        id: randomUUID(),
        title: input.title,
        content: input.content,
        pregnancy_week: input.pregnancyWeek,
        category: input.category,
        embedding,
        metadata: {
          chunk_count: 1,
          draft: false,
          source: "admin_upload",
        },
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
      `content.pregnancy_documents?select=id,title,content,pregnancy_week,category,metadata,created_at&id=eq.${documentId}&limit=1`,
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

    const embedding = await embedPregnancyDocument(input.content);
    const updated = await supabaseUpdate<Array<SupabaseRagDocumentRow>>(
      `content.pregnancy_documents?id=eq.${documentId}`,
      {
        title: input.title,
        content: input.content,
        pregnancy_week: input.pregnancyWeek,
        category: input.category,
        embedding,
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
      "content.pregnancy_week_data?select=id,week_number,title,baby_size_label,baby_size_compare_object,baby_summary,mother_summary,warning_signs,recommended_actions,status,updated_at&order=week_number.asc",
    );

    return rows.map(mapWeekSummary);
  }

  async getWeek(weekNumber: number): Promise<AdminWeekDetail | null> {
    if (!hasBackendAdminConfig()) {
      return this.fallback.getWeek(weekNumber);
    }

    const weekRows = await supabaseSelect<Array<SupabaseWeekRow>>(
      `content.pregnancy_week_data?select=id,week_number,title,baby_size_label,baby_size_compare_object,baby_summary,mother_summary,warning_signs,recommended_actions,status,updated_at&week_number=eq.${weekNumber}&limit=1`,
    );

    const week = weekRows[0];
    if (!week) {
      return null;
    }

    const sections = await supabaseSelect<Array<SupabaseWeekSectionRow>>(
      `content.week_checklists?select=id,day_number,code,title,description,display_order,is_required,is_active&week_data_id=eq.${week.id}&order=day_number.asc.nullslast,display_order.asc.nullslast`,
    );

    const assets = await supabaseSelect<Array<SupabaseWeekAssetRow>>(
      `content.week_questions?select=id,day_number,code,question_type,question_text,help_text,display_order,is_required,is_active&week_data_id=eq.${week.id}&order=day_number.asc.nullslast,display_order.asc.nullslast`,
    );

    const days = await supabaseSelect<Array<SupabaseWeekDayRow>>(
      `content.pregnancy_day_contents?select=id,day_number,title,baby_development_payload,baby_message,mother_changes_payload,display_order&week_data_id=eq.${week.id}&order=day_number.asc`,
    );

    const media = await supabaseSelect<Array<SupabaseWeekMediaRow>>(
      `content.pregnancy_week_media?select=id,day_number,media_scope,bucket_id,object_path,media_role,alt_text,source_file_name,display_order&week_data_id=eq.${week.id}&order=day_number.asc.nullslast,display_order.asc.nullslast`,
    );

    return mapWeekDetail(week, days, sections, assets, media);
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

    await supabaseUpdate(`content.pregnancy_week_data?id=eq.${current.id}`, {
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
    const nextDayIds = new Set(
      input.days
        .map((day) => day.id)
        .filter((dayId): dayId is string => Boolean(dayId)),
    );
    const removedDayIds = current.days
      .map((day) => day.id)
      .filter((dayId) => !nextDayIds.has(dayId));
    const nextMediaIds = new Set(
      input.media
        .map((media) => media.id)
        .filter((mediaId): mediaId is string => Boolean(mediaId)),
    );
    const removedMediaIds = current.media
      .map((media) => media.id)
      .filter((mediaId) => !nextMediaIds.has(mediaId));

    for (const sectionId of removedSectionIds) {
      await supabaseDelete(`content.week_checklists?id=eq.${sectionId}`);
    }

    for (const assetId of removedAssetIds) {
      await supabaseDelete(`content.week_questions?id=eq.${assetId}`);
    }

    for (const mediaId of removedMediaIds) {
      await supabaseDelete(`content.pregnancy_week_media?id=eq.${mediaId}`);
    }

    for (const dayId of removedDayIds) {
      await supabaseDelete(`content.pregnancy_day_contents?id=eq.${dayId}`);
    }

    const dayIdByNumber = new Map<number, string>();

    for (const day of input.days) {
      const payload = {
        week_data_id: current.id,
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
        await supabaseUpdate(`content.pregnancy_day_contents?id=eq.${day.id}`, payload);
        dayIdByNumber.set(day.dayNumber, day.id);
        continue;
      }

      const inserted = await supabaseInsert<Array<{ id: string }>>(
        "content.pregnancy_day_contents",
        {
          id: randomUUID(),
          ...payload,
        },
      );
      const insertedDayId = inserted[0]?.id;
      if (insertedDayId) {
        dayIdByNumber.set(day.dayNumber, insertedDayId);
      }
    }

    for (const section of input.sections) {
      const payload = {
        week_data_id: current.id,
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
        await supabaseUpdate(`content.week_checklists?id=eq.${section.id}`, payload);
        continue;
      }

      await supabaseInsert("content.week_checklists", {
        id: randomUUID(),
        ...payload,
      });
    }

    for (const asset of input.assets) {
      const payload = {
        week_data_id: current.id,
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
        await supabaseUpdate(`content.week_questions?id=eq.${asset.id}`, payload);
        continue;
      }

      await supabaseInsert("content.week_questions", {
        id: randomUUID(),
        ...payload,
      });
    }

    for (const media of input.media) {
      const payload = {
        week_data_id: current.id,
        day_content_id:
          media.dayNumber !== null
            ? (dayIdByNumber.get(media.dayNumber) ?? null)
            : null,
        day_number: media.dayNumber,
        media_scope: media.mediaScope,
        bucket_id: media.bucketId,
        object_path: media.objectPath,
        media_role: media.mediaRole,
        alt_text: media.altText,
        source_file_name: media.sourceFileName,
        display_order: media.displayOrder,
      };

      if (media.id) {
        await supabaseUpdate(`content.pregnancy_week_media?id=eq.${media.id}`, payload);
        continue;
      }

      await supabaseInsert("content.pregnancy_week_media", {
        id: randomUUID(),
        ...payload,
      });
    }

    return this.getWeek(weekNumber);
  }
}
