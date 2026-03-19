type DaySectionKey =
  | "baby_development"
  | "baby_message"
  | "mother_changes"
  | "checklist"
  | "questions";

export type ParsedPregnancyDay = {
  dayNumber: number;
  babyDevelopment: string[];
  babyMessage: string | null;
  motherChanges: string[];
  checklistItems: string[];
  questions: string[];
};

export type ParsedPregnancyWeek = {
  weekNumber: number;
  title: string;
  days: ParsedPregnancyDay[];
};

export type ImagePlacement = {
  weekNumber: number;
  dayNumber: number;
  target: string;
  order: number;
};

export type GroupedImagePlacements = {
  weekNumber: number;
  dayNumber: number | null;
  scope: "week" | "day";
  placements: ImagePlacement[];
};

type StorageObjectPathInput = {
  weekNumber: number;
  dayNumber?: number | null;
  scope: "week" | "day";
  order: number;
  sourceName: string;
};

const WEEK_HEADING_REGEX = /^(\d+)주차_7일간$/;
const DAY_HEADING_REGEX = /^✅?\s*Day\s+([1-7])$/i;
const CITATION_REGEX = /\((\d+)\)/g;

function decodeXmlEntities(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function sanitizeStorageSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
}

function stripOuterQuotes(value: string) {
  return value.replace(/^[“"'`]+/, "").replace(/[”"'`]+$/, "").trim();
}

function stripCitationMarkers(value: string) {
  return value
    .replace(CITATION_REGEX, "")
    .replace(/\s+,/g, ",")
    .replace(/\.\s*\./g, ".")
    .replace(/,\s*(?=[.!?]|$)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function normalizeContentLine(value: string) {
  const collapsed = stripCitationMarkers(
    value
      .replace(/^[\s\u2022•]+/, "")
      .replace(/^[①②③④⑤⑥⑦⑧⑨⑩]+\s*/, "")
      .replace(/^\d+\)\s*/, "")
      .trim(),
  );
  return stripOuterQuotes(collapsed);
}

function createDay(dayNumber: number): ParsedPregnancyDay {
  return {
    dayNumber,
    babyDevelopment: [],
    babyMessage: null,
    motherChanges: [],
    checklistItems: [],
    questions: [],
  };
}

function pushSectionValue(
  day: ParsedPregnancyDay,
  section: DaySectionKey | null,
  value: string,
) {
  if (!value) {
    return;
  }

  switch (section) {
    case "baby_development":
      day.babyDevelopment.push(value);
      break;
    case "baby_message":
      day.babyMessage = day.babyMessage
        ? `${day.babyMessage} ${value}`.trim()
        : value;
      break;
    case "mother_changes":
      day.motherChanges.push(value);
      break;
    case "checklist":
      day.checklistItems.push(value);
      break;
    case "questions":
      day.questions.push(value);
      break;
    default:
      break;
  }
}

function detectSection(line: string): DaySectionKey | null {
  if (line.includes("태아 발달 정보")) {
    return "baby_development";
  }
  if (line.includes("모체 변화 정보")) {
    return "mother_changes";
  }
  if (line.includes("생활 체크리스트")) {
    return "checklist";
  }
  if (line.includes("태교 질문")) {
    return "questions";
  }
  if (line.includes("아기의 말")) {
    return "baby_message";
  }
  return null;
}

export function parsePregnancyWeekDocText(rawText: string): ParsedPregnancyWeek[] {
  const weeks: ParsedPregnancyWeek[] = [];
  let currentWeek: ParsedPregnancyWeek | null = null;
  let currentDay: ParsedPregnancyDay | null = null;
  let currentSection: DaySectionKey | null = null;

  for (const rawLine of rawText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      currentSection = null;
      continue;
    }

    const normalizedLine = normalizeContentLine(line);
    if (!normalizedLine) {
      continue;
    }

    const weekMatch = normalizedLine.match(WEEK_HEADING_REGEX);
    if (weekMatch) {
      currentWeek = {
        weekNumber: Number(weekMatch[1]),
        title: `${weekMatch[1]}주차`,
        days: [],
      };
      weeks.push(currentWeek);
      currentDay = null;
      currentSection = null;
      continue;
    }

    const dayMatch = normalizedLine.match(DAY_HEADING_REGEX);
    if (dayMatch && currentWeek) {
      if (currentWeek.days.length >= 7) {
        currentDay = null;
        currentSection = null;
        continue;
      }
      currentDay = createDay(Number(dayMatch[1]));
      currentWeek.days.push(currentDay);
      currentSection = null;
      continue;
    }

    if (!currentWeek || !currentDay) {
      continue;
    }

    if (line.includes("아기의 말")) {
      currentSection = "baby_message";
      const [, message = ""] = line.split(/아기의 말\s*[:：]/, 2);
      const normalizedMessage = normalizeContentLine(message);
      if (normalizedMessage) {
        pushSectionValue(currentDay, currentSection, normalizedMessage);
      }
      continue;
    }

    const detectedSection = detectSection(line);
    if (detectedSection) {
      currentSection = detectedSection;
      continue;
    }

    pushSectionValue(currentDay, currentSection, normalizedLine);
  }

  return weeks;
}

export function extractImagePlacements(
  documentXml: string,
  relsXml: string,
): ImagePlacement[] {
  const relationshipMap = new Map<string, string>();
  for (const match of relsXml.matchAll(
    /<Relationship\b[^>]*\bId="([^"]+)"[^>]*\bTarget="([^"]+)"/g,
  )) {
    relationshipMap.set(match[1], match[2]);
  }

  const placements: ImagePlacement[] = [];
  let currentWeekNumber: number | null = null;
  let currentDayNumber: number | null = null;
  let order = 0;

  for (const paragraphMatch of documentXml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)) {
    const paragraph = paragraphMatch[0];
    const paragraphText = decodeXmlEntities(
      Array.from(paragraph.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g))
        .map((match) => match[1])
        .join(""),
    ).trim();

    const weekMatch = paragraphText.match(WEEK_HEADING_REGEX);
    if (weekMatch) {
      currentWeekNumber = Number(weekMatch[1]);
    }

    const dayMatch = paragraphText.match(DAY_HEADING_REGEX);
    if (dayMatch) {
      currentDayNumber = Number(dayMatch[1]);
    }

    for (const imageMatch of paragraph.matchAll(
      /<a:blip\b[^>]*\br:embed="([^"]+)"/g,
    )) {
      const target = relationshipMap.get(imageMatch[1]);
      if (!target || currentWeekNumber === null || currentDayNumber === null) {
        continue;
      }

      order += 1;
      placements.push({
        weekNumber: currentWeekNumber,
        dayNumber: currentDayNumber,
        target,
        order,
      });
    }
  }

  return placements;
}

