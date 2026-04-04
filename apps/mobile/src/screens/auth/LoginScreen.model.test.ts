import assert from "node:assert/strict";
import test from "node:test";
import { resolvePostLoginHref } from "./LoginScreen.model.ts";

test("resolvePostLoginHref sends onboarded users to tabs home", () => {
  assert.equal(resolvePostLoginHref(true), "/(tabs)/home");
});

test("resolvePostLoginHref sends incomplete users to onboarding", () => {
  assert.equal(resolvePostLoginHref(false), "/onboarding");
});
