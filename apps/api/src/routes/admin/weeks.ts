import { randomUUID } from "crypto";
import { Hono } from "hono";
import type {
  AdminWeekAsset,
  AdminWeekDay,
  AdminWeekDetail,
  AdminWeekMedia,
  AdminWeekSection,
  AdminWeekSummary,
  AdminWeekUpdateInput,
} from "@gynecology-chatbot/app-core";
import { prisma } from "@gynecology-chatbot/db/prisma";

import { createAdminAuditLog } from "./audit.js";
import { requireAdminProxy, type AdminProxyVariables } from "./auth.js";

const app = new Hono<{ Variables: AdminProxyVariables }>();

app.use("*", requireAdminProxy);

const HERO_MEDIA_ROLES = new Set(["hero", "reference", "weekly_summary"]);
const COMPARE_MEDIA_ROLES = new Set(["compare"]);

function toIsoString(value: Date | string | null | undefined) {
  if (!value) {
    return new Date().toISOString();
  }

  return value instanceof Date ? value.toISOString() : value;
}

function buildStoragePath(row: { bucket_id: string; object_path: string }) {
  return `storage://${row.bucket_id}/${row.object_path}`;
}

function findWeekMediaPath(
  rows: Array<{
    media_scope: string;
    day_number: number | null;
    media_role: string;
    display_order: number | null;
    bucket_id: string;
    object_path: string;
  }>,
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

function mapWeekSummary(row: {
  id: string;
  week_number: number;
  title: string | null;
  baby_size_label: string | null;
  baby_size_compare_object: string | null;
  baby_summary: string | null;
  mother_summary: string | null;
  status: string;
  updated_at: Date | string;
}): AdminWeekSummary {
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
    status: row.status as AdminWeekSummary["status"],
    updatedAt: toIsoString(row.updated_at),
  };
}

function mapDays(
  rows: Array<{
    id: string;
    day_number: number;
    title: string | null;
    baby_development_payload: unknown;
    baby_message: string | null;
    mother_changes_payload: unknown;
    display_order: number | null;
  }>,
): AdminWeekDay[] {
  return rows
    .map((row) => ({
      id: row.id,
      dayNumber: row.day_number,
      title: row.title ?? `Day ${row.day_number}`,
      babyDevelopmentItems:
        typeof row.baby_development_payload === "object" &&
        row.baby_development_payload &&
        "items" in row.baby_development_payload &&
        Array.isArray(row.baby_development_payload.items)
          ? row.baby_development_payload.items.filter(
              (item): item is string => typeof item === "string",
            )
          : [],
      babyMessage: row.baby_message,
      motherChangesItems:
        typeof row.mother_changes_payload === "object" &&
        row.mother_changes_payload &&
        "items" in row.mother_changes_payload &&
        Array.isArray(row.mother_changes_payload.items)
          ? row.mother_changes_payload.items.filter(
              (item): item is string => typeof item === "string",
            )
          : [],
      displayOrder: row.display_order ?? row.day_number,
    }))
    .sort((a, b) => a.dayNumber - b.dayNumber || a.displayOrder - b.displayOrder);
}

function mapSections(
  rows: Array<{
    id: string;
    day_number: number | null;
    code: string;
    title: string;
    description: string | null;
    display_order: number | null;
    is_required: boolean | null;
    is_active: boolean | null;
  }>,
): AdminWeekSection[] {
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
    .sort(
      (a, b) => (a.dayNumber ?? 0) - (b.dayNumber ?? 0) || a.displayOrder - b.displayOrder,
    );
}

function mapAssets(
  rows: Array<{
    id: string;
    day_number: number | null;
    code: string;
    question_type: string;
    question_text: string;
    help_text: string | null;
    display_order: number | null;
    is_required: boolean | null;
    is_active: boolean | null;
  }>,
): AdminWeekAsset[] {
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
    .sort(
      (a, b) => (a.dayNumber ?? 0) - (b.dayNumber ?? 0) || a.displayOrder - b.displayOrder,
    );
}

