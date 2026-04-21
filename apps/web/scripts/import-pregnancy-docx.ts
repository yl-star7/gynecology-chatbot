import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import mammoth from "mammoth";
import { Storage } from "@google-cloud/storage";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";
import {
  extractImagePlacements,
  getStorageObjectPath,
  groupImagePlacementsByScope,
  parsePregnancyWeekDocText,
  type ParsedPregnancyWeek,
} from "../src/lib/content/pregnancy-docx-import";

type CliOptions = {
  input: string;
  bucket: string;
  apply: boolean;
  output: string | null;
  weekFrom: number | null;
  weekTo: number | null;
  skipMedia: boolean;
};

type WeekRow = {
  id: string;
  week_number: number;
};

type DayRow = {
  id: string;
  day_number: number;
};

type ImagePlacementRecord = {
  weekNumber: number;
  dayNumber: number;
  target: string;
  order: number;
};

const EXEC_MAX_BUFFER = 64 * 1024 * 1024;

function parseArgs(argv: string[]): CliOptions {
  let input = "";
  let bucket = "pregnancy-content";
  let apply = false;
  let output: string | null = null;
  let weekFrom: number | null = null;
  let weekTo: number | null = null;
  let skipMedia = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--input") {
      input = argv[index + 1] ?? "";
      index += 1;
      continue;
    }
    if (arg === "--bucket") {
      bucket = argv[index + 1] ?? bucket;
      index += 1;
      continue;
    }
    if (arg === "--output") {
      output = argv[index + 1] ?? null;
      index += 1;
      continue;
    }
    if (arg === "--week-from") {
      weekFrom = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    if (arg === "--week-to") {
      weekTo = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    if (arg === "--apply") {
      apply = true;
      continue;
    }
    if (arg === "--skip-media") {
      skipMedia = true;
    }
  }

  if (!input) {
    throw new Error("--input <docx path> is required");
  }

  return {
    input: resolve(input),
    bucket,
    apply,
    output: output ? resolve(output) : null,
    weekFrom,
    weekTo,
    skipMedia,
  };
}

function tryExecFile(command: string, args: string[]) {
  try {
    return execFileSync(command, args, { maxBuffer: EXEC_MAX_BUFFER });
  } catch {
    return null;
  }
}

async function extractRawText(docxPath: string) {
  const textutilOutput = tryExecFile("textutil", [
    "-convert",
    "txt",
    "-stdout",
    docxPath,
  ]);
  if (textutilOutput) {
    return textutilOutput.toString("utf8");
  }

  const result = await mammoth.extractRawText({ path: docxPath });
  return result.value;
}

function readZipEntry(docxPath: string, entryPath: string) {
  return execFileSync("unzip", ["-p", docxPath, entryPath], {
    stdio: ["ignore", "pipe", "ignore"],
    maxBuffer: EXEC_MAX_BUFFER,
  });
}

