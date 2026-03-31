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
import { Pool } from "pg";

import { embedPregnancyDocument } from "@/lib/mobile/rag";
import { getSchiftClient } from "@/lib/mobile/schift-client";
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
import {
  buildSchiftWorkflowDescription,
  mapSchiftWorkflowRule,
} from "./schift-workflow";
import { patchSchiftWorkflow } from "@/lib/mobile/schift-workflows-api";
import {
  WeekContentRepository,
  type SupabaseWeekAssetRow,
  type SupabaseWeekDayRow,
  type SupabaseWeekMediaRow,
  type SupabaseWeekRow,
  type SupabaseWeekSectionRow,
} from "@/lib/db/repositories/week-content-repository";

function hasBackendAdminConfig() {
  const provider = resolveServerDataProvider();
  return provider === "docker" ? hasDockerConfig() : hasSupabaseConfig();
}

type SupabaseKnowledgeItemRow = {
  id: string;
  slug: string;
  section: "knowledge" | "notebook";
  title: string;
  body: string;
  image_url: string | null;
  status: "draft" | "published" | "archived";
  updated_at: string;
};

type PublicKnowledgeItemRow = SupabaseKnowledgeItemRow;

let contentWritePool: Pool | null = null;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function hasDirectContentDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

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

async function insertAdminAuditLog(input: {
  actorId?: string;
  actionType: string;
  entityType: string;
  entityId: string | null;
  reason: string;
  beforePayload: Record<string, unknown>;
  afterPayload: Record<string, unknown>;
}) {
  await supabaseInsert("admin_audit_logs", {
    admin_user_id: getAdminActorId(input.actorId),
    target_user_id: null,
    action_type: input.actionType,
    entity_type: input.entityType,
    entity_id: input.entityId,
    reason: input.reason,
    before_payload: input.beforePayload,
    after_payload: input.afterPayload,
  });
}

