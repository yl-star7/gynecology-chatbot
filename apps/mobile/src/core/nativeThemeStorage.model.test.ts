import assert from "node:assert/strict";
import test from "node:test";
import { createNativeThemeStorageKey } from "./nativeThemeStorage.model.ts";

test("createNativeThemeStorageKey stores theme selection per mobile user", () => {
  assert.equal(
    createNativeThemeStorageKey("user-a"),
    "phedy-mobile-theme-key:user-a",
  );
  assert.equal(
    createNativeThemeStorageKey("user b"),
    "phedy-mobile-theme-key:user%20b",
  );
  assert.notEqual(
    createNativeThemeStorageKey("user-a"),
    createNativeThemeStorageKey("user-b"),
  );
});
