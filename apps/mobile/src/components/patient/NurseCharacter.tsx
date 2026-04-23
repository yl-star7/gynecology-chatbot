import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { useState } from "react";
import { patientSurfacePalette as surface, radii } from "../../theme";
import {
  getCachedNurseImageSource,
  subscribeNurseImageCache,
} from "../../core/nurseImageCache";

export type EmotionTone = "calm" | "joyful" | "anxious" | "tired" | "sad";

const NURSE_IMAGES: Record<EmotionTone | "neutral", number> = {
  neutral: require("../../../assets/branding/penguin-nurse/neutral.png"),
  calm: require("../../../assets/branding/penguin-nurse/calm.png"),
  joyful: require("../../../assets/branding/penguin-nurse/joyful.png"),
  anxious: require("../../../assets/branding/penguin-nurse/anxious.png"),
  tired: require("../../../assets/branding/penguin-nurse/tired.png"),
  sad: require("../../../assets/branding/penguin-nurse/sad.png"),
};

function resolveNurseImage(tone?: EmotionTone | null): ImageSourcePropType {
  return tone ? NURSE_IMAGES[tone] : NURSE_IMAGES.neutral;
}

function useNurseImageSource(emotionTone?: EmotionTone | null) {
  const [didRemoteFail, setDidRemoteFail] = useState(false);
  const [remoteSource, setRemoteSource] = useState(() =>
    getCachedNurseImageSource(emotionTone),
  );

  useEffect(() => {
    setDidRemoteFail(false);
    setRemoteSource(getCachedNurseImageSource(emotionTone));
    return subscribeNurseImageCache(() => {
      setDidRemoteFail(false);
      setRemoteSource(getCachedNurseImageSource(emotionTone));
    });
  }, [emotionTone]);

  return {
    source: didRemoteFail
      ? resolveNurseImage(emotionTone)
      : (remoteSource ?? resolveNurseImage(emotionTone)),
    handleError: () => setDidRemoteFail(true),
  };
}

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
  const { source: imageSource, handleError } = useNurseImageSource(emotionTone);

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

  return (
    <View style={styles.root}>
      <Animated.View
        style={[
          styles.characterWrap,
          {
            width: wrapperSize,
            height: wrapperSize,
            borderRadius: radii.full,
            backgroundColor: surface.surfaceSecondary,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={imageSource}
          style={{ width: imageSize, height: imageSize }}
          resizeMode="contain"
          accessibilityLabel="간호사 캐릭터"
          onError={handleError}
        />
      </Animated.View>
    </View>
  );
}

// ─── 채팅 메시지 아바타 (작은 버전) ───────────────────────
export function NurseAvatar({
  emotionTone,
  size = "md",
}: {
  emotionTone?: EmotionTone | null;
  size?: "sm" | "md";
}) {
  const avatarStyle = size === "sm" ? styles.avatarWrapSm : styles.avatarWrap;
  const imageStyle = size === "sm" ? styles.avatarImageSm : styles.avatarImage;
  const { source: imageSource, handleError } = useNurseImageSource(emotionTone);

  return (
    <View style={avatarStyle}>
      <Image
        source={imageSource}
        style={imageStyle}
        resizeMode="contain"
        accessibilityLabel="간호사 캐릭터"
        onError={handleError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
  },
  characterWrap: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  // ─── Avatar (채팅 메시지용) ───
  avatarWrap: {
    width: 54,
    height: 54,
    borderRadius: radii.xl,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 52,
    height: 52,
  },
  avatarWrapSm: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImageSm: {
    width: 42,
    height: 42,
  },
});
