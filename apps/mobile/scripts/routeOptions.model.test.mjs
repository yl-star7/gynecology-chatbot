/* eslint-disable import/namespace */
import assert from "node:assert/strict";
import test from "node:test";
import {
  HIDDEN_HEADER_SCREEN_OPTIONS,
  PATIENT_TAB_BAR_BODY_HEIGHT,
  ROOT_STACK_ROUTE_NAMES,
  buildTabsScreenOptions,
} from "../app/routeOptions.model.ts";
import { space } from "../src/tokens.ts";

test("hidden header screens opt out per route instead of relying on a root stack default", () => {
  assert.deepEqual(HIDDEN_HEADER_SCREEN_OPTIONS, { headerShown: false });
});

test("root stack registers patient flows that need nested layouts", () => {
  assert.deepEqual(ROOT_STACK_ROUTE_NAMES, [
    "index",
    "auth/login",
    "onboarding/index",
    "approval-pending",
    "(tabs)",
    "ask",
    "chat",
    "encyclopedia",
    "lexicon",
    "dev",
    "records",
    "profile-settings",
    "profile-survey",
  ]);
});

test("buildTabsScreenOptions returns tab bar colors and spacing from a provided palette", () => {
  const options = buildTabsScreenOptions({
    accent: "#111111",
    subInk: "#222222",
    card: "#333333",
    line: "#444444",
  });

  assert.equal(options.headerShown, false);
  assert.equal(options.tabBarActiveTintColor, "#111111");
  assert.equal(options.tabBarInactiveTintColor, "#222222");
  assert.equal(options.tabBarStyle.backgroundColor, "#333333");
  assert.equal(options.tabBarStyle.borderTopColor, "transparent");
  assert.equal(options.tabBarStyle.height, PATIENT_TAB_BAR_BODY_HEIGHT);
  assert.equal(options.tabBarStyle.paddingTop, 0);
  assert.equal(options.tabBarStyle.paddingBottom, space.xs);
});

test("buildTabsScreenOptions removes the upward tab item offset on Android", () => {
  const options = buildTabsScreenOptions({
    accent: "#111111",
    subInk: "#222222",
    card: "#333333",
    line: "#444444",
    platformOS: "android",
  });

  assert.deepEqual(options.tabBarItemStyle.transform, [{ translateY: 0 }]);
});
