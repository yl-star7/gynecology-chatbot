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

  const sectionKey = normalizeText(section.sectionKey);
  const title = normalizeText(section.title);
  const body = normalizeText(section.body);

  if (!sectionKey || !title || !body) {
    return null;
  }

  return {
    id: normalizeNullableText(section.id),
    sectionKey,
    title,
    body,
    displayOrder:
      typeof section.displayOrder === "number" ? section.displayOrder : 0,
    isRequired: Boolean(section.isRequired),
  };
}

function parseAssetInput(asset: unknown) {
  if (!isRecord(asset)) {
    return null;
  }

  const assetType = normalizeText(asset.assetType);
  const storagePath = normalizeText(asset.storagePath);

  if (!assetType || !storagePath) {
    return null;
  }

  return {
    id: normalizeNullableText(asset.id),
    assetType,
    storagePath,
    altText: normalizeNullableText(asset.altText),
    styleKey: normalizeNullableText(asset.styleKey),
    displayOrder:
      typeof asset.displayOrder === "number" ? asset.displayOrder : 0,
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
  const sections = Array.isArray(record.sections) ? record.sections : null;
  const assets = Array.isArray(record.assets) ? record.assets : null;

  if (
    !title ||
    !babySummary ||
    !motherSummary ||
    !isValidWeekStatus(status) ||
    !sections ||
    !assets
  ) {
    return null;
  }

  const normalizedSections = sections.map(parseSectionInput);
  const normalizedAssets = assets.map(parseAssetInput);
  const sectionKeys = new Set<string>();
  const hasDuplicateSectionKey = normalizedSections.some((section) => {
    if (!section) {
      return false;
    }

    if (sectionKeys.has(section.sectionKey)) {
      return true;
    }

    sectionKeys.add(section.sectionKey);
    return false;
  });

  if (
    normalizedSections.some((section) => !section) ||
    normalizedAssets.some((asset) => !asset) ||
    hasDuplicateSectionKey
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
    sections: normalizedSections as AdminWeekUpdateInput["sections"],
    assets: normalizedAssets as AdminWeekUpdateInput["assets"],
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
