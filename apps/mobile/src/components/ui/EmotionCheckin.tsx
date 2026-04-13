// @ts-nocheck
import { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  space,
  typo,
} from "../../theme";

type EmotionTone = "calm" | "joyful" | "anxious" | "tired" | "sad";

interface EmotionOption {
  tone: EmotionTone;
  label: string;
}

const EMOTIONS: EmotionOption[] = [
  { tone: "calm", label: "차분해요" },
  { tone: "joyful", label: "기뻐요" },
  { tone: "anxious", label: "불안해요" },
  { tone: "tired", label: "피곤해요" },
  { tone: "sad", label: "슬퍼요" },
];

interface EmotionCheckinProps {
  onSelect: (tone: EmotionTone) => void;
  onDismiss: () => void;
}

export function EmotionCheckin({ onSelect, onDismiss }: EmotionCheckinProps) {
  const slideAnim = useRef(new Animated.Value(80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: space.xl,
        stiffness: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacityAnim, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      accessibilityRole="region"
      accessibilityLabel="감정 체크인"
    >
      <Text style={styles.title}>오늘 기분이 어떠세요?</Text>

      <View style={styles.emotionRow}>
        {EMOTIONS.map(({ tone, label }) => (
          <Pressable
            key={tone}
            style={({ pressed }) => [
              styles.emotionButton,
              pressed && styles.emotionButtonPressed,
            ]}
            onPress={() => onSelect(tone)}
            accessibilityRole="button"
            accessibilityLabel={label}
          >
            <Text style={styles.emotionLabel}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={onDismiss}
        style={styles.dismissButton}
        accessibilityRole="button"
        accessibilityLabel="건너뛰기"
      >
        <Text style={styles.dismissLabel}>건너뛰기</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.md,
    backgroundColor: surface.surfacePrimary,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    zIndex: 20,
    ...Platform.select({
      ios: {
        shadowColor: palette.ink,
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -3 },
      },
      android: { elevation: 6 },
    }),
  },
  title: {
    ...typo.titleSm,
    color: surface.textPrimary,
    textAlign: "center",
    marginBottom: space.md,
  },
  emotionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: space.xs,
    marginBottom: space.sm,
  },
  emotionButton: {
    minWidth: 72,
    paddingHorizontal: space.md,
    paddingVertical: space.xs + space.xs,
    borderRadius: radii.full,
    backgroundColor: surface.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  emotionButtonPressed: {
    backgroundColor: surface.surfaceAccent,
    transform: [{ scale: 0.97 }],
  },
  emotionLabel: {
    ...typo.caption,
    color: surface.textSecondary,
    textAlign: "center",
  },
  dismissButton: {
    alignItems: "center",
    paddingTop: space.xs,
    paddingBottom: space.xs,
  },
  dismissLabel: {
    ...typo.caption,
    color: surface.textSecondary,
  },
});
