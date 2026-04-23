import assert from "node:assert/strict";
import test from "node:test";
import { space } from "../../tokens.ts";
import { buildTabsScreenOptions } from "../../../app/routeOptions.model.ts";

test("tabs screen options keep the patient tab bar visually slim", () => {
  const options = buildTabsScreenOptions({
    accent: "#d68aa7",
    subInk: "#7d6f78",
    card: "#fffafb",
    line: "#efe2e8",
  });

  assert.deepEqual(options.tabBarStyle, {
    backgroundColor: "#fffafb",
    borderTopWidth: 0,
    borderTopColor: "transparent",
    height: space.xxxl + space.xxl,
    paddingTop: space.xs,
    paddingBottom: space.xs,
    elevation: 0,
    shadowOpacity: 0,
    shadowColor: "transparent",
  });
});