function mapMedia(
  rows: Array<{
    id: string;
    day_number: number | null;
    media_scope: string;
    bucket_id: string;
    object_path: string;
    media_role: string;
    alt_text: string | null;
    source_file_name: string | null;
    display_order: number | null;
  }>,
): AdminWeekMedia[] {
  return rows
    .map((row) => ({
      id: row.id,
      dayNumber: row.day_number,
      mediaScope: row.media_scope as AdminWeekMedia["mediaScope"],
      bucketId: row.bucket_id,
      objectPath: row.object_path,
      mediaRole: row.media_role,
      altText: row.alt_text,
      sourceFileName: row.source_file_name,
      displayOrder: row.display_order ?? 0,
    }))
    .sort(
      (a, b) => (a.dayNumber ?? 0) - (b.dayNumber ?? 0) || a.displayOrder - b.displayOrder,
    );
}

async function getWeekDetail(weekNumber: number): Promise<AdminWeekDetail | null> {
  const week = await prisma.content_pregnancy_week_data.findUnique({
    where: { week_number: weekNumber },
  });
  if (!week) {
    return null;
  }

  const [days, sections, assets, media] = await Promise.all([
    prisma.content_pregnancy_day_contents.findMany({
      where: { week_data_id: week.id },
      orderBy: [{ day_number: "asc" }, { display_order: "asc" }],
    }),
    prisma.content_week_checklists.findMany({
      where: { week_data_id: week.id },
      orderBy: [{ day_number: "asc" }, { display_order: "asc" }],
    }),
    prisma.content_week_questions.findMany({
      where: { week_data_id: week.id },
      orderBy: [{ day_number: "asc" }, { display_order: "asc" }],
    }),
    prisma.content_pregnancy_week_media.findMany({
      where: { week_data_id: week.id },
      orderBy: [{ day_number: "asc" }, { display_order: "asc" }],
    }),
  ]);

  return {
    ...mapWeekSummary(week),
    heroImagePath: findWeekMediaPath(media, HERO_MEDIA_ROLES),
    compareImagePath: findWeekMediaPath(media, COMPARE_MEDIA_ROLES),
    babySummary: week.baby_summary ?? "",
    motherSummary: week.mother_summary ?? "",
    days: mapDays(days),
    sections: mapSections(sections),
    assets: mapAssets(assets),
    media: mapMedia(media),
  };
}

app.get("/content/weeks", async (c) => {
  try {
    const rows = await prisma.content_pregnancy_week_data.findMany({
      orderBy: { week_number: "asc" },
    });
    return c.json({ weeks: rows.map(mapWeekSummary) });
  } catch (error) {
    console.error("admin api weeks list error", error);
    return c.json({ error: "failed to load weeks" }, 500);
  }
});

app.get("/content/weeks/:weekNumber", async (c) => {
  try {
    const weekNumber = Number(c.req.param("weekNumber"));
    if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 40) {
      return c.json({ error: "invalid week number" }, 400);
    }

    const week = await getWeekDetail(weekNumber);
    if (!week) {
      return c.json({ error: "week not found" }, 404);
    }

    return c.json({ week });
  } catch (error) {
    console.error("admin api week detail error", error);
    return c.json({ error: "failed to load week detail" }, 500);
  }
});

