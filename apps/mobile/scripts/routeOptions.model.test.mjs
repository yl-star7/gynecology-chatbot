import assert from "node:assert/strict";
import test from "node:test";
import {
  HIDDEN_HEADER_SCREEN_OPTIONS,
  ROOT_STACK_ROUTE_NAMES,
  buildTabsScreenOptions,
} from "../app/routeOptions.model.ts";

test("hidden header screens opt out per route instead of relying on a root stack default", () => {
  assert.deepEqual(HIDDEN_HEADER_SCREEN_OPTIONS, { headerShown: false });
});

test("root stack registers patient flows that need nested layouts", () => {
  assert.deepEqual(ROOT_STACK_ROUTE_NAMES, [
    "index",
    "auth/login",
    "onboarding/index",
    "(tabs)",
    "chat",
    "encyclopedia",
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
  assert.equal(options.tabBarStyle.height, 68);
});