function guessContentType(fileName: string) {
  switch (extname(fileName).toLowerCase()) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

function deriveSizeLabel(week: ParsedPregnancyWeek) {
  const candidates = week.days.flatMap((day) => day.babyDevelopment);
  for (const candidate of candidates) {
    const lemonMatch = candidate.match(/아기의 크기는 ([^,]+?)만큼/);
    if (lemonMatch) {
      return lemonMatch[1].trim();
    }
    const sizeMatch = candidate.match(
      /([가-힣A-Za-z0-9~]+)\s*크기(?:예요|에요|예요\.)?/,
    );
    if (sizeMatch) {
      return sizeMatch[1].trim();
    }
  }
  return null;
}

function toWeekPayload(week: ParsedPregnancyWeek) {
  const summaryDay =
    week.days.find((day) => day.dayNumber === 7) ?? week.days[0];
  const sizeLabel = deriveSizeLabel(week);

  return {
    title: week.title,
    baby_size_label: sizeLabel,
    baby_size_compare_object: sizeLabel,
    baby_summary: summaryDay?.babyDevelopment.join(" ") ?? null,
    mother_summary: summaryDay?.motherChanges.join(" ") ?? null,
    checklist_intro: "오늘 함께 해 봐요",
    question_intro: "아기와 나누는 마음",
    status: "published",
    updated_at: new Date(),
  };
}

function toDayPayload(week: ParsedPregnancyWeek, dayNumber: number) {
  const day = week.days.find((entry) => entry.dayNumber === dayNumber);
  if (!day) {
    throw new Error(
      `Missing parsed day ${dayNumber} for week ${week.weekNumber}`,
    );
  }

  return {
    title: `Day ${day.dayNumber}`,
    baby_development_payload: { items: day.babyDevelopment },
    baby_message: day.babyMessage,
    mother_changes_payload: { items: day.motherChanges },
    display_order: day.dayNumber,
    updated_at: new Date(),
  };
}

function buildDryRunSummary(
  weeks: ParsedPregnancyWeek[],
  placements: ImagePlacementRecord[],
) {
  return {
    weeks: weeks.map((week) => ({
      weekNumber: week.weekNumber,
      dayCount: week.days.length,
      checklistCount: week.days.reduce(
        (total, day) => total + day.checklistItems.length,
        0,
      ),
      questionCount: week.days.reduce(
        (total, day) => total + day.questions.length,
        0,
      ),
    })),
    groupedMedia: groupImagePlacementsByScope(placements).map((group) => ({
      weekNumber: group.weekNumber,
      scope: group.scope,
      dayNumber: group.dayNumber,
      imageCount: group.placements.length,
    })),
    imagePlacements: placements,
  };
}

function getStorageClient() {
  return new Storage({
    projectId:
      process.env.GCS_PROJECT_ID ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      undefined,
  });
}

async function ensureBucket(bucketId: string) {
  const bucket = getStorageClient().bucket(bucketId);
  const [exists] = await bucket.exists();
  if (!exists) {
    await bucket.create();
  }
  return bucket;
}

async function upsertWeek(week: ParsedPregnancyWeek) {
  const existing = await prisma.pregnancy_week_data.findUnique({
    where: { week_number: week.weekNumber },
    select: { id: true, week_number: true },
  });
  const payload = {
    week_number: week.weekNumber,
    ...toWeekPayload(week),
  };

  if (existing) {
    await prisma.pregnancy_week_data.update({
      where: { id: existing.id },
      data: payload,
    });
    return existing.id;
  }

  const inserted = await prisma.pregnancy_week_data.create({
    data: {
      id: randomUUID(),
      ...payload,
    },
    select: { id: true },
  });
  return inserted.id;
}

async function upsertDay(
  weekDataId: string,
  week: ParsedPregnancyWeek,
  dayNumber: number,
) {
  const existing = await prisma.pregnancy_day_contents.findFirst({
    where: { week_data_id: weekDataId, day_number: dayNumber },
    select: { id: true, day_number: true },
  });
  const payload = {
    week_data_id: weekDataId,
    day_number: dayNumber,
    ...toDayPayload(week, dayNumber),
  };

  if (existing) {
    await prisma.pregnancy_day_contents.update({
      where: { id: existing.id },
      data: payload,
    });
    return existing.id;
  }

  const inserted = await prisma.pregnancy_day_contents.create({
    data: {
      id: randomUUID(),
      ...payload,
    },
    select: { id: true },
  });
  return inserted.id;
}

async function replaceChecklistRows(
  weekDataId: string,
  dayContentId: string,
  week: ParsedPregnancyWeek,
  dayNumber: number,
) {
  const day = week.days.find((entry) => entry.dayNumber === dayNumber);
  if (!day) {
    return;
  }

  await prisma.week_checklists.deleteMany({
    where: { day_content_id: dayContentId },
  });
  if (day.checklistItems.length === 0) {
    return;
  }

  await prisma.week_checklists.createMany({
    data: day.checklistItems.map((item, index) => ({
      id: randomUUID(),
      week_data_id: weekDataId,
      day_content_id: dayContentId,
      day_number: dayNumber,
      code: `day-${String(dayNumber).padStart(2, "0")}-checklist-${String(
        index + 1,
      ).padStart(2, "0")}`,
      title: item,
      description: item,
      checklist_payload: {
        item,
        inputType: "yes_no",
        yesLabel: "예",
        noLabel: "아니오",
      },
      display_order: index + 1,
      is_required: false,
      is_active: true,
      updated_at: new Date(),
    })),
  });
}

async function replaceQuestionRows(
  weekDataId: string,
  dayContentId: string,
  week: ParsedPregnancyWeek,
  dayNumber: number,
) {
  const day = week.days.find((entry) => entry.dayNumber === dayNumber);
  if (!day) {
    return;
  }

  await prisma.week_questions.deleteMany({
    where: { day_content_id: dayContentId },
  });
  if (day.questions.length === 0) {
    return;
  }

  await prisma.week_questions.createMany({
    data: day.questions.map((item, index) => ({
      id: randomUUID(),
      week_data_id: weekDataId,
      day_content_id: dayContentId,
      day_number: dayNumber,
      code: `day-${String(dayNumber).padStart(2, "0")}-question-${String(
        index + 1,
      ).padStart(2, "0")}`,
      question_text: item,
      question_type: "text",
      help_text: "자유롭게 작성해 주세요.",
      question_payload: {} as Prisma.InputJsonValue,
      display_order: index + 1,
      is_required: false,
      is_active: true,
      updated_at: new Date(),
    })),
  });
}

async function replaceWeekMediaRows(
  bucket: Awaited<ReturnType<typeof ensureBucket>>,
  bucketId: string,
  weekDataId: string,
  dayContentIds: Map<number, string>,
  docxPath: string,
  placements: ImagePlacementRecord[],
) {
  await prisma.pregnancy_week_media.deleteMany({
    where: { week_data_id: weekDataId },
  });

  if (placements.length === 0) {
    return;
  }

  const groupedPlacements = groupImagePlacementsByScope(placements);
  const rows = [];
  for (const group of groupedPlacements) {
    for (const [index, placement] of group.placements.entries()) {
      const sourceName = basename(placement.target);
      const scopedOrder = index + 1;
      const altText =
        group.scope === "week"
          ? `${placement.weekNumber}주차 대표 이미지 ${scopedOrder}`
          : `${placement.weekNumber}주차 Day ${group.dayNumber} 이미지 ${scopedOrder}`;
      const objectPath = getStorageObjectPath({
        weekNumber: placement.weekNumber,
        dayNumber: group.dayNumber,
        scope: group.scope,
        order: scopedOrder,
        sourceName,
      });
      const buffer = readZipEntry(docxPath, `word/${placement.target}`);
      await bucket.file(objectPath).save(buffer, {
        resumable: false,
        contentType: guessContentType(sourceName),
        validation: false,
      });

      rows.push({
        id: randomUUID(),
        week_data_id: weekDataId,
        day_content_id:
          group.scope === "day" && group.dayNumber !== null
            ? (dayContentIds.get(group.dayNumber) ?? null)
            : null,
        day_number: group.scope === "day" ? group.dayNumber : null,
        media_scope: group.scope,
        bucket_id: bucketId,
        object_path: objectPath,
        media_role: group.scope === "week" ? "weekly_summary" : "reference",
        alt_text: altText,
        source_file_name: sourceName,
        display_order: scopedOrder,
        updated_at: new Date(),
      });
    }
  }

  await prisma.pregnancy_week_media.createMany({ data: rows });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!existsSync(options.input)) {
    throw new Error(`DOCX not found: ${options.input}`);
  }

  const rawText = await extractRawText(options.input);
  const allWeeks = parsePregnancyWeekDocText(rawText);
  const parsedWeeks = allWeeks.filter((week) => {
    if (options.weekFrom !== null && week.weekNumber < options.weekFrom)
      return false;
    if (options.weekTo !== null && week.weekNumber > options.weekTo)
      return false;
    return true;
  });
  const documentXml = readZipEntry(options.input, "word/document.xml").toString(
    "utf8",
  );
  const relsXml = readZipEntry(
    options.input,
    "word/_rels/document.xml.rels",
  ).toString("utf8");
  const allImagePlacements = extractImagePlacements(documentXml, relsXml);
  const imagePlacements = allImagePlacements.filter((p) => {
    if (options.weekFrom !== null && p.weekNumber < options.weekFrom)
      return false;
    if (options.weekTo !== null && p.weekNumber > options.weekTo) return false;
    return true;
  });

  if (options.weekFrom !== null || options.weekTo !== null) {
    console.log(
      `Week filter: ${options.weekFrom ?? 1} ~ ${options.weekTo ?? 40}`,
    );
  }

  if (options.output) {
    mkdirSync(dirname(options.output), { recursive: true });
    writeFileSync(
      options.output,
      JSON.stringify(buildDryRunSummary(parsedWeeks, imagePlacements), null, 2),
      "utf8",
    );
  }

  console.log(
    JSON.stringify(buildDryRunSummary(parsedWeeks, imagePlacements), null, 2),
  );

  if (!options.apply) {
    console.log("Dry-run complete. Re-run with --apply to upload and upsert.");
    return;
  }

  const storageClient = options.skipMedia
    ? null
    : await ensureBucket(options.bucket);

  for (const week of parsedWeeks) {
    const weekDataId = await upsertWeek(week);
    const dayContentIds = new Map<number, string>();
    for (const day of week.days) {
      const dayContentId = await upsertDay(weekDataId, week, day.dayNumber);
      dayContentIds.set(day.dayNumber, dayContentId);
      await replaceChecklistRows(weekDataId, dayContentId, week, day.dayNumber);
      await replaceQuestionRows(weekDataId, dayContentId, week, day.dayNumber);
    }
    if (storageClient) {
      await replaceWeekMediaRows(
        storageClient,
        options.bucket,
        weekDataId,
        dayContentIds,
        options.input,
        imagePlacements.filter(
          (placement) => placement.weekNumber === week.weekNumber,
        ),
      );
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
