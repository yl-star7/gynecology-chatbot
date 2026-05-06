import { prisma } from "@gynecology-chatbot/db/prisma";

import { getSchiftClient } from "@/lib/mobile/schift-client";

const PREGNANCY_KNOWLEDGE_BUCKET = "pregnancy-knowledge";

export interface LexiconDriftReport {
  dbCount: number;
  schiftCount: number;
  untaggedCount: number;
  available: boolean;
  message: string | null;
}

interface BucketRecord {
  name?: string | null;
  bucket_name?: string | null;
  file_count?: number | null;
  document_count?: number | null;
  vector_count?: number | null;
}

interface SearchMetadataEntry {
  metadata?: Record<string, unknown> | null;
  payload?: Record<string, unknown> | null;
}

function extractBucketStats(
  buckets: unknown,
  bucketName: string,
): { fileCount: number } | null {
  if (!Array.isArray(buckets)) {
    return null;
  }

  for (const entry of buckets as BucketRecord[]) {
    const name = entry?.name ?? entry?.bucket_name ?? null;
    if (name !== bucketName) continue;
    const fileCount =
      typeof entry.file_count === "number"
        ? entry.file_count
        : typeof entry.document_count === "number"
          ? entry.document_count
          : typeof entry.vector_count === "number"
            ? entry.vector_count
            : 0;
    return { fileCount };
  }

  return null;
}

function hasWeekTag(entry: SearchMetadataEntry): boolean {
  const meta = entry?.metadata ?? entry?.payload ?? null;
  if (!meta || typeof meta !== "object") return false;
  const weekValue = (meta as Record<string, unknown>).week;
  if (weekValue === undefined || weekValue === null) return false;
  if (typeof weekValue === "number" && Number.isFinite(weekValue)) return true;
  if (typeof weekValue === "string" && weekValue.trim().length > 0) return true;
  return false;
}

async function countUntaggedDocuments(
  schift: ReturnType<typeof getSchiftClient>,
): Promise<number> {
  if (!schift) return 0;

  try {
    const response = (await schift.bucketSearch(PREGNANCY_KNOWLEDGE_BUCKET, {
      query: "*",
      topK: 200,
      mode: "semantic",
    })) as unknown;

    const results = extractSearchResults(response);
    if (results.length === 0) return 0;

    return results.filter((entry) => !hasWeekTag(entry)).length;
  } catch {
    return 0;
  }
}

function extractSearchResults(response: unknown): SearchMetadataEntry[] {
  if (!response || typeof response !== "object") return [];
  const payload = response as {
    results?: SearchMetadataEntry[];
    matches?: SearchMetadataEntry[];
    hits?: SearchMetadataEntry[];
  };
  return payload.results ?? payload.matches ?? payload.hits ?? [];
}

export async function loadSchiftDrift(): Promise<LexiconDriftReport> {
  const dbCount = await prisma.content_pregnancy_documents
    .count()
    .catch(() => 0);

  const schift = getSchiftClient();
  if (!schift) {
    return {
      dbCount,
      schiftCount: 0,
      untaggedCount: 0,
      available: false,
      message: "Schift API 키가 설정되지 않아 드리프트를 확인할 수 없습니다.",
    };
  }

  try {
    const timeout = (ms: number) =>
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), ms),
      );

    const buckets = await Promise.race([
      schift.listBuckets(),
      timeout(8000),
    ]).catch(() => null);

    const stats = extractBucketStats(buckets, PREGNANCY_KNOWLEDGE_BUCKET);
    const schiftCount = stats?.fileCount ?? 0;
    const untaggedCount = await countUntaggedDocuments(schift);

    return {
      dbCount,
      schiftCount,
      untaggedCount,
      available: true,
      message: null,
    };
  } catch (error) {
    return {
      dbCount,
      schiftCount: 0,
      untaggedCount: 0,
      available: false,
      message:
        error instanceof Error
          ? `Schift 드리프트 확인에 실패했습니다: ${error.message}`
          : "Schift 드리프트 확인에 실패했습니다.",
    };
  }
}

export const __testing__ = {
  extractBucketStats,
  hasWeekTag,
  extractSearchResults,
  PREGNANCY_KNOWLEDGE_BUCKET,
};
