import type { ComponentType } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, Pressable } from "../../ui";
import { ChatImagePicker, ChatImagePreview } from "../../chat";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  space,
  typo,
} from "../../../theme";

const Ionicon = Ionicons as unknown as ComponentType<{
  name: "arrow-up";
  size: number;
  color: string;
}>;

export function PatientConversationComposer({
  text,
  onChangeText,
  isSending,
  isReadOnly = false,
  imageDataUri,
  onImageSelected,
  onRemoveImage,
  errorMessage,
  onDismissError,
  onSend,
  onLayout,
  bottomPadding,
}: {
  text: string;
  onChangeText: (value: string) => void;
  isSending: boolean;
  isReadOnly?: boolean;
  imageDataUri: string | null;
  onImageSelected: (value: string | null) => void;
  onRemoveImage: () => void;
  errorMessage: string | null;
  onDismissError: () => void;
  onSend: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
  bottomPadding: number;
}) {
  if (isReadOnly) {
    return null;
  }

  const isSendDisabled = isSending;

  return (
    <View
      style={[
        styles.footerDock,
        {
          paddingBottom: bottomPadding,
        },
      ]}
      onLayout={onLayout}
    >
      {imageDataUri ? (
        <View style={styles.imagePreviewRow}>
          <ChatImagePreview dataUri={imageDataUri} onRemove={onRemoveImage} />
        </View>
      ) : null}

      {errorMessage ? (
        <Pressable onPress={onDismissError}>
          <Text style={styles.errorMessageText}>{errorMessage}</Text>
        </Pressable>
      ) : null}

      <Card variant="muted" style={styles.composerCard}>
        <View style={styles.composerRow}>
          <ChatImagePicker
            onImageSelected={onImageSelected}
            disabled={isSendDisabled}
          />
          <TextInput
            style={styles.input}
            placeholder="아기에게 하고 싶은 말을 적어보세요..."
            placeholderTextColor={surface.textSecondary}
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
            <Ionicon name="arrow-up" size={20} color={surface.surfacePrimary} />
          </Pressable>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  footerDock: {
    gap: space.xs,
    paddingTop: space.xs,
    paddingHorizontal: space.lg,
    backgroundColor: surface.surfacePrimary,
  },
  imagePreviewRow: {
    alignItems: "flex-start",
    paddingHorizontal: space.xs,
  },
  composerCard: {
    paddingTop: space.xs,
    paddingBottom: space.xs,
    paddingLeft: space.xs,
    paddingRight: space.xs,
  },
  composerRow: {
    flexDirection: "row",
    gap: space.xs,
    alignItems: "center",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: space.xxxl * 3,
    borderRadius: radii.xl,
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
