import { createKoreanDateKey } from "@gynecology-chatbot/app-core";

export function createPatientCacheDateKey(timestampMs = Date.now()) {
  return createKoreanDateKey(new Date(timestampMs));
}

export function isPatientCacheEntryFreshForToday({
  updatedAt,
  ttlMs,
  now = Date.now(),
}: {
  updatedAt: number;
  ttlMs: number;
  now?: number;
}) {
  if (now - updatedAt >= ttlMs) {
    return false;
  }

  return createPatientCacheDateKey(updatedAt) === createPatientCacheDateKey(now);
}

export function isPatientCacheEntryFromToday({
  updatedAt,
  now = Date.now(),
}: {
  updatedAt: number;
  now?: number;
}) {
  return createPatientCacheDateKey(updatedAt) === createPatientCacheDateKey(now);
}
