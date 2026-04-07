import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  space,
  typo,
} from "../../theme";

export type EmotionTone = "calm" | "joyful" | "anxious" | "tired" | "sad";

interface EmotionConfig {
  backgroundTint: string;
  bubbleText: string;
  accentColor: string;
}

const EMOTION_CONFIG: Record<EmotionTone, EmotionConfig> = {
  calm: {
    backgroundTint: "#EDE9FF",
    bubbleText: "차분하게 함께 있을게요. 오늘도 잘하고 있어요.",
    accentColor: "#7C6FCD",
  },
  joyful: {
    backgroundTint: "#FFF4E0",
    bubbleText: "기분이 좋으시군요! 저도 함께 기뻐요.",
    accentColor: "#F5A623",
  },
  anxious: {
    backgroundTint: "#E8F4FF",
    bubbleText: "걱정되는 게 있으시죠? 천천히 이야기해 주세요.",
    accentColor: "#4A90D9",
  },
  tired: {
    backgroundTint: "#EAFAF1",
    bubbleText: "많이 힘드시죠. 충분히 쉬어도 괜찮아요.",
    accentColor: "#27AE60",
  },
  sad: {
    backgroundTint: "#F5F5F5",
    bubbleText: "슬플 때 옆에 있어 드릴게요.",
    accentColor: "#7F8C8D",
  },
};

const NURSE_IMAGE = require("../../../assets/branding/fab-nurse.png");

interface NurseCharacterProps {
  emotionTone?: EmotionTone | null;
  size?: "sm" | "md" | "lg";
}

const SIZE_CONFIG = {
  sm: { imageSize: 44, wrapperSize: 52 },
  md: { imageSize: 64, wrapperSize: 76 },
  lg: { imageSize: 88, wrapperSize: 104 },
} as const;

export function NurseCharacter({
  emotionTone,
  size = "md",
}: NurseCharacterProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { imageSize, wrapperSize } = SIZE_CONFIG[size];

  // 감정 변경 시 통통 튀는 애니메이션
  useEffect(() => {
    if (!emotionTone) {
      return;
    }
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.12,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 6,
        stiffness: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [emotionTone, scaleAnim]);

  const config = emotionTone ? EMOTION_CONFIG[emotionTone] : null;
  const tint = config?.backgroundTint ?? surface.surfaceSecondary;

  return (
    <View style={styles.root}>
      <Animated.View
        style={[
          styles.characterWrap,
          {
            width: wrapperSize,
            height: wrapperSize,
            borderRadius: radii.full,
            backgroundColor: tint,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={NURSE_IMAGE}
          style={{ width: imageSize, height: imageSize }}
          resizeMode="contain"
          accessibilityLabel="간호사 캐릭터"
        />
      </Animated.View>

      {config ? (
        <View
          style={[
            styles.bubble,
            { borderColor: config.accentColor + "33" },
          ]}
        >
          <View
            style={[
              styles.bubbleTail,
              { borderRightColor: surface.surfacePrimary },
            ]}
          />
          <Text style={[styles.bubbleText, { color: config.accentColor }]}>
            {config.bubbleText}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── 채팅 메시지 아바타 (작은 버전) ───────────────────────
export function NurseAvatar({ emotionTone }: { emotionTone?: EmotionTone | null }) {
  const config = emotionTone ? EMOTION_CONFIG[emotionTone] : null;
  const tint = config?.backgroundTint ?? surface.surfaceSecondary;

  return (
    <View
      style={[
        styles.avatarWrap,
        { backgroundColor: tint },
      ]}
    >
      <Image
        source={NURSE_IMAGE}
        style={styles.avatarImage}
        resizeMode="contain"
        accessibilityLabel="간호사 캐릭터"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: space.sm,
  },
  characterWrap: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  bubble: {
    flex: 1,
    backgroundColor: surface.surfacePrimary,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    alignSelf: "center",
    position: "relative",
  },
  bubbleTail: {
    position: "absolute",
    left: -8,
    top: "50%",
    marginTop: -6,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightWidth: 8,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: surface.surfacePrimary,
  },
  bubbleText: {
    ...typo.caption,
    fontWeight: "600",
    lineHeight: 20,
  },
  // ─── Avatar (채팅 메시지용) ───
  avatarWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 24,
    height: 24,
  },
});
