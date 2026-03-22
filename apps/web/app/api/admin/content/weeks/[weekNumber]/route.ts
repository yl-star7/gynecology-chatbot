import { NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { createAdminServices } from "@/lib/admin/create-admin-services";
import type { AdminWeekUpdateInput } from "@gynecology-chatbot/app-core";

function parseWeekNumber(weekNumber: string) {
  const numericWeekNumber = Number(weekNumber);
  if (
    !Number.isInteger(numericWeekNumber) ||
    numericWeekNumber < 1 ||
    numericWeekNumber > 40
  ) {
    return null;
  }

  return numericWeekNumber;
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNullableText(value: unknown) {
  const nextValue = normalizeText(value);
  return nextValue ? nextValue : null;
}

function normalizeInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function normalizeDayNumber(value: unknown) {
  const nextValue = normalizeInteger(value);
  if (nextValue === null) {
    return null;
  }

  if (nextValue < 1 || nextValue > 7) {
    return null;
  }

  return nextValue;
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeText(item))
    .filter((item) => item.length > 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isValidWeekStatus(value: unknown): value is AdminWeekUpdateInput["status"] {
  return value === "draft" || value === "published" || value === "archived";
}

function parseSectionInput(section: unknown) {
  if (!isRecord(section)) {
    return null;
  }

  const dayNumber = section.dayNumber === null ? null : normalizeDayNumber(section.dayNumber);
  const sectionKey = normalizeText(section.sectionKey);
  const title = normalizeText(section.title);
  const body = normalizeText(section.body);

  if (!sectionKey || !title || !body || section.dayNumber !== null && dayNumber === null) {
    return null;
  }

  return {
    id: normalizeNullableText(section.id),
    dayNumber,
    sectionKey,
    title,
    body,
    displayOrder:
      typeof section.displayOrder === "number" ? section.displayOrder : 0,
    isRequired: Boolean(section.isRequired),
    isActive:
      typeof section.isActive === "boolean" ? section.isActive : true,
  };
}

function parseAssetInput(asset: unknown) {
  if (!isRecord(asset)) {
    return null;
  }

  const dayNumber = asset.dayNumber === null ? null : normalizeDayNumber(asset.dayNumber);
  const assetType = normalizeText(asset.assetType);
  const storagePath = normalizeText(asset.storagePath);

  if (!assetType || !storagePath || asset.dayNumber !== null && dayNumber === null) {
    return null;
  }

  return {
    id: normalizeNullableText(asset.id),
    dayNumber,
    assetType,
    storagePath,
    altText: normalizeNullableText(asset.altText),
    styleKey: normalizeNullableText(asset.styleKey),
    displayOrder:
      typeof asset.displayOrder === "number" ? asset.displayOrder : 0,
    isRequired: Boolean(asset.isRequired),
    isActive:
      typeof asset.isActive === "boolean" ? asset.isActive : true,
  };
}

function parseDayInput(day: unknown) {
  if (!isRecord(day)) {
    return null;
  }

  const dayNumber = normalizeDayNumber(day.dayNumber);
  if (dayNumber === null) {
    return null;
  }

  return {
    id: normalizeNullableText(day.id),
    dayNumber,
    title: normalizeText(day.title) || `Day ${dayNumber}`,
    babyDevelopmentItems: normalizeStringArray(day.babyDevelopmentItems),
    babyMessage: normalizeNullableText(day.babyMessage),
    motherChangesItems: normalizeStringArray(day.motherChangesItems),
    displayOrder:
      typeof day.displayOrder === "number" ? day.displayOrder : dayNumber,
  };
}

function parseMediaInput(media: unknown) {
  if (!isRecord(media)) {
    return null;
  }

  const mediaScope =
    media.mediaScope === "week" || media.mediaScope === "day"
      ? media.mediaScope
      : null;
  const dayNumber = media.dayNumber === null ? null : normalizeDayNumber(media.dayNumber);
  const bucketId = normalizeText(media.bucketId);
  const objectPath = normalizeText(media.objectPath);
  const mediaRole = normalizeText(media.mediaRole);

  if (
    !mediaScope ||
    !bucketId ||
    !objectPath ||
    !mediaRole ||
    (mediaScope === "day" && dayNumber === null) ||
    (media.dayNumber !== null && media.dayNumber !== undefined && dayNumber === null)
  ) {
    return null;
  }

  return {
    id: normalizeNullableText(media.id),
    dayNumber,
    mediaScope,
    bucketId,
    objectPath,
    mediaRole,
    altText: normalizeNullableText(media.altText),
    sourceFileName: normalizeNullableText(media.sourceFileName),
    displayOrder:
      typeof media.displayOrder === "number" ? media.displayOrder : 0,
  };
}

function parseWeekUpdateInput(body: unknown): AdminWeekUpdateInput | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = body as Record<string, unknown>;
  const title = normalizeText(record.title);
  const babySummary = normalizeText(record.babySummary);
  const motherSummary = normalizeText(record.motherSummary);
  const status = record.status;
  const days = Array.isArray(record.days) ? record.days : [];
  const sections = Array.isArray(record.sections) ? record.sections : [];
  const assets = Array.isArray(record.assets) ? record.assets : [];
  const media = Array.isArray(record.media) ? record.media : [];

  if (
    !title ||
    !babySummary ||
    !motherSummary ||
    !isValidWeekStatus(status)
  ) {
    return null;
  }

  const normalizedDays = days.map(parseDayInput);
  const normalizedSections = sections.map(parseSectionInput);
  const normalizedAssets = assets.map(parseAssetInput);
  const normalizedMedia = media.map(parseMediaInput);
  const dayNumbers = new Set<number>();
  const duplicateDayNumber = normalizedDays.some((day) => {
    if (!day) {
      return false;
    }

    if (dayNumbers.has(day.dayNumber)) {
      return true;
    }

    dayNumbers.add(day.dayNumber);
    return false;
  });
  const sectionKeys = new Set<string>();
  const hasDuplicateSectionKey = normalizedSections.some((section) => {
    if (!section) {
      return false;
    }

    const compositeKey = `${section.dayNumber ?? 0}:${section.sectionKey}`;
    if (sectionKeys.has(compositeKey)) {
      return true;
    }

    sectionKeys.add(compositeKey);
    return false;
  });
  const assetKeys = new Set<string>();
  const hasDuplicateAssetKey = normalizedAssets.some((asset) => {
    if (!asset) {
      return false;
    }

    const compositeKey = `${asset.dayNumber ?? 0}:${asset.styleKey ?? asset.assetType}:${asset.storagePath}`;
    if (assetKeys.has(compositeKey)) {
      return true;
    }

    assetKeys.add(compositeKey);
    return false;
  });

  if (
    normalizedDays.some((day) => !day) ||
    normalizedSections.some((section) => !section) ||
    normalizedAssets.some((asset) => !asset) ||
    normalizedMedia.some((entry) => !entry) ||
    duplicateDayNumber ||
    hasDuplicateSectionKey ||
    hasDuplicateAssetKey
  ) {
    return null;
  }

  return {
    title,
    babySizeLabel: normalizeNullableText(record.babySizeLabel),
    babySizeCompareObject: normalizeNullableText(record.babySizeCompareObject),
    babySummary,
    motherSummary,
    heroImagePath: normalizeNullableText(record.heroImagePath),
    compareImagePath: normalizeNullableText(record.compareImagePath),
    status,
    days: normalizedDays as AdminWeekUpdateInput["days"],
    sections: normalizedSections as AdminWeekUpdateInput["sections"],
    assets: normalizedAssets as AdminWeekUpdateInput["assets"],
    media: normalizedMedia as AdminWeekUpdateInput["media"],
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ weekNumber: string }> },
) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { weekNumber } = await context.params;
    const numericWeekNumber = parseWeekNumber(weekNumber);
    if (!numericWeekNumber) {
      return NextResponse.json(
        { error: "invalid week number" },
        { status: 400 },
      );
    }

    const services = createAdminServices();
    const week = await services.adminContentPort.getWeek(numericWeekNumber);
    if (!week) {
      return NextResponse.json({ error: "week not found" }, { status: 404 });
    }

    return NextResponse.json({ week });
  } catch (error) {
    console.error("admin content week detail route error", error);
    return NextResponse.json(
      { error: "failed to load week detail" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ weekNumber: string }> },
) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { weekNumber } = await context.params;
    const numericWeekNumber = parseWeekNumber(weekNumber);
    if (!numericWeekNumber) {
      return NextResponse.json(
        { error: "invalid week number" },
        { status: 400 },
      );
    }

    const payload = parseWeekUpdateInput(await request.json());
    if (!payload) {
      return NextResponse.json(
        { error: "invalid week payload" },
        { status: 400 },
      );
    }

    const services = createAdminServices();
    const week = await services.adminContentPort.saveWeek(
      numericWeekNumber,
      payload,
    );
    if (!week) {
      return NextResponse.json({ error: "week not found" }, { status: 404 });
    }

    return NextResponse.json({ week });
  } catch (error) {
    console.error("admin content week update route error", error);
    return NextResponse.json(
      { error: "failed to update week detail" },
      { status: 500 },
    );
  }
}
