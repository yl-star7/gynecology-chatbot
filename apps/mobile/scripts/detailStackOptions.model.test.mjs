import assert from "node:assert/strict";
import test from "node:test";
import {
  HIDDEN_HEADER_SCREEN_OPTIONS,
  SHEET_MODAL_SCREEN_OPTIONS,
} from "../app/detailStackOptions.model.ts";

test("detail stacks hide headers by default", () => {
  assert.deepEqual(HIDDEN_HEADER_SCREEN_OPTIONS, { headerShown: false });
});

test("sheet modal screens use modal presentation without a native header", () => {
  assert.deepEqual(SHEET_MODAL_SCREEN_OPTIONS, {
    headerShown: false,
    presentation: "modal",
  });
});
