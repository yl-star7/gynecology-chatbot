import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import mammoth from "mammoth";
import { createClient } from "@supabase/supabase-js";
import {
  extractImagePlacements,
  getStorageObjectPath,
  groupImagePlacementsByScope,
  parsePregnancyWeekDocText,
  type ParsedPregnancyWeek,
} from "../src/lib/content/pregnancy-docx-import";
import { getSupabaseAdminClient } from "../src/lib/supabase/admin-client";

type CliOptions = {
  input: string;
  bucket: string;
  apply: boolean;
  output: string | null;
  weekFrom: number | null;
  weekTo: number | null;
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
    status: "draft",
    updated_at: new Date().toISOString(),
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
    updated_at: new Date().toISOString(),
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

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE ??
    process.env.SERVICEROLE;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase Storage upload requires NEXT_PUBLIC_SUPABASE_URL and a service-role key",
    );
  }

  return { url, serviceRoleKey };
}

async function ensureBucket(bucketId: string) {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: buckets, error: listError } =
    await client.storage.listBuckets();
  if (listError) {
    throw listError;
  }
  if (!buckets?.some((bucket) => bucket.name === bucketId)) {
    const { error } = await client.storage.createBucket(bucketId, {
      public: false,
      fileSizeLimit: "10MB",
    });
    if (error) {
      throw error;
    }
  }
  return client;
}

async function upsertWeek(week: ParsedPregnancyWeek) {
  const content = getSupabaseAdminClient().schema("content");
  const { data: existing, error: existingError } = await content
    .from("pregnancy_week_data")
    .select("id,week_number")
    .eq("week_number", week.weekNumber)
    .limit(1);
  if (existingError) throw existingError;
  const payload = {
    week_number: week.weekNumber,
    ...toWeekPayload(week),
  };

  if (existing[0]) {
    const { error } = await content
      .from("pregnancy_week_data")
      .update(payload)
      .eq("id", existing[0].id);
    if (error) throw error;
    return existing[0].id;
  }

  const { data: inserted, error: insertError } = await content
    .from("pregnancy_week_data")
    .insert({ id: randomUUID(), ...payload })
    .select("id,week_number");
  if (insertError) throw insertError;
  return inserted[0].id;
}

async function upsertDay(
  weekDataId: string,
  week: ParsedPregnancyWeek,
  dayNumber: number,
) {
  const content = getSupabaseAdminClient().schema("content");
  const { data: existing, error: existingError } = await content
    .from("pregnancy_day_contents")
    .select("id,day_number")
    .eq("week_data_id", weekDataId)
    .eq("day_number", dayNumber)
    .limit(1);
  if (existingError) throw existingError;
  const payload = {
    week_data_id: weekDataId,
    day_number: dayNumber,
    ...toDayPayload(week, dayNumber),
  };

  if (existing[0]) {
    const { error } = await content
      .from("pregnancy_day_contents")
      .update(payload)
      .eq("id", existing[0].id);
    if (error) throw error;
    return existing[0].id;
  }

  const { data: inserted, error: insertError } = await content
    .from("pregnancy_day_contents")
    .insert({ id: randomUUID(), ...payload })
    .select("id,day_number");
  if (insertError) throw insertError;
  return inserted[0].id;
}

async function replaceChecklistRows(
  weekDataId: string,
  dayContentId: string,
  week: ParsedPregnancyWeek,
  dayNumber: number,
) {
  const content = getSupabaseAdminClient().schema("content");
  const day = week.days.find((entry) => entry.dayNumber === dayNumber);
  if (!day) {
    return;
  }

  const { error: deleteError } = await content
    .from("week_checklists")
    .delete()
    .eq("day_content_id", dayContentId);
  if (deleteError) throw deleteError;
  if (day.checklistItems.length === 0) {
    return;
  }

  const { error: insertError } = await content.from("week_checklists").insert(
    day.checklistItems.map((item, index) => ({
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
      updated_at: new Date().toISOString(),
    })),
  );
  if (insertError) throw insertError;
}

async function replaceQuestionRows(
  weekDataId: string,
  dayContentId: string,
  week: ParsedPregnancyWeek,
  dayNumber: number,
) {
  const content = getSupabaseAdminClient().schema("content");
  const day = week.days.find((entry) => entry.dayNumber === dayNumber);
  if (!day) {
    return;
  }

  const { error: deleteError } = await content
    .from("week_questions")
    .delete()
    .eq("day_content_id", dayContentId);
  if (deleteError) throw deleteError;
  if (day.questions.length === 0) {
    return;
  }

  const { error: insertError } = await content.from("week_questions").insert(
    day.questions.map((item, index) => ({
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
      question_payload: {},
      display_order: index + 1,
      is_required: false,
      is_active: true,
      updated_at: new Date().toISOString(),
    })),
  );
  if (insertError) throw insertError;
}

async function replaceWeekMediaRows(
  client: Awaited<ReturnType<typeof ensureBucket>>,
  bucketId: string,
  weekDataId: string,
  dayContentIds: Map<number, string>,
  docxPath: string,
  placements: ImagePlacementRecord[],
) {
  const content = getSupabaseAdminClient().schema("content");
  const { error: deleteError } = await content
    .from("pregnancy_week_media")
    .delete()
    .eq("week_data_id", weekDataId);
  if (deleteError) throw deleteError;

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
      const { error } = await client.storage
        .from(bucketId)
        .upload(objectPath, buffer, {
          contentType: guessContentType(sourceName),
          upsert: true,
        });
      if (error) {
        throw error;
      }

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
        updated_at: new Date().toISOString(),
      });
    }
  }

  const { error: insertError } = await content
    .from("pregnancy_week_media")
    .insert(rows);
  if (insertError) throw insertError;
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

  const storageClient = await ensureBucket(options.bucket);

  for (const week of parsedWeeks) {
    const weekDataId = await upsertWeek(week);
    const dayContentIds = new Map<number, string>();
    for (const day of week.days) {
      const dayContentId = await upsertDay(weekDataId, week, day.dayNumber);
      dayContentIds.set(day.dayNumber, dayContentId);
      await replaceChecklistRows(weekDataId, dayContentId, week, day.dayNumber);
      await replaceQuestionRows(weekDataId, dayContentId, week, day.dayNumber);
    }
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

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
