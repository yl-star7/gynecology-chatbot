import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import {
  palette,
  patientSurfacePalette as surface,
  space,
  typo,
} from "../../theme";

const DOT_SIZE = 7;
const DOT_COUNT = 3;
const ANIMATION_DURATION = 400;

export function TypingIndicator() {
  const dots = useRef(
    Array.from({ length: DOT_COUNT }, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    const animations = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * (ANIMATION_DURATION / DOT_COUNT)),
          Animated.timing(dot, {
            toValue: 1,
            duration: ANIMATION_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: ANIMATION_DURATION,
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [dots]);

  return (
    <View style={styles.container}>
      <View style={styles.dotRow}>
        {dots.map((dot, index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                opacity: dot.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
                transform: [
                  {
                    translateY: dot.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -4],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
      <Text style={styles.label}>답변을 준비하고 있어요</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: space.xs,
    paddingVertical: space.xs,
    paddingHorizontal: space.xs,
  },
  dotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: palette.accent,
  },
  label: {
    ...typo.caption,
    color: surface.textSecondary,
  },
});