app.patch("/content/weeks/:weekNumber", async (c) => {
  try {
    const weekNumber = Number(c.req.param("weekNumber"));
    if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 40) {
      return c.json({ error: "invalid week number" }, 400);
    }

    const input = (await c.req.json()) as AdminWeekUpdateInput;
    const current = await getWeekDetail(weekNumber);
    if (!current) {
      return c.json({ error: "week not found" }, 404);
    }

    await prisma.content_pregnancy_week_data.update({
      where: { id: current.id },
      data: {
        title: input.title,
        baby_size_label: input.babySizeLabel,
        baby_size_compare_object: input.babySizeCompareObject,
        baby_summary: input.babySummary,
        mother_summary: input.motherSummary,
        status: input.status,
        updated_at: new Date(),
      },
    });

    const nextDayIds = new Set(input.days.map((day) => day.id).filter(Boolean));
    const nextSectionIds = new Set(
      input.sections.map((section) => section.id).filter(Boolean),
    );
    const nextAssetIds = new Set(input.assets.map((asset) => asset.id).filter(Boolean));
    const nextMediaIds = new Set(input.media.map((media) => media.id).filter(Boolean));

    await Promise.all([
      ...current.sections
        .filter((section) => !nextSectionIds.has(section.id))
        .map((section) => prisma.content_week_checklists.delete({ where: { id: section.id } })),
      ...current.assets
        .filter((asset) => !nextAssetIds.has(asset.id))
        .map((asset) => prisma.content_week_questions.delete({ where: { id: asset.id } })),
      ...current.media
        .filter((media) => !nextMediaIds.has(media.id))
        .map((media) => prisma.content_pregnancy_week_media.delete({ where: { id: media.id } })),
      ...current.days
        .filter((day) => !nextDayIds.has(day.id))
        .map((day) => prisma.content_pregnancy_day_contents.delete({ where: { id: day.id } })),
    ]);

    const dayIdByNumber = new Map<number, string>();
    for (const day of input.days) {
      const id = day.id || randomUUID();
      const data = {
        week_data_id: current.id,
        day_number: day.dayNumber,
        title: day.title,
        baby_development_payload: { items: day.babyDevelopmentItems },
        baby_message: day.babyMessage,
        mother_changes_payload: { items: day.motherChangesItems },
        display_order: day.displayOrder,
      };
      if (day.id) {
        await prisma.content_pregnancy_day_contents.update({ where: { id }, data });
      } else {
        await prisma.content_pregnancy_day_contents.create({ data: { id, ...data } });
      }
      dayIdByNumber.set(day.dayNumber, id);
    }

    for (const section of input.sections) {
      const id = section.id || randomUUID();
      const data = {
        week_data_id: current.id,
        day_content_id:
          section.dayNumber !== null ? (dayIdByNumber.get(section.dayNumber) ?? null) : null,
        day_number: section.dayNumber,
        code: section.sectionKey,
        title: section.title,
        description: section.body,
        display_order: section.displayOrder,
        is_required: section.isRequired,
        is_active: section.isActive,
      };
      if (section.id) {
        await prisma.content_week_checklists.update({ where: { id }, data });
      } else {
        await prisma.content_week_checklists.create({ data: { id, ...data } });
      }
    }

    for (const asset of input.assets) {
      const id = asset.id || randomUUID();
      const data = {
        week_data_id: current.id,
        day_content_id:
          asset.dayNumber !== null ? (dayIdByNumber.get(asset.dayNumber) ?? null) : null,
        day_number: asset.dayNumber,
        code: asset.styleKey ?? asset.assetType,
        question_type: asset.assetType,
        question_text: asset.storagePath,
        help_text: asset.altText,
        display_order: asset.displayOrder,
        is_required: asset.isRequired,
        is_active: asset.isActive,
      };
      if (asset.id) {
        await prisma.content_week_questions.update({ where: { id }, data });
      } else {
        await prisma.content_week_questions.create({ data: { id, ...data } });
      }
    }

    for (const media of input.media) {
      const id = media.id || randomUUID();
      const data = {
        week_data_id: current.id,
        day_content_id:
          media.dayNumber !== null ? (dayIdByNumber.get(media.dayNumber) ?? null) : null,
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
        await prisma.content_pregnancy_week_media.update({ where: { id }, data });
      } else {
        await prisma.content_pregnancy_week_media.create({ data: { id, ...data } });
      }
    }

    const nextWeek = await getWeekDetail(weekNumber);
    if (nextWeek) {
      await createAdminAuditLog({
        adminUserId: c.get("adminUserId"),
        targetUserId: null,
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

    return c.json({ week: nextWeek });
  } catch (error) {
    console.error("admin api week update error", error);
    return c.json({ error: "failed to update week detail" }, 500);
  }
});

export default app;
