import type { EmotionTone } from "@gynecology-chatbot/app-core";
import { Image, type ImageSourcePropType } from "react-native";
import {
  persistNativeStorageValue,
  readNativeStorageValue,
} from "./nativeSessionStorage";

export type NurseImageTone = EmotionTone | "neutral";

export type NurseImageManifest = {
  version: string;
  images: Record<NurseImageTone, string>;
};

const NURSE_IMAGE_CACHE_VERSION_KEY = "phedy-nurse-image-cache-version";
const NURSE_IMAGE_TONES: NurseImageTone[] = [
  "neutral",
  "calm",
  "joyful",
  "anxious",
  "tired",
  "sad",
];

let activeImages: Partial<Record<NurseImageTone, string>> = {};
const listeners = new Set<() => void>();

function isValidManifest(value: unknown): value is NurseImageManifest {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const manifest = value as Partial<NurseImageManifest>;
  return (
    typeof manifest.version === "string" &&
    manifest.version.trim().length > 0 &&
    Boolean(manifest.images) &&
    NURSE_IMAGE_TONES.every(
      (tone) =>
        typeof manifest.images?.[tone] === "string" &&
        manifest.images[tone].startsWith("https://"),
    )
  );
}

function emitNurseImageUpdate() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeNurseImageCache(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCachedNurseImageSource(
  tone?: NurseImageTone | null,
): ImageSourcePropType | null {
  const url = activeImages[tone ?? "neutral"];
  return url ? { uri: url } : null;
}

export async function syncNurseImageCache(manifest: unknown) {
  if (!isValidManifest(manifest)) {
    return;
  }

  activeImages = manifest.images;
  emitNurseImageUpdate();

  const previousVersion = await readNativeStorageValue(
    NURSE_IMAGE_CACHE_VERSION_KEY,
  );
  if (previousVersion === manifest.version) {
    return;
  }

  await Promise.allSettled(
    Object.values(manifest.images).map((url) => Image.prefetch(url)),
  );
  await persistNativeStorageValue(
    NURSE_IMAGE_CACHE_VERSION_KEY,
    manifest.version,
  );
}
