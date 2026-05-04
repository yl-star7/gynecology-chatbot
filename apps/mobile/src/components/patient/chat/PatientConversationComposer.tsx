import { useMemo, useState, type ComponentType } from "react";
import {
  PanResponder,
  StyleSheet,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "../../ui";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  space,
  typo,
} from "../../../theme";
import { useMobileTheme } from "../../../theme-provider";

const Ionicon = Ionicons as unknown as ComponentType<{
  name: "arrow-up";
  size: number;
  color: string;
}>;
const MIN_INPUT_HEIGHT = 44;
const MAX_INPUT_HEIGHT = space.xxxl * 5;

export function PatientConversationComposer({
  text,
  onChangeText,
  isSending,
  isReadOnly = false,
  errorMessage,
  onDismissError,
  onSend,
  onLayout,
  bottomPadding,
  keyboardBottomOffset = 0,
}: {
  text: string;
  onChangeText: (value: string) => void;
  isSending: boolean;
  isReadOnly?: boolean;
  errorMessage: string | null;
  onDismissError: () => void;
  onSend: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
  bottomPadding: number;
  keyboardBottomOffset?: number;
}) {
  const { surface: activeSurface } = useMobileTheme();
  const isSendDisabled = isSending;
  const [inputHeight, setInputHeight] = useState(MIN_INPUT_HEIGHT);
  const resizeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > 4,
        onPanResponderMove: (_, gestureState) => {
          setInputHeight((currentHeight) =>
            Math.max(
              MIN_INPUT_HEIGHT,
              Math.min(MAX_INPUT_HEIGHT, currentHeight - gestureState.dy),
            ),
          );
        },
      }),
    [],
  );

  if (isReadOnly) {
    return null;
  }

  return (
    <View
      style={[
        styles.footerDock,
        {
          bottom: keyboardBottomOffset,
          paddingBottom: bottomPadding,
        },
      ]}
      onLayout={onLayout}
    >
      {errorMessage ? (
        <Pressable onPress={onDismissError}>
          <Text style={styles.errorMessageText}>{errorMessage}</Text>
        </Pressable>
      ) : null}

      <View style={styles.composerBar}>
        <View
          style={styles.resizeHandleHitbox}
          {...resizeResponder.panHandlers}
          accessibilityRole="adjustable"
          accessibilityLabel="입력창 크기 조절"
        >
          <View style={styles.resizeHandle} />
        </View>
        <View style={styles.composerRow}>
          <TextInput
            style={[
              styles.input,
              {
                height: inputHeight,
                backgroundColor: activeSurface.fieldSurface,
                color: activeSurface.textPrimary,
              },
            ]}
            placeholder="아기에게 하고 싶은 말을 적어보세요..."
            placeholderTextColor={activeSurface.textSecondary}
            selectionColor={activeSurface.accentSolid}
            underlineColorAndroid="transparent"
            value={text}
            onChangeText={onChangeText}
            multiline
            maxLength={3000}
          />
          <Pressable
            style={
              isSendDisabled
                ? [styles.sendButton, styles.sendButtonDisabled]
                : styles.sendButton
            }
            onPress={onSend}
            disabled={isSendDisabled}
            accessibilityLabel="메시지 보내기"
          >
            <Ionicon name="arrow-up" size={20} color={activeSurface.surfacePrimary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerDock: {
    position: "absolute",
    left: 0,
    right: 0,
    gap: space.xs,
    paddingTop: space.sm,
    paddingHorizontal: space.md,
    backgroundColor: surface.surfacePrimary,
    zIndex: 20,
  },
  composerBar: {
    paddingVertical: space.xs,
  },
  resizeHandleHitbox: {
    alignSelf: "center",
    width: space.xxxl * 2,
    height: space.md,
    alignItems: "center",
    justifyContent: "center",
  },
  resizeHandle: {
    width: space.xxxl,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: surface.strokeSubtle,
  },
  composerRow: {
    flexDirection: "row",
    gap: space.sm,
    alignItems: "center",
  },
  input: {
    flex: 1,
    minHeight: MIN_INPUT_HEIGHT,
    maxHeight: MAX_INPUT_HEIGHT,
    borderRadius: radii.lg,
    backgroundColor: surface.fieldSurface,
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: space.sm,
    ...typo.body,
    color: surface.textPrimary,
    textAlignVertical: "top",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: palette.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  errorMessageText: {
    ...typo.caption,
    color: palette.errorText,
    textAlign: "center",
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
  },
});
