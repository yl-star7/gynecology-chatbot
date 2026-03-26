import type { StyleProp, ViewStyle } from "react-native";

export function buildAnimatedPressableStyle(
  style: StyleProp<ViewStyle>,
  animationStyle: ViewStyle,
) {
  return [style, animationStyle];
}
