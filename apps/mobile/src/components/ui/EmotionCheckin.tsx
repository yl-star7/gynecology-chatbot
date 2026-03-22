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
import { palette, patientSurfacePalette as surface, radii, shadows, space, typo } from "../../theme";

type EmotionTone = "calm" | "joyful" | "anxious" | "tired" | "sad";

interface EmotionOption {
  tone: EmotionTone;
  label: string;
  emoji: string;
}

const EMOTIONS: EmotionOption[] = [
  { tone: "calm", label: "차분해요", emoji: "😌" },
  { tone: "joyful", label: "기뻐요", emoji: "😊" },
  { tone: "anxious", label: "불안해요", emoji: "😟" },
  { tone: "tired", label: "피곤해요", emoji: "😴" },
  { tone: "sad", label: "슬퍼요", emoji: "😢" },
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
        damping: 20,
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
      <View style={styles.handle} />
      <Text style={styles.title}>오늘 기분이 어떠세요?</Text>

      <View style={styles.emotionRow}>
        {EMOTIONS.map(({ tone, label, emoji }) => (
          <View key={tone} style={styles.emotionItem}>
            <Pressable
              style={({ pressed }) => [
                styles.emotionButton,
                pressed && styles.emotionButtonPressed,
              ]}
              onPress={() => onSelect(tone)}
              accessibilityRole="button"
              accessibilityLabel={label}
            >
              <Text style={styles.emotionEmoji}>{emoji}</Text>
            </Pressable>
            <Text style={styles.emotionLabel} numberOfLines={1}>
              {label}
            </Text>
          </View>
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
    paddingHorizontal: space.xl,
    paddingTop: space.sm,
    paddingBottom: space.xl,
    backgroundColor: surface.surfacePrimary,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    ...Platform.select({
      ios: {
        shadowColor: palette.ink,
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: -4 },
      },
      android: { elevation: 8 },
    }),
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: surface.strokeSubtle,
    alignSelf: "center",
    marginBottom: space.lg,
  },
  title: {
    ...typo.titleSm,
    color: surface.textPrimary,
    textAlign: "center",
    marginBottom: space.xl,
  },
  emotionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: space.xl,
  },
  emotionItem: {
    alignItems: "center",
    gap: space.sm,
    flex: 1,
  },
  emotionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: surface.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
  emotionButtonPressed: {
    backgroundColor: surface.surfaceAccent,
    transform: [{ scale: 0.94 }],
  },
  emotionEmoji: {
    fontSize: 24,
    lineHeight: 28,
  },
  emotionLabel: {
    ...typo.caption,
    color: surface.textSecondary,
    textAlign: "center",
  },
  dismissButton: {
    alignItems: "center",
    paddingVertical: space.sm,
  },
  dismissLabel: {
    ...typo.caption,
    color: surface.textSecondary,
  },
});
