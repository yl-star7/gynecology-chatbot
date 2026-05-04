import assert from "node:assert/strict";
import test from "node:test";
import { createNativeThemeStorageKey } from "./nativeThemeStorage.model.ts";

test("createNativeThemeStorageKey stores theme selection per mobile user", () => {
  assert.equal(
    createNativeThemeStorageKey("user-a"),
    "phedy-mobile-theme-key.75.73.65.72.2d.61",
  );
  assert.equal(
    createNativeThemeStorageKey("user b"),
    "phedy-mobile-theme-key.75.73.65.72.20.62",
  );
  assert.notEqual(
    createNativeThemeStorageKey("user-a"),
    createNativeThemeStorageKey("user-b"),
  );
});

test("createNativeThemeStorageKey uses secure-store-safe characters", () => {
  assert.match(
    createNativeThemeStorageKey("사용자:1@example.com"),
    /^[A-Za-z0-9._-]+$/,
  );
});
