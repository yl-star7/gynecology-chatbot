import assert from "node:assert/strict";
import test from "node:test";
import { resolveBackNavigation } from "./MobileScreenFrame.model.ts";

test("resolveBackNavigation uses back when a history entry exists", () => {
  assert.deepEqual(resolveBackNavigation(true, "/(tabs)/home"), {
    method: "back",
  });
});

test("resolveBackNavigation falls back to replace when no history entry exists", () => {
  assert.deepEqual(resolveBackNavigation(false, "/(tabs)/home"), {
    method: "replace",
    href: "/(tabs)/home",
  });
});
