import assert from "node:assert/strict";
import test from "node:test";
import { space } from "../../tokens.ts";
import {
  PATIENT_TAB_BAR_BODY_HEIGHT,
  PATIENT_TAB_BAR_CONTENT_OFFSET_Y,
  buildTabBarSafeAreaStyle,
  buildTabsScreenOptions,
} from "../../../app/routeOptions.model.ts";

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
    height: PATIENT_TAB_BAR_BODY_HEIGHT,
    paddingTop: 0,
    paddingBottom: space.xs,
    elevation: 0,
    shadowOpacity: 0,
    shadowColor: "transparent",
  });
  assert.deepEqual(options.tabBarItemStyle, {
    height: PATIENT_TAB_BAR_BODY_HEIGHT,
    paddingVertical: 0,
    justifyContent: "center",
    transform: [{ translateY: PATIENT_TAB_BAR_CONTENT_OFFSET_Y }],
  });
  assert.deepEqual(options.tabBarIconStyle, { marginTop: 0 });
  assert.deepEqual(options.tabBarLabelStyle, {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 0,
    marginBottom: 0,
  });
});

test("tabs screen options use a compact Android tab bar body", () => {
  const options = buildTabsScreenOptions({
    accent: "#d68aa7",
    subInk: "#7d6f78",
    card: "#fffafb",
    line: "#efe2e8",
    platformOS: "android",
  });

  assert.equal(options.tabBarStyle.height, PATIENT_TAB_BAR_BODY_HEIGHT);
  assert.equal(options.tabBarStyle.paddingTop, 0);
  assert.equal(options.tabBarStyle.paddingBottom, space.xs);
  assert.equal(options.tabBarItemStyle.height, PATIENT_TAB_BAR_BODY_HEIGHT);
  assert.deepEqual(options.tabBarItemStyle.transform, [{ translateY: 0 }]);
});

test("tab bar safe area keeps a slim body while restoring the device bottom inset", () => {
  assert.deepEqual(
    buildTabBarSafeAreaStyle({
      bottomInset: 34,
      minimumBottomPadding: space.xs,
    }),
    {
      height: PATIENT_TAB_BAR_BODY_HEIGHT + 34,
      paddingBottom: 34,
    },
  );
});

test("tab bar safe area keeps a small floor when the device has no bottom inset", () => {
  assert.deepEqual(
    buildTabBarSafeAreaStyle({
      bottomInset: 0,
      minimumBottomPadding: space.xs,
    }),
    {
      height: PATIENT_TAB_BAR_BODY_HEIGHT + space.xs,
      paddingBottom: space.xs,
    },
  );
});
