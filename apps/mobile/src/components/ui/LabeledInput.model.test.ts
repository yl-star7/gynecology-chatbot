import assert from "node:assert/strict";
import test from "node:test";
import { radii, space } from "../../tokens.ts";
import { LABELED_INPUT_LAYOUT } from "./LabeledInput.model.ts";

test("labeled input layout is derived from shared spacing and radius tokens", () => {
  assert.equal(LABELED_INPUT_LAYOUT.fieldGap, space.xs);
  assert.equal(LABELED_INPUT_LAYOUT.labelInset, space.xs);
  assert.equal(LABELED_INPUT_LAYOUT.inputRadius, radii.md);
  assert.equal(LABELED_INPUT_LAYOUT.inputPaddingX, space.lg);
  assert.equal(LABELED_INPUT_LAYOUT.inputPaddingY, space.lg);
});

test("labeled input contract does not rely on borders to separate the field", () => {
  assert.equal(LABELED_INPUT_LAYOUT.usesBorder, false);
});
