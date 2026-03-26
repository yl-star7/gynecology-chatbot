import assert from "node:assert/strict";
import test from "node:test";
import { buildAnimatedPressableStyle } from "./Pressable.model.ts";

test("animated pressable keeps caller layout styles on the pressable element", () => {
  const baseStyle = { flex: 1, alignItems: "center" as const };
  const animationStyle = { opacity: 0.7 };

  const result = buildAnimatedPressableStyle(baseStyle, animationStyle);

  assert.deepEqual(result, [baseStyle, animationStyle]);
});
