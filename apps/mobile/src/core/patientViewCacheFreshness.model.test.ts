import assert from "node:assert/strict";
import test from "node:test";
import {
  createPatientCacheDateKey,
  isPatientCacheEntryFromToday,
  isPatientCacheEntryFreshForToday,
} from "./patientViewCacheFreshness.model.ts";

test("createPatientCacheDateKey resolves dates in Korean app time", () => {
  assert.equal(
    createPatientCacheDateKey(Date.parse("2026-04-20T15:01:00.000Z")),
    "2026-04-21",
  );
});

test("isPatientCacheEntryFreshForToday rejects yesterday cache across the KST day boundary", () => {
  assert.equal(
    isPatientCacheEntryFreshForToday({
      updatedAt: Date.parse("2026-04-20T14:59:00.000Z"),
      now: Date.parse("2026-04-20T15:01:00.000Z"),
      ttlMs: 5 * 60 * 1000,
    }),
    false,
  );
});

test("isPatientCacheEntryFreshForToday keeps same-day cache within ttl fresh", () => {
  assert.equal(
    isPatientCacheEntryFreshForToday({
      updatedAt: Date.parse("2026-04-20T15:01:00.000Z"),
      now: Date.parse("2026-04-20T15:04:00.000Z"),
      ttlMs: 5 * 60 * 1000,
    }),
    true,
  );
});

test("isPatientCacheEntryFromToday rejects yesterday cache even before ttl checks", () => {
  assert.equal(
    isPatientCacheEntryFromToday({
      updatedAt: Date.parse("2026-04-20T14:59:00.000Z"),
      now: Date.parse("2026-04-20T15:01:00.000Z"),
    }),
    false,
  );
});
