// @ts-nocheck
import { useCallback, useRef } from "react";
import {
  Animated,
  Pressable as RNPressable,
  type PressableProps,
  type ViewStyle,
} from "react-native";

const PRESS_IN_SCALE = 0.97;
const PRESS_IN_OPACITY = 0.7;

export function Pressable({
  children,
  style,
  disabled,
  ...rest
}: PressableProps & { style?: ViewStyle | ViewStyle[] }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: PRESS_IN_SCALE, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: PRESS_IN_OPACITY, duration: 100, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

  const handlePressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

  return (
    <RNPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        if (!disabled) handlePressIn();
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        handlePressOut();
        rest.onPressOut?.(e);
      }}
    >
      <Animated.View style={[style, { transform: [{ scale }], opacity }]}>
        {children}
      </Animated.View>
    </RNPressable>
  );
}