type SupabaseRagDocumentRow = {
  id: string;
  title: string;
  content: string;
  pregnancy_week: number | null;
  category: string;
  image_url?: string | null;
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

function mapKnowledgeItem(row: SupabaseKnowledgeItemRow): AdminKnowledgeItem {
  return {
    id: row.id,
    slug: row.slug,
    section: row.section,
    title: row.title,
    body: row.body,
    imageUrl: row.image_url ?? null,
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
  private readonly weekContentRepository = new WeekContentRepository();

  private async selectKnowledgeItemRows() {
    if (hasDirectContentDatabase()) {
      return queryContentRows<SupabaseKnowledgeItemRow>(
        `
          SELECT id, slug, section, title, body, image_url, status, updated_at
          FROM content.knowledge_items
          ORDER BY updated_at DESC NULLS LAST, title ASC
        `,
      );
    }

    try {
      return await supabaseSelect<Array<PublicKnowledgeItemRow>>(
        "published_knowledge_items?select=id,slug,section,title,body,image_url,status,updated_at&order=updated_at.desc",
      );
    } catch (error) {
      console.error(
        "public knowledge items unavailable, falling back to content schema",
        error,
      );
      return supabaseSelect<Array<SupabaseKnowledgeItemRow>>(
        "content.knowledge_items?select=id,slug,section,title,body,image_url,status,updated_at&order=updated_at.desc",
      );
    }
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
    const inserted = hasDirectContentDatabase()
      ? await queryContentRows<SupabaseRagDocumentRow>(
          `
            INSERT INTO content.pregnancy_documents (
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
            VALUES ($1::uuid, $2, $3, $4, $5, $6, $7::vector, $8::jsonb, NOW())
            RETURNING id, title, content, pregnancy_week, category, image_url, metadata, created_at, NULL::timestamptz AS updated_at
          `,
          [
            documentId,
            input.title,
            input.content,
            input.pregnancyWeek,
            input.category,
            imageUrl,
            toVectorLiteral(embedding),
            JSON.stringify(metadata),
          ],
        )
      : await supabaseInsert<Array<SupabaseRagDocumentRow>>(
          "content.pregnancy_documents",
          {
            id: documentId,
            title: input.title,
            content: input.content,
            pregnancy_week: input.pregnancyWeek,
            category: input.category,
            image_url: imageUrl,
            embedding,
            metadata,
          },
        );

    const document = mapRagDocument(inserted[0] as SupabaseRagDocumentRow);
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

    const rows = hasDirectContentDatabase()
      ? await queryContentRows<SupabaseRagDocumentRow>(
          `
            SELECT id, title, content, pregnancy_week, category, image_url, metadata, created_at, NULL::timestamptz AS updated_at
            FROM content.pregnancy_documents
            WHERE id = $1::uuid
            LIMIT 1
          `,
          [documentId],
        )
      : ((await supabaseSelect<Array<SupabaseRagDocumentRow>>(
          `content.pregnancy_documents?select=id,title,content,pregnancy_week,category,image_url,metadata,created_at&id=eq.${documentId}&limit=1`,
        )) ?? []);

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
    const updated = hasDirectContentDatabase()
      ? await queryContentRows<SupabaseRagDocumentRow>(
          `
            UPDATE content.pregnancy_documents
               SET title = $2,
                   content = $3,
                   pregnancy_week = $4,
                   category = $5,
                   image_url = $6,
                   embedding = $7::vector
             WHERE id = $1::uuid
         RETURNING id, title, content, pregnancy_week, category, image_url, metadata, created_at, NULL::timestamptz AS updated_at
          `,
          [
            documentId,
            input.title,
            input.content,
            input.pregnancyWeek,
            input.category,
            imageUrl,
            toVectorLiteral(embedding),
          ],
        )
      : await supabaseUpdate<Array<SupabaseRagDocumentRow>>(
          `content.pregnancy_documents?id=eq.${documentId}`,
          {
            title: input.title,
            content: input.content,
            pregnancy_week: input.pregnancyWeek,
            category: input.category,
            image_url: imageUrl,
            embedding,
          },
        );
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

    if (hasDirectContentDatabase()) {
      await queryContentRows(
        `DELETE FROM content.pregnancy_documents WHERE id = $1::uuid RETURNING id`,
        [documentId],
      );
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
      return;
    }

    await supabaseDelete(`content.pregnancy_documents?id=eq.${documentId}`);
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

    const currentRows =
      (await supabaseSelect<Array<SupabaseWorkflowDefinitionRow>>(
        `workflow_definitions?select=id,name,slug,provider,status,is_active,config,metadata,updated_at&id=eq.${id}&limit=1`,
      )) ?? [];
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
          await supabaseUpdate<Array<SupabaseWorkflowDefinitionRow>>(
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
    const inserted = hasDirectContentDatabase()
      ? await queryContentRows<SupabaseKnowledgeItemRow>(
          `
            INSERT INTO content.knowledge_items (
              id,
              slug,
              section,
              title,
              body,
              image_url,
              status,
              published_at,
              updated_at
            )
            VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, CASE WHEN $7 = 'published' THEN NOW() ELSE NULL END, NOW())
            RETURNING id, slug, section, title, body, image_url, status, updated_at
          `,
          [
            randomUUID(),
            input.slug,
            input.section,
            input.title,
            input.body,
            imageUrl,
            input.status,
          ],
        )
      : await supabaseInsert<Array<SupabaseKnowledgeItemRow>>(
          "content.knowledge_items",
          {
            id: randomUUID(),
            slug: input.slug,
            section: input.section,
            title: input.title,
            body: input.body,
            image_url: imageUrl,
            status: input.status,
            updated_at: new Date().toISOString(),
          },
        );

    const knowledgeItem = mapKnowledgeItem(
      inserted[0] as SupabaseKnowledgeItemRow,
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
    const updated = hasDirectContentDatabase()
      ? await queryContentRows<SupabaseKnowledgeItemRow>(
          `
            UPDATE content.knowledge_items
               SET slug = $2,
                   section = $3,
                   title = $4,
                   body = $5,
                   image_url = $6,
                   status = $7,
                   published_at = CASE
                     WHEN $7 = 'published' THEN COALESCE(published_at, NOW())
                     ELSE NULL
                   END,
                   updated_at = NOW()
             WHERE id = $1::uuid
         RETURNING id, slug, section, title, body, image_url, status, updated_at
          `,
          [
            id,
            input.slug,
            input.section,
            input.title,
            input.body,
            imageUrl,
            input.status,
          ],
        )
      : await supabaseUpdate<Array<SupabaseKnowledgeItemRow>>(
          `content.knowledge_items?id=eq.${id}`,
          {
            slug: input.slug,
            section: input.section,
            title: input.title,
            body: input.body,
            image_url: imageUrl,
            status: input.status,
            updated_at: new Date().toISOString(),
          },
        );
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

    if (hasDirectContentDatabase()) {
      await queryContentRows(
        `DELETE FROM content.knowledge_items WHERE id = $1::uuid RETURNING id`,
        [id],
      );
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
      return;
    }

    await supabaseDelete(`content.knowledge_items?id=eq.${id}`);
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
