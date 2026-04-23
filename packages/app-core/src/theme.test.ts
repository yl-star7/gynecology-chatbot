import assert from "node:assert/strict";
import test from "node:test";
import {
  MOBILE_THEME_OPTIONS,
  getMobileThemePreset,
  resolveMobileThemeKey,
} from "./theme.ts";

test("MOBILE_THEME_OPTIONS exposes the user-facing pink green and sky themes", () => {
  assert.deepEqual(
    MOBILE_THEME_OPTIONS.map((theme) => ({
      key: theme.key,
      label: theme.label,
    })),
    [
      { key: "rose-sand", label: "핑크" },
      { key: "mint-neutral", label: "연두" },
      { key: "sky-blue", label: "하늘색" },
    ],
  );
});

test("resolveMobileThemeKey accepts the sky theme and still falls back to pink", () => {
  assert.equal(resolveMobileThemeKey("sky-blue"), "sky-blue");
  assert.equal(resolveMobileThemeKey("soft-peach"), "soft-peach");
  assert.equal(resolveMobileThemeKey("unknown"), "rose-sand");
});

test("getMobileThemePreset returns a sky-blue native accent", () => {
  assert.equal(getMobileThemePreset("sky-blue").native.accent, "#4f8fc7");
});
