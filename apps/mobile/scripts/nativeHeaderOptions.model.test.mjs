import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_PUSH_SCREEN_OPTIONS,
  buildNativeHeaderScreenOptions,
} from "../app/nativeHeaderOptions.model.ts";

test("default push screen options keep the native header visible", () => {
  assert.deepEqual(DEFAULT_PUSH_SCREEN_OPTIONS, {
    presentation: "card",
    headerBackTitleVisible: false,
  });
});

test("buildNativeHeaderScreenOptions sets title while preserving push defaults", () => {
  assert.deepEqual(buildNativeHeaderScreenOptions("정보 설정"), {
    presentation: "card",
    headerBackTitleVisible: false,
    title: "정보 설정",
  });
});
