// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback } from "react";
import {
  ActionSheetIOS,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import {
  palette,
  patientSurfacePalette as surface,
  radii,
  space,
} from "../../theme";

// ─── Types ─────────────────────────────────────────────────────────────────

interface ChatImagePickerProps {
  onImageSelected: (dataUri: string) => void;
  disabled?: boolean;
}

interface ChatImagePreviewProps {
  dataUri: string;
  onRemove: () => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === "granted";
}

async function requestMediaLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === "granted";
}

async function pickFromCamera(): Promise<string | null> {
  const granted = await requestCameraPermission();
  if (!granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    base64: true,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  if (!asset.base64) return null;

  const mimeType = asset.mimeType ?? "image/jpeg";
  return `data:${mimeType};base64,${asset.base64}`;
}

async function pickFromLibrary(): Promise<string | null> {
  const granted = await requestMediaLibraryPermission();
  if (!granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    base64: true,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  if (!asset.base64) return null;

  const mimeType = asset.mimeType ?? "image/jpeg";
  return `data:${mimeType};base64,${asset.base64}`;
}

// ─── ChatImagePicker ───────────────────────────────────────────────────────

export function ChatImagePicker(props: ChatImagePickerProps): JSX.Element {
  const { onImageSelected, disabled = false } = props;

  const handleSelection = useCallback(
    async (source: "camera" | "library") => {
      try {
        const dataUri =
          source === "camera"
            ? await pickFromCamera()
            : await pickFromLibrary();
        if (dataUri) {
          onImageSelected(dataUri);
        }
      } catch {
        // Silently ignore errors (e.g. permission denied after prompt)
      }
    },
    [onImageSelected],
  );

  const showActionSheet = useCallback(() => {
    if (disabled) return;

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["취소", "카메라로 촬영", "갤러리에서 선택"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleSelection("camera");
          if (buttonIndex === 2) handleSelection("library");
        },
      );
    } else {
      Alert.alert("이미지 첨부", undefined, [
        { text: "카메라로 촬영", onPress: () => handleSelection("camera") },
        { text: "갤러리에서 선택", onPress: () => handleSelection("library") },
        { text: "취소", style: "cancel" },
      ]);
    }
  }, [disabled, handleSelection]);

  return (
    <Pressable
      onPress={showActionSheet}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel="이미지 첨부"
      hitSlop={space.sm}
    >
      <Ionicons
        name="image-outline"
        size={32}
        color={disabled ? surface.strokeSubtle : surface.textSecondary}
      />
    </Pressable>
  );
}

// ─── ChatImagePreview ──────────────────────────────────────────────────────

export function ChatImagePreview(props: ChatImagePreviewProps): JSX.Element {
  const { dataUri, onRemove } = props;

  return (
    <View style={styles.previewContainer}>
      <Image
        source={{ uri: dataUri }}
        style={styles.previewImage}
        resizeMode="cover"
        accessibilityLabel="선택된 이미지 미리보기"
      />
      <Pressable
        onPress={onRemove}
        style={({ pressed }) => [
          styles.removeButton,
          pressed && styles.removeButtonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="이미지 제거"
        hitSlop={space.xs}
      >
        <Ionicons name="close-circle" size={18} color={palette.ink} />
      </Pressable>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const PREVIEW_SIZE = 64;

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    marginLeft: space.xs,
    padding: 0,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.6,
  },
  buttonDisabled: {
    opacity: 0.35,
  },

  previewContainer: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: radii.md,
    overflow: "hidden",
    backgroundColor: surface.surfaceSecondary,
  },
  previewImage: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
  },
  removeButton: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: surface.surfacePrimary,
    borderRadius: radii.full,
  },
  removeButtonPressed: {
    opacity: 0.7,
  },
});