export function groupImagePlacementsByScope(
  placements: ImagePlacement[],
): GroupedImagePlacements[] {
  const byWeek = new Map<number, ImagePlacement[]>();
  for (const placement of placements) {
    const current = byWeek.get(placement.weekNumber) ?? [];
    current.push(placement);
    byWeek.set(placement.weekNumber, current);
  }

  const groups: GroupedImagePlacements[] = [];
  for (const [weekNumber, weekPlacements] of [...byWeek.entries()].sort(
    ([left], [right]) => left - right,
  )) {
    const dayNumbers = [...new Set(weekPlacements.map((placement) => placement.dayNumber))];
    if (dayNumbers.length === 1 && dayNumbers[0] === 7) {
      groups.push({
        weekNumber,
        dayNumber: null,
        scope: "week",
        placements: weekPlacements.sort((left, right) => left.order - right.order),
      });
      continue;
    }

    for (const dayNumber of dayNumbers.sort((left, right) => left - right)) {
      groups.push({
        weekNumber,
        dayNumber,
        scope: "day",
        placements: weekPlacements
          .filter((placement) => placement.dayNumber === dayNumber)
          .sort((left, right) => left.order - right.order),
      });
    }
  }

  return groups;
}

export function getStorageObjectPath(input: StorageObjectPathInput) {
  const fileName = `${String(input.order).padStart(3, "0")}-${sanitizeStorageSegment(
    input.sourceName,
  )}`;

  if (input.scope === "week") {
    return `weeks/${input.weekNumber}/${fileName}`;
  }

  if (input.dayNumber == null) {
    throw new Error("day-scoped storage paths require dayNumber");
  }

  return `weeks/${input.weekNumber}/day-${String(input.dayNumber).padStart(
    2,
    "0",
  )}/${fileName}`;
}
