import assert from "node:assert/strict";
import test from "node:test";
import { radii, space } from "../../tokens.ts";
import { ONBOARDING_LAYOUT } from "./OnboardingScreen.model.ts";

test("onboarding layout uses the shared spacing rhythm for major sections", () => {
  assert.equal(ONBOARDING_LAYOUT.progressHeight, space.xs);
  assert.equal(ONBOARDING_LAYOUT.sectionGap, space.xl);
  assert.equal(ONBOARDING_LAYOUT.titleGap, space.xs);
  assert.equal(ONBOARDING_LAYOUT.choiceGap, space.sm);
  assert.equal(ONBOARDING_LAYOUT.rowGap, space.md);
});

test("onboarding cards and chips reuse shared radii tokens", () => {
  assert.equal(ONBOARDING_LAYOUT.chipRadius, radii.lg);
  assert.equal(ONBOARDING_LAYOUT.cardRadius, radii.xl);
});
