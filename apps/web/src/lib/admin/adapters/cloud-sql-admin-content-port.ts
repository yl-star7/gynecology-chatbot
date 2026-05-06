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
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";
import { randomUUID } from "crypto";

import { embedPregnancyDocument } from "@/lib/mobile/rag";
import { getSchiftClient } from "@/lib/mobile/schift-client";
import { hasDockerConfig } from "@/lib/server-data-provider";
import {
  buildSchiftWorkflowDescription,
  mapSchiftWorkflowRule,
} from "./schift-workflow";
import { patchSchiftWorkflow } from "@/lib/mobile/schift-workflows-api";
import {
  WeekContentRepository,
  type legacyBackendWeekAssetRow,
  type legacyBackendWeekDayRow,
  type legacyBackendWeekMediaRow,
  type legacyBackendWeekRow,
  type legacyBackendWeekSectionRow,
} from "@/lib/db/repositories/week-content-repository";

function hasBackendAdminConfig() {
  return hasDockerConfig();
}

type legacyBackendKnowledgeItemRow = {
  id: string;
  slug: string;
  section: "knowledge" | "notebook";
  title: string;
  body: string;
  image_url: string | null;
  status: "draft" | "published" | "archived";
  updated_at: string | Date;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function hasDirectContentDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

function toVectorLiteral(values: number[]) {
  return `[${values.join(",")}]`;
}

function getAdminActorId(actorId?: string) {
  if (actorId) {
    return actorId;
  }

  const fallbackActorId = process.env.ADMIN_ACTOR_USER_ID;
  if (!fallbackActorId) {
    throw new Error(
      "ADMIN_ACTOR_USER_ID is required for admin write operations",
    );
  }

  return fallbackActorId;
}

function shouldWriteAdminAuditLog(actorId?: string) {
  return Boolean(actorId || process.env.ADMIN_ACTOR_USER_ID);
}

function toInputJsonValue(value: Record<string, unknown>) {
  return value as Prisma.InputJsonValue;
}

async function insertAdminAuditLog(input: {
  actorId?: string;
  actionType: string;
  entityType: string;
  entityId: string | null;
  reason: string;
  beforePayload: Record<string, unknown>;
  afterPayload: Record<string, unknown>;
}) {
  await prisma.admin_audit_logs.create({
    data: {
      admin_user_id: getAdminActorId(input.actorId),
      target_user_id: null,
      action_type: input.actionType,
      entity_type: input.entityType,
      entity_id: input.entityId,
      reason: input.reason,
      before_payload: toInputJsonValue(input.beforePayload),
      after_payload: toInputJsonValue(input.afterPayload),
    },
  });
}

type legacyBackendRagDocumentRow = {
  id: string;
  title: string;
  content: string;
  pregnancy_week: number | null;
  category: string;
  image_url?: string | null;
  metadata: { chunk_count?: number; draft?: boolean } | null;
  created_at?: string | Date;
  updated_at?: string | Date | null;
};

type legacyBackendWorkflowDefinitionRow = {
  id: string;
  name: string;
  slug: string;
  provider: string;
  status: string;
  is_active: boolean;
  config: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  updated_at: string | Date;
};

const sectionComparator = (a: AdminWeekSection, b: AdminWeekSection) =>
  (a.dayNumber ?? 0) - (b.dayNumber ?? 0) || a.displayOrder - b.displayOrder;

const assetComparator = (a: AdminWeekAsset, b: AdminWeekAsset) =>
  (a.dayNumber ?? 0) - (b.dayNumber ?? 0) || a.displayOrder - b.displayOrder;

const dayComparator = (a: AdminWeekDay, b: AdminWeekDay) =>
  a.dayNumber - b.dayNumber || a.displayOrder - b.displayOrder;

const mediaComparator = (a: AdminWeekMedia, b: AdminWeekMedia) =>
  (a.dayNumber ?? 0) - (b.dayNumber ?? 0) || a.displayOrder - b.displayOrder;

const HERO_MEDIA_ROLES = new Set(["hero", "reference", "weekly_summary"]);
const COMPARE_MEDIA_ROLES = new Set(["compare"]);

function toIsoString(value: string | Date | null | undefined) {
  if (!value) {
    return new Date().toISOString();
  }

  return value instanceof Date ? value.toISOString() : value;
}

function mapWeekSummary(row: legacyBackendWeekRow): AdminWeekSummary {
  return {
    id: row.id,
    weekNumber: row.week_number,
    title: row.title ?? `${row.week_number}주차`,
    babySizeLabel: row.baby_size_label,
    babySizeCompareObject: row.baby_size_compare_object,
    babySummary: row.baby_summary,
    motherSummary: row.mother_summary,
    heroImagePath: null,
    compareImagePath: null,
    status: row.status,
    updatedAt: toIsoString(row.updated_at),
  };
}

function buildStoragePath(row: legacyBackendWeekMediaRow) {
  return `storage://${row.bucket_id}/${row.object_path}`;
}

function findWeekMediaPath(
  rows: legacyBackendWeekMediaRow[],
  allowedRoles: Set<string>,
) {
  const match = [...rows]
    .filter(
      (row) =>
        row.media_scope === "week" &&
        row.day_number === null &&
        allowedRoles.has(row.media_role),
    )
    .sort(
      (left, right) =>
        (left.display_order ?? 0) - (right.display_order ?? 0),
    )[0];

  return match ? buildStoragePath(match) : null;
}

function mapSections(rows: legacyBackendWeekSectionRow[]): AdminWeekSection[] {
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

function mapAssets(rows: legacyBackendWeekAssetRow[]): AdminWeekAsset[] {
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

function mapDays(rows: legacyBackendWeekDayRow[]): AdminWeekDay[] {
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

function mapMedia(rows: legacyBackendWeekMediaRow[]): AdminWeekMedia[] {
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
  row: legacyBackendWeekRow,
  days: legacyBackendWeekDayRow[],
  sections: legacyBackendWeekSectionRow[],
  assets: legacyBackendWeekAssetRow[],
  media: legacyBackendWeekMediaRow[],
): AdminWeekDetail {
  const mappedMedia = mapMedia(media);

  return {
    ...mapWeekSummary(row),
    heroImagePath: findWeekMediaPath(media, HERO_MEDIA_ROLES),
    compareImagePath: findWeekMediaPath(media, COMPARE_MEDIA_ROLES),
    babySummary: row.baby_summary ?? "",
    motherSummary: row.mother_summary ?? "",
    days: mapDays(days),
    sections: mapSections(sections),
    assets: mapAssets(assets),
    media: mappedMedia,
  };
}

function mapKnowledgeItem(row: {
  id: string;
  slug: string;
  section: string;
  title: string;
  body: string;
  image_url: string | null;
  status: string;
  updated_at: string | Date;
}): AdminKnowledgeItem {
  return {
    id: row.id,
    slug: row.slug,
    section: row.section as AdminKnowledgeItem["section"],
    title: row.title,
    body: row.body,
    imageUrl: row.image_url ?? null,
    status: row.status as AdminKnowledgeItem["status"],
    updatedAt: toIsoString(row.updated_at),
  };
}

function getDocumentUpdatedAt(row: legacyBackendRagDocumentRow) {
  return toIsoString(row.updated_at ?? row.created_at ?? null);
}

function mapRagDocument(row: legacyBackendRagDocumentRow): AdminRagDocumentDetail {
  const status =
    row.metadata?.draft || row.metadata?.chunk_count === 0 ? "draft" : "ready";

  return {
    id: row.id,
    title: row.title,
    pregnancyWeekLabel: row.pregnancy_week
      ? `${row.pregnancy_week}주차`
      : "공통",
    pregnancyWeek: row.pregnancy_week,
    category: row.category,
    chunkCount: row.metadata?.chunk_count ?? 1,
    updatedAt: getDocumentUpdatedAt(row),
    status,
    content: row.content,
    imageUrl: row.image_url ?? null,
  };
}

function mapWorkflowRule(
  row: legacyBackendWorkflowDefinitionRow,
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

export class CloudSqlAdminContentPortAdapter implements AdminContentPort {
  private readonly fallback = new MockAdminContentAdapter();
  private readonly weekContentRepository = new WeekContentRepository();

  private async selectKnowledgeItemRows() {
    return prisma.content_knowledge_items.findMany({
      select: {
        id: true,
        slug: true,
        section: true,
        title: true,
        body: true,
        image_url: true,
        status: true,
        updated_at: true,
      },
      orderBy: [{ updated_at: "desc" }, { title: "asc" }],
    });
  }

  async createDocument(
    input: AdminRagDocumentInput,
    actorId?: string,
  ): Promise<AdminRagDocumentDetail> {
    if (!hasBackendAdminConfig()) {
      return this.fallback.createDocument(input);
    }

    const embedding = await embedPregnancyDocument(input.content);
    const documentId = randomUUID();
    const imageUrl = input.imageUrl ?? null;
    const metadata = {
      chunk_count: 1,
      draft: false,
      source: "admin_upload",
    };
    const inserted = await prisma.$queryRaw<Array<legacyBackendRagDocumentRow>>`
      INSERT INTO public.content_pregnancy_documents (
        id,
        title,
        content,
        pregnancy_week,
        category,
        image_url,
        embedding,
        metadata,
        created_at
      )
      VALUES (
        ${documentId}::uuid,
        ${input.title},
        ${input.content},
        ${input.pregnancyWeek},
        ${input.category},
        ${imageUrl},
        ${toVectorLiteral(embedding)}::vector,
        ${JSON.stringify(metadata)}::jsonb,
        NOW()
      )
      RETURNING id, title, content, pregnancy_week, category, image_url, metadata, created_at, NULL::timestamptz AS updated_at
    `;

    const document = mapRagDocument(inserted[0] as legacyBackendRagDocumentRow);
    if (shouldWriteAdminAuditLog(actorId)) {
      await insertAdminAuditLog({
        actorId,
        actionType: "content_update",
        entityType: "pregnancy_document",
        entityId: document.id,
        reason: "pregnancy_document_create",
        beforePayload: {},
        afterPayload: {
          title: document.title,
          category: document.category,
          pregnancy_week: document.pregnancyWeek,
          chunk_count: document.chunkCount,
        },
      });
    }

    return document;
  }

  async getDocument(
    documentId: string,
  ): Promise<AdminRagDocumentDetail | null> {
    if (!hasBackendAdminConfig()) {
      return this.fallback.getDocument(documentId);
    }

    if (!isUuid(documentId)) {
      return null;
    }

    const rows = (await prisma.content_pregnancy_documents.findMany({
      where: { id: documentId },
      select: {
        id: true,
        title: true,
        content: true,
        pregnancy_week: true,
        category: true,
        image_url: true,
        metadata: true,
        created_at: true,
        updated_at: true,
      },
      take: 1,
    })) as legacyBackendRagDocumentRow[];

    return rows[0] ? mapRagDocument(rows[0]) : null;
  }

  async updateDocument(
    documentId: string,
    input: AdminRagDocumentInput,
    actorId?: string,
  ): Promise<AdminRagDocumentDetail | null> {
    if (!hasBackendAdminConfig()) {
      return this.fallback.updateDocument(documentId, input);
    }

    if (!isUuid(documentId)) {
      return null;
    }

    const embedding = await embedPregnancyDocument(input.content);
    const imageUrl = input.imageUrl ?? null;
    const beforeDocument = shouldWriteAdminAuditLog(actorId)
      ? await this.getDocument(documentId)
      : null;
    const updated = await prisma.$queryRaw<Array<legacyBackendRagDocumentRow>>`
      UPDATE public.content_pregnancy_documents
         SET title = ${input.title},
             content = ${input.content},
             pregnancy_week = ${input.pregnancyWeek},
             category = ${input.category},
             image_url = ${imageUrl},
             embedding = ${toVectorLiteral(embedding)}::vector,
             updated_at = NOW()
       WHERE id = ${documentId}::uuid
   RETURNING id, title, content, pregnancy_week, category, image_url, metadata, created_at, updated_at
    `;
    const document = updated[0] ? mapRagDocument(updated[0]) : null;
    if (document && shouldWriteAdminAuditLog(actorId)) {
      await insertAdminAuditLog({
        actorId,
        actionType: "content_update",
        entityType: "pregnancy_document",
        entityId: document.id,
        reason: "pregnancy_document_update",
        beforePayload: beforeDocument
          ? {
              title: beforeDocument.title,
              category: beforeDocument.category,
              pregnancy_week: beforeDocument.pregnancyWeek,
              chunk_count: beforeDocument.chunkCount,
            }
          : {},
        afterPayload: {
          title: document.title,
          category: document.category,
          pregnancy_week: document.pregnancyWeek,
          chunk_count: document.chunkCount,
        },
      });
    }

    return document;
  }

  async deleteDocument(documentId: string, actorId?: string): Promise<void> {
    if (!hasBackendAdminConfig()) {
      return this.fallback.deleteDocument(documentId);
    }

    const beforeDocument = shouldWriteAdminAuditLog(actorId)
      ? await this.getDocument(documentId)
      : null;

    if (!isUuid(documentId)) {
      return;
    }

    await prisma.content_pregnancy_documents.delete({
      where: { id: documentId },
    });
    if (shouldWriteAdminAuditLog(actorId)) {
      await insertAdminAuditLog({
        actorId,
        actionType: "content_update",
        entityType: "pregnancy_document",
        entityId: documentId,
        reason: "pregnancy_document_delete",
        beforePayload: beforeDocument
          ? {
              title: beforeDocument.title,
              category: beforeDocument.category,
              pregnancy_week: beforeDocument.pregnancyWeek,
              chunk_count: beforeDocument.chunkCount,
            }
          : {},
        afterPayload: {},
      });
    }
  }

  async updateWorkflowRule(
    id: string,
    input: AdminWorkflowRuleInput,
    actorId?: string,
  ): Promise<AdminWorkflowRule | null> {
    if (!hasBackendAdminConfig()) {
      return this.fallback.updateWorkflowRule(id, input);
    }

    const currentRows = (await prisma.workflow_definitions.findMany({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        provider: true,
        status: true,
        is_active: true,
        config: true,
        metadata: true,
        updated_at: true,
      },
      take: 1,
    })) as legacyBackendWorkflowDefinitionRow[];
    const current = currentRows[0];
    if (!current || current.provider === "schift") {
      const schift = getSchiftClient();
      if (!schift) {
        return null;
      }

      try {
        const workflow = await schift.workflows.get(id);
        const updatedWorkflow = await patchSchiftWorkflow(id, {
          name: input.name,
          description: buildSchiftWorkflowDescription(
            input,
            workflow.description,
          ),
          status: input.status === "active" ? "published" : "draft",
        });

        if (current) {
          const workflowData = {
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
            updated_at: new Date(),
          };

          await prisma.workflow_definitions.update({
            where: { id },
            data: workflowData,
          });
        }

        const workflowRule = mapSchiftWorkflowRule(updatedWorkflow);
        if (shouldWriteAdminAuditLog(actorId)) {
          await insertAdminAuditLog({
            actorId,
            actionType: "content_update",
            entityType: "workflow_rule",
            entityId: workflowRule.id,
            reason: "workflow_rule_update",
            beforePayload: current
              ? {
                  name: current.name,
                  provider: current.provider,
                  status: current.is_active ? "active" : "review",
                }
              : {},
            afterPayload: {
              name: workflowRule.name,
              trigger: workflowRule.trigger,
              retrieval_scope: workflowRule.retrievalScope,
              model_name: workflowRule.modelName,
              status: workflowRule.status,
            },
          });
        }
        return workflowRule;
      } catch {
        return null;
      }
    }

    const workflowData = {
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
      updated_at: new Date(),
    };

    const updated = [
      await prisma.workflow_definitions.update({
        where: { id },
        data: workflowData,
        select: {
          id: true,
          name: true,
          slug: true,
          provider: true,
          status: true,
          is_active: true,
          config: true,
          metadata: true,
          updated_at: true,
        },
      }),
    ] as unknown as Array<legacyBackendWorkflowDefinitionRow>;

    const workflowRule = updated[0] ? mapWorkflowRule(updated[0]) : null;
    if (workflowRule && shouldWriteAdminAuditLog(actorId)) {
      await insertAdminAuditLog({
        actorId,
        actionType: "content_update",
        entityType: "workflow_rule",
        entityId: workflowRule.id,
        reason: "workflow_rule_update",
        beforePayload: current
          ? {
              name: current.name,
              provider: current.provider,
              status: current.is_active ? "active" : "review",
            }
          : {},
        afterPayload: {
          name: workflowRule.name,
          trigger: workflowRule.trigger,
          retrieval_scope: workflowRule.retrievalScope,
          model_name: workflowRule.modelName,
          status: workflowRule.status,
        },
      });
    }

    return workflowRule;
  }

  async listKnowledgeItems(): Promise<AdminKnowledgeItem[]> {
    if (!hasBackendAdminConfig()) {
      return this.fallback.listKnowledgeItems();
    }

    const rows = await this.selectKnowledgeItemRows();

    return rows.map(mapKnowledgeItem);
  }

  async createKnowledgeItem(
    input: AdminKnowledgeItemInput,
    actorId?: string,
  ): Promise<AdminKnowledgeItem> {
    if (!hasBackendAdminConfig()) {
      return this.fallback.createKnowledgeItem(input);
    }

    const imageUrl = input.imageUrl ?? null;
    const inserted = [
      await prisma.content_knowledge_items.create({
        data: {
          id: randomUUID(),
          slug: input.slug,
          section: input.section,
          title: input.title,
          body: input.body,
          image_url: imageUrl,
          status: input.status,
          published_at: input.status === "published" ? new Date() : null,
          updated_at: new Date(),
        },
        select: {
          id: true,
          slug: true,
          section: true,
          title: true,
          body: true,
          image_url: true,
          status: true,
          updated_at: true,
        },
      }),
    ] as unknown as Array<legacyBackendKnowledgeItemRow>;

    const knowledgeItem = mapKnowledgeItem(
      inserted[0] as legacyBackendKnowledgeItemRow,
    );
    if (shouldWriteAdminAuditLog(actorId)) {
      await insertAdminAuditLog({
        actorId,
        actionType: "content_update",
        entityType: "knowledge_item",
        entityId: knowledgeItem.id,
        reason: "knowledge_item_create",
        beforePayload: {},
        afterPayload: {
          slug: knowledgeItem.slug,
          section: knowledgeItem.section,
          title: knowledgeItem.title,
          status: knowledgeItem.status,
        },
      });
    }

    return knowledgeItem;
  }

  async updateKnowledgeItem(
    id: string,
    input: AdminKnowledgeItemInput,
    actorId?: string,
  ): Promise<AdminKnowledgeItem | null> {
    if (!hasBackendAdminConfig()) {
      return this.fallback.updateKnowledgeItem(id, input);
    }

    const imageUrl = input.imageUrl ?? null;
    const beforeItem = shouldWriteAdminAuditLog(actorId)
      ? (await this.selectKnowledgeItemRows()).find((item) => item.id === id)
      : null;
    const updated = [
      await prisma.content_knowledge_items.update({
        where: { id },
        data: {
          slug: input.slug,
          section: input.section,
          title: input.title,
          body: input.body,
          image_url: imageUrl,
          status: input.status,
          published_at:
            input.status === "published"
              ? beforeItem?.status === "published"
                ? undefined
                : new Date()
              : null,
          updated_at: new Date(),
        },
        select: {
          id: true,
          slug: true,
          section: true,
          title: true,
          body: true,
          image_url: true,
          status: true,
          updated_at: true,
        },
      }),
    ] as unknown as Array<legacyBackendKnowledgeItemRow>;
    const knowledgeItem = updated[0] ? mapKnowledgeItem(updated[0]) : null;
    if (knowledgeItem && shouldWriteAdminAuditLog(actorId)) {
      await insertAdminAuditLog({
        actorId,
        actionType: "content_update",
        entityType: "knowledge_item",
        entityId: knowledgeItem.id,
        reason: "knowledge_item_update",
        beforePayload: beforeItem
          ? {
              slug: beforeItem.slug,
              section: beforeItem.section,
              title: beforeItem.title,
              status: beforeItem.status,
            }
          : {},
        afterPayload: {
          slug: knowledgeItem.slug,
          section: knowledgeItem.section,
          title: knowledgeItem.title,
          status: knowledgeItem.status,
        },
      });
    }

    return knowledgeItem;
  }

  async deleteKnowledgeItem(id: string, actorId?: string): Promise<void> {
    if (!hasBackendAdminConfig()) {
      return this.fallback.deleteKnowledgeItem(id);
    }

    const beforeItem = shouldWriteAdminAuditLog(actorId)
      ? (await this.selectKnowledgeItemRows()).find((item) => item.id === id)
      : null;

    await prisma.content_knowledge_items.delete({ where: { id } });
    if (shouldWriteAdminAuditLog(actorId)) {
      await insertAdminAuditLog({
        actorId,
        actionType: "content_update",
        entityType: "knowledge_item",
        entityId: id,
        reason: "knowledge_item_delete",
        beforePayload: beforeItem
          ? {
              slug: beforeItem.slug,
              section: beforeItem.section,
              title: beforeItem.title,
              status: beforeItem.status,
            }
          : {},
        afterPayload: {},
      });
    }
  }

  async listWeeks(): Promise<AdminWeekSummary[]> {
    if (!hasBackendAdminConfig()) {
      return this.fallback.listWeeks();
    }

    const rows = await this.weekContentRepository.listWeeks();

    return rows.map(mapWeekSummary);
  }

  async getWeek(weekNumber: number): Promise<AdminWeekDetail | null> {
    if (!hasBackendAdminConfig()) {
      return this.fallback.getWeek(weekNumber);
    }

    const week = await this.weekContentRepository.getWeek(weekNumber);
    if (!week) {
      return null;
    }

    const { days, sections, assets, media } =
      await this.weekContentRepository.getWeekChildren(week.id);

    return mapWeekDetail(week, days, sections, assets, media);
  }

  async saveWeek(
    weekNumber: number,
    input: AdminWeekUpdateInput,
    actorId?: string,
  ): Promise<AdminWeekDetail | null> {
    if (!hasBackendAdminConfig()) {
      return this.fallback.saveWeek(weekNumber, input);
    }

    const current = await this.getWeek(weekNumber);
    if (!current) {
      return null;
    }

    await this.weekContentRepository.updateWeekSummary(current.id, {
      title: input.title,
      babySizeLabel: input.babySizeLabel,
      babySizeCompareObject: input.babySizeCompareObject,
      babySummary: input.babySummary,
      motherSummary: input.motherSummary,
      heroImagePath: input.heroImagePath,
      compareImagePath: input.compareImagePath,
      status: input.status,
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
    const nextDayIds = new Set(
      input.days
        .map((day) => day.id)
        .filter((dayId): dayId is string => Boolean(dayId)),
    );
    const nextMediaIds = new Set(
      input.media
        .map((media) => media.id)
        .filter((mediaId): mediaId is string => Boolean(mediaId)),
    );

    const removedSectionIds = current.sections
      .map((section) => section.id)
      .filter((sectionId) => !nextSectionIds.has(sectionId));
    const removedAssetIds = current.assets
      .map((asset) => asset.id)
      .filter((assetId) => !nextAssetIds.has(assetId));
    const removedDayIds = current.days
      .map((day) => day.id)
      .filter((dayId) => !nextDayIds.has(dayId));
    const removedMediaIds = current.media
      .map((media) => media.id)
      .filter((mediaId) => !nextMediaIds.has(mediaId));

    for (const sectionId of removedSectionIds) {
      await this.weekContentRepository.deleteChecklist(sectionId);
    }

    for (const assetId of removedAssetIds) {
      await this.weekContentRepository.deleteQuestion(assetId);
    }

    for (const mediaId of removedMediaIds) {
      await this.weekContentRepository.deleteMedia(mediaId);
    }

    for (const dayId of removedDayIds) {
      await this.weekContentRepository.deleteDay(dayId);
    }

    const dayIdByNumber = await this.weekContentRepository.upsertDayContents(
      current.id,
      input.days,
    );

    await this.weekContentRepository.upsertChecklists(
      current.id,
      input.sections,
      dayIdByNumber,
    );
    await this.weekContentRepository.upsertQuestions(
      current.id,
      input.assets,
      dayIdByNumber,
    );
    await this.weekContentRepository.upsertMedia(
      current.id,
      input.media,
      dayIdByNumber,
    );

    const nextWeek = await this.getWeek(weekNumber);
    if (nextWeek && shouldWriteAdminAuditLog(actorId)) {
      await insertAdminAuditLog({
        actorId,
        actionType: "content_update",
        entityType: "pregnancy_week",
        entityId: nextWeek.id,
        reason:
          input.status === "published"
            ? "pregnancy_week_publish"
            : "pregnancy_week_update",
        beforePayload: {
          title: current.title,
          status: current.status,
          day_count: current.days.length,
          checklist_count: current.sections.length,
          question_count: current.assets.length,
          media_count: current.media.length,
        },
        afterPayload: {
          title: nextWeek.title,
          status: nextWeek.status,
          day_count: nextWeek.days.length,
          checklist_count: nextWeek.sections.length,
          question_count: nextWeek.assets.length,
          media_count: nextWeek.media.length,
        },
      });
    }

    return nextWeek;
  }
}
